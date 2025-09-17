// src/utils/api.ts
const BASE = import.meta.env.VITE_API_BASE || 'https://v2.api.noroff.dev'

let authToken = ''
let apiKey = ''

function headers() {
  return {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(apiKey ? { 'X-Noroff-API-Key': apiKey } : {}),
  }
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  let json: unknown = null
  try {
    json = await res.json()
  } catch {
    json = null
  }

  if (!res.ok) {
    // forsøk å lese feilmelding fra Noroff-formatet
    let message = res.statusText || `HTTP ${res.status}`
    if (json && typeof json === 'object' && 'errors' in (json as Record<string, unknown>)) {
      const errors = (json as { errors?: Array<{ message?: string }> }).errors
      if (Array.isArray(errors) && errors[0]?.message) {
        message = errors[0].message
      }
    }
    throw new Error(message)
  }

  return json as T
}

export const api = {
  setToken: (t: string) => { authToken = t },
  setApiKey: (k: string) => { apiKey = k },
  get:  <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put:  <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}

