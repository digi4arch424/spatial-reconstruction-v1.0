import { useState, useEffect } from 'react'
import { wsUrl } from '../api/client'

// Terminal states — WebSocket closes after reaching these
const TERMINAL_STATES = new Set(['COMPLETE', 'FAILED'])

export function useReconStatus(reconstructionId) {
  const [status,    setStatus]    = useState(null)
  const [detail,    setDetail]    = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!reconstructionId) return

    const url = wsUrl(`/reconstructions/${reconstructionId}/ws`)
    const ws  = new WebSocket(url)

    ws.onopen = () => {
      setConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setStatus(data.status)
        setDetail(data.detail || null)
        // Server closes after terminal state but we close client side too
        if (TERMINAL_STATES.has(data.status)) {
          ws.close()
        }
      } catch {
        // Malformed message — ignore
      }
    }

    ws.onclose  = () => setConnected(false)
    ws.onerror  = () => setConnected(false)

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close()
    }
  }, [reconstructionId])

  return { status, detail, connected }
}
