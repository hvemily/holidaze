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

async function request<T>(method: 'GET'|'POST'|'PUT'|'DELETE', path: string, body?: any): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = (json as any)?.errors?.[0]?.message || res.statusText
    throw new Error(msg)
  }
  return json as T
}

export const api = {
  setToken: (t: string) => { authToken = t },
  setApiKey: (k: string) => { apiKey = k },
  get:  <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: any) => request<T>('POST', path, body),
  put:  <T>(path: string, body?: any) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
