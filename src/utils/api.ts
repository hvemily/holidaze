// src/utils/api.ts

/** Base URL for Noroff v2 API (from env or fallback). */
const BASE = import.meta.env.VITE_API_BASE || 'https://v2.api.noroff.dev'

let authToken = ''
let apiKey = ''

/** Build default headers for requests. */
function buildHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(apiKey ? { 'X-Noroff-API-Key': apiKey } : {}),
  }
}

/**
 * Perform a fetch request with JSON handling and Noroff error parsing.
 *
 * @param method - HTTP verb
 * @param path - API path, starting with `/`
 * @param body - Optional request body (JSON serialized if present)
 */
async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: buildHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  let json: unknown = null
  try {
    json = await res.json()
  } catch {
    // no content or invalid JSON – keep as null
  }

  if (!res.ok) {
    // Try to extract a useful error message (Noroff style: { errors: [{ message }] })
    let message = res.statusText || `HTTP ${res.status}`
    if (
      json &&
      typeof json === 'object' &&
      'errors' in (json as Record<string, unknown>)
    ) {
      const errors = (json as { errors?: Array<{ message?: string }> }).errors
      if (Array.isArray(errors) && errors[0]?.message) {
        message = errors[0].message
      }
    }
    throw new Error(message)
  }

  return json as T
}

/**
 * Shared API client with token + API key support.
 * Call `setToken`/`setApiKey` on login to configure.
 */
export const api = {
  /** Set bearer token for subsequent requests. */
  setToken: (t: string) => { authToken = t },

  /** Set Noroff API key for subsequent requests. */
  setApiKey: (k: string) => { apiKey = k },

  /** Shorthand GET. */
  get: <T>(path: string) => request<T>('GET', path),

  /** Shorthand POST. */
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),

  /** Shorthand PUT. */
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),

  /** Shorthand DELETE. */
  delete: <T>(path: string) => request<T>('DELETE', path),
}
