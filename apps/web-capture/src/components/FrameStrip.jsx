const FRAME_TARGET = 30

export function FrameStrip({ frames, onDelete, onExport }) {
  if (frames.length === 0) return null

  const count     = frames.length
  const pct       = Math.min(count / FRAME_TARGET, 1)
  const barColor  = pct < 0.4 ? 'var(--red)' : pct < 0.8 ? '#f59e0b' : 'var(--green)'
  const label     = pct < 0.4 ? 'NEEDS MORE FRAMES'
                  : pct < 1.0 ? 'ALMOST READY'
                  : 'READY FOR RECONSTRUCTION'

  return (
    <div style={{
      borderTop: '1px solid var(--muted)',
      background: 'var(--bg-surface)',
      flexShrink: 0
    }}>

      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px 6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 9, letterSpacing: 4, color: 'var(--text-dim)' }}>SESSION FRAMES</span>
          <span style={{ fontSize: 11, letterSpacing: 2, color: barColor, fontWeight: 600 }}>
            {count} / {FRAME_TARGET}
          </span>
          <span style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)' }}>{label}</span>
        </div>
        <button
          onClick={onExport}
          style={{
            padding: '4px 14px',
            background: 'rgba(0,170,255,0.08)',
            border: '1px solid var(--blue-dim)',
            color: 'var(--blue)',
            fontFamily: 'var(--mono)',
            fontSize: 10, letterSpacing: 2, cursor: 'pointer'
          }}
        >↓ EXPORT ZIP</button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: 'var(--muted)', margin: '0 16px 8px' }}>
        <div style={{
          height: '100%', width: `${pct * 100}%`,
          background: barColor,
          transition: 'width 0.3s, background 0.3s'
        }} />
      </div>

      {/* Scrollable filmstrip */}
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto', overflowY: 'hidden',
        padding: '0 16px 10px',
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--muted) transparent'
      }}>
        {frames.map((frame) => (
          <div
            key={frame.id}
            style={{
              position: 'relative', flexShrink: 0,
              width: 72, height: 54,
              border: `1px solid ${frame.isBlurry ? 'var(--red)' : 'var(--muted)'}`,
              cursor: 'default', overflow: 'hidden'
            }}
          >
            <img
              src={frame.dataUrl}
              alt={`Frame ${frame.frameNumber}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: frame.isBlurry ? 0.5 : 0.85 }}
            />

            {/* Frame number */}
            <div style={{
              position: 'absolute', bottom: 2, left: 3,
              fontSize: 8, letterSpacing: 1,
              color: frame.isBlurry ? 'var(--red)' : 'var(--text-dim)'
            }}>
              {String(frame.frameNumber).padStart(3, '0')}
            </div>

            {/* Blur badge */}
            {frame.isBlurry && (
              <div style={{
                position: 'absolute', top: 2, left: 2,
                fontSize: 7, letterSpacing: 1,
                color: 'var(--red)', background: 'rgba(0,0,0,0.7)',
                padding: '1px 3px'
              }}>BLUR</div>
            )}

            {/* Delete button */}
            <button
              onClick={() => onDelete(frame.id)}
              style={{
                position: 'absolute', top: 2, right: 2,
                width: 14, height: 14,
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid var(--muted)',
                color: 'var(--text-dim)',
                fontSize: 8, lineHeight: '12px',
                cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
