// =============================================================================
// API Client
// Base URL is set via Vite environment variable.
// Local dev:   VITE_API_URL=http://localhost:8000  (in .env)
// Production:  VITE_API_URL=https://[service].railway.app
// =============================================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── JSON POST ─────────────────────────────────────────────────────────────────

export async function apiPost(path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body)
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API ${response.status}: ${text}`)
  }
  return response.json()
}

// ── Multipart form POST ───────────────────────────────────────────────────────
// Used for ZIP file upload — browser sets the multipart boundary automatically.
// Do NOT set Content-Type manually here.

export async function apiPostForm(path, formData) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body:   formData
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API ${response.status}: ${text}`)
  }
  return response.json()
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function apiGet(path) {
  const response = await fetch(`${BASE_URL}${path}`)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API ${response.status}: ${text}`)
  }
  return response.json()
}

// ── WebSocket URL ─────────────────────────────────────────────────────────────
// Converts http:// → ws:// and https:// → wss://

export function wsUrl(path) {
  const base = BASE_URL
    .replace('http://',  'ws://')
    .replace('https://', 'wss://')
  return `${base}${path}`
}
