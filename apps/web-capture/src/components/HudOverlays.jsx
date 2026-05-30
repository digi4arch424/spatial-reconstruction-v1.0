import { useState, useEffect } from 'react'

const FRAME_TARGET = 30

// ─── CAPTURE GUIDE ────────────────────────────────────────────────────────────
// Shown when camera is locked. Prompts the user to orbit the subject
// and shows frame target progress for AR-quality capture.

export function CaptureGuide({ frameCount }) {
  const pct      = Math.min(frameCount / FRAME_TARGET, 1)
  const barColor = pct < 0.4 ? 'var(--red)' : pct < 0.8 ? '#f59e0b' : 'var(--green)'

  return (
    <div style={{
      position: 'absolute', top: 16, right: 16, zIndex: 5,
      pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6
    }}>
      {/* Orbit icon + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(57,232,62,0.7)' }}>
          ORBIT SUBJECT
        </span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2 A7 7 0 1 1 2 9" stroke="rgba(57,232,62,0.7)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
          <polyline points="2,6 2,9 5,9" stroke="rgba(57,232,62,0.7)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Frame target bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, letterSpacing: 2, color: barColor }}>
          {frameCount} / {FRAME_TARGET}
        </span>
        <div style={{ width: 60, height: 3, background: 'rgba(255,255,255,0.1)' }}>
          <div style={{
            height: '100%', width: `${pct * 100}%`,
            background: barColor, transition: 'width 0.3s, background 0.3s'
          }} />
        </div>
      </div>
    </div>
  )
}

export function CornerBrackets({ color = 'var(--green)', size = 24, thickness = 2, gap = 14 }) {
  const s = { position: 'absolute', width: size, height: size }
  const shared = { border: `${thickness}px solid ${color}` }
  return (
    <>
      <span style={{ ...s, top: gap, left: gap, borderRight: 'none', borderBottom: 'none', ...shared }} />
      <span style={{ ...s, top: gap, right: gap, borderLeft: 'none', borderBottom: 'none', ...shared }} />
      <span style={{ ...s, bottom: gap, left: gap, borderRight: 'none', borderTop: 'none', ...shared }} />
      <span style={{ ...s, bottom: gap, right: gap, borderLeft: 'none', borderTop: 'none', ...shared }} />
    </>
  )
}

export function Crosshair({ active }) {
  const c = active ? 'var(--green)' : 'var(--muted)'
  return (
    <svg
      style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 60, height: 60,
        opacity: active ? 1 : 0.4,
        transition: 'opacity 0.3s'
      }}
      viewBox="0 0 60 60"
      fill="none"
    >
      <circle cx="30" cy="30" r="10" stroke={c} strokeWidth="1" />
      <line x1="30" y1="0"  x2="30" y2="16" stroke={c} strokeWidth="1" />
      <line x1="30" y1="44" x2="30" y2="60" stroke={c} strokeWidth="1" />
      <line x1="0"  y1="30" x2="16" y2="30" stroke={c} strokeWidth="1" />
      <line x1="44" y1="30" x2="60" y2="30" stroke={c} strokeWidth="1" />
    </svg>
  )
}

export function ScanLine({ scanning }) {
  const [pos, setPos] = useState(0)

  useEffect(() => {
    if (!scanning) return
    let frame, p = 0
    const animate = () => {
      p = (p + 0.4) % 100
      setPos(p)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [scanning])

  if (!scanning) return null

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0,
      top: `${pos}%`, height: 2,
      background: 'linear-gradient(90deg, transparent, rgba(57,232,62,0.6), transparent)',
      pointerEvents: 'none', zIndex: 4
    }} />
  )
}
