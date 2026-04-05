// Empty string = same-origin (production via CloudFront proxy).
// Set VITE_API_URL=http://localhost:8000 for local dev without the Vite proxy.
const API_BASE = import.meta.env.VITE_API_URL ?? ''

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }

  return res.json()
}
