import json
import redis.asyncio as aioredis
from .config import settings

# ── Queue names ───────────────────────────────────────────────────────────────
# Single source of truth for all Redis list keys used as job queues.
# Workers and the API both import from here — no magic strings elsewhere.
# Each pipeline stage has its own queue so workers can scale independently.

QUEUE_SFM            = "queue:sfm"
QUEUE_DENSE          = "queue:dense"
QUEUE_MESH           = "queue:mesh"
QUEUE_SPLAT          = "queue:splat"
QUEUE_SEMANTIC       = "queue:semantic"

# Backward-compat alias — existing sfm-worker reads QUEUE_RECONSTRUCTION.
# Once the worker is updated (Session 3), this alias can be removed.
QUEUE_RECONSTRUCTION = QUEUE_SFM

# ── Pub/sub channel ───────────────────────────────────────────────────────────

CHANNEL_PIPELINE     = "channel:pipeline"   # Status updates → browser WebSocket

# ── Collaboration key (Level 19) ──────────────────────────────────────────────

KEY_COLLAB_DOC       = "collab:{id}:yjsdoc"


# ── Redis dependency ──────────────────────────────────────────────────────────

async def get_redis():
    """
    FastAPI dependency — yields an async Redis client per request.
    """
    client = aioredis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
    )
    try:
        yield client
    finally:
        await client.aclose()


# ── Job helpers ───────────────────────────────────────────────────────────────

async def enqueue_sfm(client: aioredis.Redis, job: dict) -> None:
    """
    Push a SFM job onto the queue.
    Workers consume from the right with BRPOP.

    Job payload:
    {
        "reconstruction_id": "uuid",
        "session_id":        "abc123",
        "frame_manifest":    [
            { "frame_number": 1, "s3_key": "sessions/.../frames/frame-001-{ts}.jpg" },
            ...
        ],
        "frame_count":       30
    }
    """
    await client.lpush(QUEUE_SFM, json.dumps(job))


async def enqueue_reconstruction(client: aioredis.Redis, job: dict) -> None:
    """
    Backward-compat wrapper — routes to enqueue_sfm.
    Existing call sites in sessions.py (ZIP upload path) continue to work.
    """
    await enqueue_sfm(client, job)


# ── Status pub/sub ────────────────────────────────────────────────────────────

async def publish_status(
    client: aioredis.Redis,
    reconstruction_id: str,
    status: str,
    detail: dict | None = None,
) -> None:
    """
    Publish a pipeline status update to the browser via pub/sub.
    The WebSocket endpoint subscribes to CHANNEL_PIPELINE and
    forwards messages to the connected client.

    Message shape:
    {
        "reconstruction_id": "uuid",
        "status":            "SFM_RUNNING",
        "detail":            { ... }   # optional stage-specific data
    }
    """
    message = {
        "reconstruction_id": reconstruction_id,
        "status":            status,
        "detail":            detail or {},
    }
    await client.publish(CHANNEL_PIPELINE, json.dumps(message))
