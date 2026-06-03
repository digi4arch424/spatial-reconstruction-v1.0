import { useState, useEffect } from 'react'
import { wsUrl, apiGet } from '../api/client'

// Terminal states — WebSocket closes after reaching these
const TERMINAL_STATES = new Set(['COMPLETE', 'FAILED'])

// Stages at which a mesh URL is available
const MESH_READY_STATES = new Set([
  'MESH_COMPLETE', 'TEXTURE_QUEUED', 'TEXTURE_RUNNING',
  'TEXTURE_COMPLETE', 'SPLAT_QUEUED', 'SPLAT_RUNNING',
  'SPLAT_COMPLETE', 'SEMANTIC_QUEUED', 'SEMANTIC_RUNNING', 'COMPLETE'
])

export function useReconStatus(reconstructionId) {
  const [status,    setStatus]    = useState(null)
  const [detail,    setDetail]    = useState(null)
  const [connected, setConnected] = useState(false)
  const [meshUrl,   setMeshUrl]   = useState(null)

  // ── WebSocket — real-time pipeline status ─────────────────────────────
  useEffect(() => {
    if (!reconstructionId) return

    const url = wsUrl(`/reconstructions/${reconstructionId}/ws`)
    const ws  = new WebSocket(url)

    ws.onopen    = () => setConnected(true)
    ws.onclose   = () => setConnected(false)
    ws.onerror   = () => setConnected(false)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setStatus(data.status)
        setDetail(data.detail || null)
        if (TERMINAL_STATES.has(data.status)) ws.close()
      } catch {
        // Malformed message — ignore
      }
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close()
    }
  }, [reconstructionId])

  // ── Fetch mesh URL when pipeline reaches MESH_COMPLETE ────────────────
  // The API returns a presigned S3 URL valid for 1 hour.
  useEffect(() => {
    if (!reconstructionId || !status) return
    if (!MESH_READY_STATES.has(status)) return
    if (meshUrl) return  // already fetched

    apiGet(`/reconstructions/${reconstructionId}`)
      .then(data => {
        if (data.mesh_path) setMeshUrl(data.mesh_path)
      })
      .catch(err => console.error('Could not fetch mesh URL:', err))
  }, [reconstructionId, status, meshUrl])

  return { status, detail, connected, meshUrl }
}
