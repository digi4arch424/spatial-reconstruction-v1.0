const FRAME_TARGET = 30

// Pipeline stage → display color and percentage complete
const PIPELINE = {
  UPLOADED:         { color: 'var(--text-dim)', pct: 5   },
  SFM_QUEUED:       { color: '#f59e0b',         pct: 10  },
  SFM_RUNNING:      { color: '#f59e0b',         pct: 22  },
  SFM_COMPLETE:     { color: '#f59e0b',         pct: 33  },
  MVS_QUEUED:       { color: '#f59e0b',         pct: 38  },
  MVS_RUNNING:      { color: '#f59e0b',         pct: 48  },
  MVS_COMPLETE:     { color: '#f59e0b',         pct: 55  },
  MESH_QUEUED:      { color: 'var(--blue)',      pct: 60  },
  MESH_RUNNING:     { color: 'var(--blue)',      pct: 65  },
  MESH_COMPLETE:    { color: 'var(--blue)',      pct: 70  },
  TEXTURE_QUEUED:   { color: 'var(--blue)',      pct: 74  },
  TEXTURE_RUNNING:  { color: 'var(--blue)',      pct: 78  },
  TEXTURE_COMPLETE: { color: 'var(--blue)',      pct: 82  },
  SPLAT_QUEUED:     { color: '#06b6d4',          pct: 85  },
  SPLAT_RUNNING:    { color: '#06b6d4',          pct: 90  },
  SPLAT_COMPLETE:   { color: '#06b6d4',          pct: 94  },
  SEMANTIC_QUEUED:  { color: 'var(--green)',     pct: 96  },
  SEMANTIC_RUNNING: { color: 'var(--green)',     pct: 98  },
  COMPLETE:         { color: 'var(--green)',     pct: 100 },
  FAILED:           { color: 'var(--red)',        pct: 0   },
}

export function FrameStrip({
  frames,
  onDelete,
  onExport,
  onUpload,
  uploadStatus   = 'IDLE',
  uploadProgress = 0,
  progressLabel  = '',
  uploadError    = null,
  reconStatus    = null,
  reconConnected = false
}) {
  if (frames.length === 0 && uploadStatus === 'IDLE') return null

  const count    = frames.length
  const pct      = Math.min(count / FRAME_TARGET, 1)
  const barColor = pct < 0.4 ? 'var(--red)' : pct < 0.8 ? '#f59e0b' : 'var(--green)'
  const label    = pct < 0.4 ? 'NEEDS MORE FRAMES'
                 : pct < 1.0 ? 'ALMOST READY'
                 : 'READY'

  const isUploading = ['REGISTERING','ZIPPING','UPLOADING'].includes(uploadStatus)
  const isQueued    = uploadStatus === 'QUEUED'
  const isError     = uploadStatus === 'ERROR'

  const pipeline    = reconStatus ? PIPELINE[reconStatus] : null

  return (
    <div style={{ borderTop: '1px solid var(--muted)', background: 'var(--bg-surface)', flexShrink: 0 }}>

      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 9, letterSpacing: 4, color: 'var(--text-dim)' }}>SESSION FRAMES</span>
          <span style={{ fontSize: 11, letterSpacing: 2, color: barColor, fontWeight: 600 }}>{count} / {FRAME_TARGET}</span>
          {!isUploading && !isQueued && (
            <span style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)' }}>{label}</span>
          )}
          {isQueued && reconStatus && (
            <span style={{ fontSize: 9, letterSpacing: 2, color: pipeline?.color || 'var(--text-dim)' }}>
              {reconStatus.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Buttons — hidden during upload */}
        {!isUploading && !isQueued && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onExport} style={{
              padding: '4px 12px', background: 'transparent',
              border: '1px solid var(--muted)', color: 'var(--text-dim)',
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: 2, cursor: 'pointer'
            }}>↓ ZIP</button>
            <button onClick={onUpload} disabled={count === 0} style={{
              padding: '4px 12px',
              background: count > 0 ? 'rgba(57,232,62,0.08)' : 'transparent',
              border: `1px solid ${count > 0 ? 'var(--green)' : 'var(--muted)'}`,
              color: count > 0 ? 'var(--green)' : 'var(--text-dim)',
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: 2,
              cursor: count > 0 ? 'pointer' : 'not-allowed', opacity: count > 0 ? 1 : 0.4
            }}>↑ UPLOAD</button>
          </div>
        )}

        {/* Upload in progress indicator */}
        {isUploading && (
          <span style={{ fontSize: 10, letterSpacing: 2, color: 'var(--green)' }}>
            ◌ {progressLabel || uploadStatus} {uploadProgress}%
          </span>
        )}

        {/* Queued — pipeline running */}
        {isQueued && (
          <span style={{ fontSize: 9, letterSpacing: 2, color: reconConnected ? 'var(--green)' : 'var(--text-dim)' }}>
            {reconConnected ? '● PIPELINE LIVE' : '○ CONNECTING...'}
          </span>
        )}
      </div>

      {/* ── Upload progress bar ─────────────────────────────────────────── */}
      {isUploading && (
        <div style={{ height: 2, background: 'var(--muted)', margin: '0 16px 4px' }}>
          <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--green)', transition: 'width 0.3s' }} />
        </div>
      )}

      {/* ── Pipeline progress bar (after upload) ────────────────────────── */}
      {isQueued && pipeline && (
        <div style={{ margin: '0 16px 4px' }}>
          <div style={{ height: 2, background: 'var(--muted)' }}>
            <div style={{ height: '100%', width: `${pipeline.pct}%`, background: pipeline.color, transition: 'width 0.6s' }} />
          </div>
        </div>
      )}

      {/* ── Frame target progress bar ───────────────────────────────────── */}
      {!isUploading && !isQueued && (
        <div style={{ height: 2, background: 'var(--muted)', margin: '0 16px 8px' }}>
          <div style={{ height: '100%', width: `${pct * 100}%`, background: barColor, transition: 'width 0.3s, background 0.3s' }} />
        </div>
      )}

      {/* ── Error message ───────────────────────────────────────────────── */}
      {isError && uploadError && (
        <div style={{ padding: '4px 16px 6px', fontSize: 10, letterSpacing: 2, color: 'var(--red)' }}>
          ✕ {uploadError}
        </div>
      )}

      {/* ── Scrollable filmstrip ────────────────────────────────────────── */}
      {frames.length > 0 && (
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto', overflowY: 'hidden',
          padding: '0 16px 10px',
          scrollbarWidth: 'thin', scrollbarColor: 'var(--muted) transparent'
        }}>
          {frames.map(frame => (
            <div key={frame.id} style={{
              position: 'relative', flexShrink: 0, width: 72, height: 54,
              border: `1px solid ${frame.isBlurry ? 'var(--red)' : 'var(--muted)'}`,
              overflow: 'hidden'
            }}>
              <img src={frame.dataUrl} alt={`Frame ${frame.frameNumber}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: frame.isBlurry ? 0.5 : 0.85 }} />
              <div style={{ position: 'absolute', bottom: 2, left: 3, fontSize: 8, letterSpacing: 1, color: frame.isBlurry ? 'var(--red)' : 'var(--text-dim)' }}>
                {String(frame.frameNumber).padStart(3, '0')}
              </div>
              {frame.isBlurry && (
                <div style={{ position: 'absolute', top: 2, left: 2, fontSize: 7, letterSpacing: 1, color: 'var(--red)', background: 'rgba(0,0,0,0.7)', padding: '1px 3px' }}>BLUR</div>
              )}
              <button onClick={() => onDelete(frame.id)} style={{
                position: 'absolute', top: 2, right: 2, width: 14, height: 14,
                background: 'rgba(0,0,0,0.7)', border: '1px solid var(--muted)',
                color: 'var(--text-dim)', fontSize: 8, cursor: 'pointer',
                padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
