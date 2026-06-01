import { useState, useCallback } from 'react'
import { apiPost, apiPostForm } from '../api/client'

// Upload state machine — mirrors reconstruction pipeline entry states
export const UPLOAD_STATUS = {
  IDLE:        'IDLE',        // nothing happening
  REGISTERING: 'REGISTERING', // POST /sessions
  ZIPPING:     'ZIPPING',     // generating ZIP blob in memory
  UPLOADING:   'UPLOADING',   // POST /sessions/{id}/upload
  QUEUED:      'QUEUED',      // job on Redis queue, reconstruction_id returned
  ERROR:       'ERROR'        // something failed
}

export function useUpload() {
  const [uploadStatus,      setUploadStatus]      = useState(UPLOAD_STATUS.IDLE)
  const [reconstructionId,  setReconstructionId]  = useState(null)
  const [progress,          setProgress]          = useState(0)  // 0–100
  const [error,             setError]             = useState(null)

  // ── Main upload function ────────────────────────────────────────────────
  // sessionId:   browser-generated session ID (used as primary key everywhere)
  // frameCount:  number of frames in the session
  // getZipBlob:  async function returning a Blob — provided by useFrameStore

  const upload = useCallback(async (sessionId, frameCount, getZipBlob) => {
    setError(null)
    setProgress(0)

    try {
      // Step 1 — Register session with API
      setUploadStatus(UPLOAD_STATUS.REGISTERING)
      await apiPost('/sessions', {
        id:          sessionId,
        frame_count: frameCount
      })
      setProgress(20)

      // Step 2 — Generate ZIP blob in browser memory
      setUploadStatus(UPLOAD_STATUS.ZIPPING)
      const blob = await getZipBlob()
      if (!blob) throw new Error('ZIP generation failed — no frames in session')
      setProgress(50)

      // Step 3 — Upload ZIP to API → S3 → Redis queue
      setUploadStatus(UPLOAD_STATUS.UPLOADING)
      const formData = new FormData()
      formData.append('file', blob, `session-${sessionId}.zip`)

      const result = await apiPostForm(`/sessions/${sessionId}/upload`, formData)
      setProgress(100)

      setReconstructionId(result.reconstruction_id)
      setUploadStatus(UPLOAD_STATUS.QUEUED)
      return result.reconstruction_id

    } catch (err) {
      setError(err.message)
      setUploadStatus(UPLOAD_STATUS.ERROR)
      return null
    }
  }, [])

  // ── Reset — called when session is cleared ───────────────────────────────
  const resetUpload = useCallback(() => {
    setUploadStatus(UPLOAD_STATUS.IDLE)
    setReconstructionId(null)
    setProgress(0)
    setError(null)
  }, [])

  return {
    uploadStatus,
    reconstructionId,
    progress,
    error,
    upload,
    resetUpload
  }
}
