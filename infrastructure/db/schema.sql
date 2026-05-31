-- =============================================================================
-- SPATIAL RECON GAME — Database Schema
-- PostgreSQL 16+ with pgvector extension
-- Compatible with Supabase (online) and local Docker
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =============================================================================
-- STATUS ENUMERATIONS
-- Defined as check constraints for flexibility — no migration needed to add
-- new states during development.
-- =============================================================================

-- Session lifecycle
-- CAPTURING   → user is actively taking photos in the browser
-- EXPORTED    → session ZIP has been downloaded by the user
-- UPLOADING   → ZIP is being sent to the backend
-- UPLOADED    → ZIP received, queued for reconstruction
-- PROCESSING  → reconstruction pipeline is running
-- COMPLETE    → all pipeline stages finished successfully
-- FAILED      → pipeline failed at some stage

-- Reconstruction pipeline stages (matches status flow in schema design)
-- PENDING → UPLOADING → UPLOADED →
-- SFM_QUEUED → SFM_RUNNING → SFM_COMPLETE →
-- MVS_QUEUED → MVS_RUNNING → MVS_COMPLETE →
-- MESH_QUEUED → MESH_RUNNING → MESH_COMPLETE →
-- TEXTURE_QUEUED → TEXTURE_RUNNING → TEXTURE_COMPLETE →
-- SPLAT_QUEUED → SPLAT_RUNNING → SPLAT_COMPLETE →
-- SEMANTIC_QUEUED → SEMANTIC_RUNNING →
-- COMPLETE | FAILED

-- =============================================================================
-- TABLE: sessions
-- Root entity. Created in the browser when camera initialises.
-- The session ID is browser-generated (timestamp36 + random suffix)
-- and serves as the primary key across ALL systems — DB, S3, Redis, Neo4j.
-- =============================================================================

CREATE TABLE sessions (
  id           VARCHAR(32)  PRIMARY KEY,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  status       VARCHAR(32)  NOT NULL DEFAULT 'CAPTURING'
                            CHECK (status IN (
                              'CAPTURING','EXPORTED','UPLOADING',
                              'UPLOADED','PROCESSING','COMPLETE','FAILED'
                            )),
  frame_count  INTEGER      NOT NULL DEFAULT 0,
  device_info  JSONB,       -- { userAgent, platform, screen }
  metadata     JSONB        -- extensible, no schema lock-in
);

-- =============================================================================
-- TABLE: frames
-- One row per captured image within a session.
-- storage_path is the canonical S3/R2 path — never store binary here.
-- orientation captured from DeviceOrientation API at capture time.
-- =============================================================================

CREATE TABLE frames (
  id             SERIAL       PRIMARY KEY,
  session_id     VARCHAR(32)  NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  frame_number   INTEGER      NOT NULL,
  timestamp      BIGINT       NOT NULL,  -- unix ms, matches browser IndexedDB value
  storage_path   TEXT         NOT NULL,  -- sessions/{id}/frames/frame-001-{ts}.jpg
  thumbnail_path TEXT,                   -- sessions/{id}/frames/thumbs/frame-001.jpg
  is_blurry      BOOLEAN      NOT NULL DEFAULT FALSE,
  orientation    JSONB,                  -- { alpha, beta, gamma } or null
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  UNIQUE (session_id, frame_number)
);

-- =============================================================================
-- TABLE: reconstructions
-- One reconstruction per pipeline run against a session.
-- A session can have multiple reconstructions (e.g. rescan, retry).
-- Each S3 path column fills in as the pipeline stage completes.
-- camera_poses is the direct JSON output of COLMAP — stored for downstream use.
-- =============================================================================

CREATE TABLE reconstructions (
  id                   UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id           VARCHAR(32)  NOT NULL REFERENCES sessions(id),
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  status               VARCHAR(32)  NOT NULL DEFAULT 'PENDING'
                                    CHECK (status IN (
                                      'PENDING','UPLOADING','UPLOADED',
                                      'SFM_QUEUED','SFM_RUNNING','SFM_COMPLETE',
                                      'MVS_QUEUED','MVS_RUNNING','MVS_COMPLETE',
                                      'MESH_QUEUED','MESH_RUNNING','MESH_COMPLETE',
                                      'TEXTURE_QUEUED','TEXTURE_RUNNING','TEXTURE_COMPLETE',
                                      'SPLAT_QUEUED','SPLAT_RUNNING','SPLAT_COMPLETE',
                                      'SEMANTIC_QUEUED','SEMANTIC_RUNNING',
                                      'COMPLETE','FAILED'
                                    )),
  failed_at_stage      VARCHAR(32), -- populated on FAILED, enables targeted retry
  error_message        TEXT,        -- human-readable failure reason

  -- Pipeline output paths (S3/R2) — null until that stage completes
  sparse_cloud_path    TEXT,        -- sessions/{id}/reconstruction/sparse/points3D.ply
  dense_cloud_path     TEXT,        -- sessions/{id}/reconstruction/dense/cloud.ply
  mesh_path            TEXT,        -- sessions/{id}/reconstruction/mesh/mesh.obj
  textured_mesh_path   TEXT,        -- sessions/{id}/reconstruction/textured/mesh.obj
  splat_path           TEXT,        -- sessions/{id}/reconstruction/splat/scene.splat

  -- SfM metadata (populated after SFM_COMPLETE)
  camera_poses         JSONB,       -- raw COLMAP output
  registered_frames    INTEGER,     -- how many frames COLMAP successfully used
  total_frames         INTEGER,     -- total frames submitted

  -- Scene geometry (populated after MESH_COMPLETE)
  bounding_box         JSONB,       -- { min: {x,y,z}, max: {x,y,z} }
  scale_factor         FLOAT,       -- 1 unit = ? meters (null until anchored)

  -- Quality signal (populated after each major stage)
  quality_score        INTEGER      CHECK (quality_score BETWEEN 0 AND 100)
);

-- =============================================================================
-- TABLE: scene_objects
-- Semantically identified objects extracted from a reconstruction.
-- embedding uses pgvector for CLIP similarity search.
-- One reconstruction → many scene objects.
-- These are the atoms of the intelligence layer and scene graph.
-- =============================================================================

CREATE TABLE scene_objects (
  id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  reconstruction_id   UUID         NOT NULL REFERENCES reconstructions(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  label               VARCHAR(128),            -- 'chair', 'table', 'wall' etc.
  confidence          FLOAT        CHECK (confidence BETWEEN 0 AND 1),
  embedding           vector(512),             -- CLIP ViT-B/32 embedding
  mesh_segment_path   TEXT,                    -- sessions/{id}/objects/{obj_id}/segment.ply
  bounding_box_3d     JSONB,                   -- { min: {x,y,z}, max: {x,y,z} }
  centroid            JSONB                    -- { x, y, z }
);

-- =============================================================================
-- TABLE: spatial_anchors
-- Maps a reconstruction's internal coordinate system to real-world space.
-- This is the foundation of AR anchoring at Level 18.
-- One reconstruction can have multiple anchors (e.g. GPS + marker).
-- =============================================================================

CREATE TABLE spatial_anchors (
  id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  reconstruction_id   UUID         NOT NULL REFERENCES reconstructions(id),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  anchor_type         VARCHAR(32)  NOT NULL
                                   CHECK (anchor_type IN ('origin','marker','gps')),
  world_position      JSONB        NOT NULL,   -- { x, y, z }
  world_rotation      JSONB        NOT NULL,   -- { x, y, z, w } quaternion
  scale               FLOAT        NOT NULL DEFAULT 1.0,  -- 1 unit = 1 meter
  reference_frame     VARCHAR(32)  NOT NULL DEFAULT 'local'
                                   CHECK (reference_frame IN ('local','WGS84','ARKit','ARCore'))
);

-- =============================================================================
-- TABLE: collaborative_sessions
-- Multi-user session layered on top of a reconstruction (Level 19).
-- crdt_doc_key is the Redis key holding the Yjs CRDT document.
-- participants is a JSON array of user identifiers.
-- =============================================================================

CREATE TABLE collaborative_sessions (
  id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  reconstruction_id   UUID         NOT NULL REFERENCES reconstructions(id),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  participants        JSONB        NOT NULL DEFAULT '[]',
  crdt_doc_key        TEXT         NOT NULL   -- Redis key: collab:{id}:yjsdoc
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Frames: primary lookup by session
CREATE INDEX idx_frames_session_id       ON frames(session_id);
CREATE INDEX idx_frames_session_number   ON frames(session_id, frame_number);

-- Reconstructions: lookup by session, by status for queue workers
CREATE INDEX idx_reconstructions_session ON reconstructions(session_id);
CREATE INDEX idx_reconstructions_status  ON reconstructions(status);

-- Scene objects: lookup by reconstruction, vector similarity search
CREATE INDEX idx_scene_objects_recon     ON scene_objects(reconstruction_id);
CREATE INDEX idx_scene_objects_label     ON scene_objects(label);
CREATE INDEX idx_scene_objects_embedding ON scene_objects
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Spatial anchors: lookup by reconstruction
CREATE INDEX idx_spatial_anchors_recon   ON spatial_anchors(reconstruction_id);

-- Collaborative sessions: lookup by reconstruction
CREATE INDEX idx_collab_recon            ON collaborative_sessions(reconstruction_id);

-- =============================================================================
-- TRIGGERS — auto-update updated_at timestamps
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER reconstructions_updated_at
  BEFORE UPDATE ON reconstructions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER collaborative_sessions_updated_at
  BEFORE UPDATE ON collaborative_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- VIEWS — convenience queries used across the API
-- =============================================================================

-- Latest reconstruction per session with session info
CREATE VIEW session_reconstruction_status AS
SELECT
  s.id           AS session_id,
  s.status       AS session_status,
  s.frame_count,
  r.id           AS reconstruction_id,
  r.status       AS reconstruction_status,
  r.quality_score,
  r.registered_frames,
  r.failed_at_stage,
  r.updated_at   AS last_updated
FROM sessions s
LEFT JOIN reconstructions r ON r.session_id = s.id
  AND r.created_at = (
    SELECT MAX(created_at) FROM reconstructions
    WHERE session_id = s.id
  );
