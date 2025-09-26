// src/stores/auth.ts
import { create } from 'zustand'
import type { Profile } from '../utils/types'
import { api } from '../utils/api'

/** LocalStorage keys kept in one place for consistency. */
const STORAGE_USER_KEY = 'auth:user'
const STORAGE_API_KEY  = 'auth:apiKey'

type LoginPayload = { email: string; password: string }

type AuthState = {
  /** Currently authenticated user (or null). */
  user: Profile | null
  /** Perform login, store credentials, init API token & API key. */
  login: (payload: LoginPayload) => Promise<void>
  /** Clear everything and reset client tokens. */
  logout: () => void
}

/** Safely parse a JSON string, returning null on failure. */
function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/** Load persisted user from storage. */
function loadUser(): Profile | null {
  return safeParse<Profile>(localStorage.getItem(STORAGE_USER_KEY))
}

/** Load persisted API key from storage. */
function loadApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_API_KEY) || ''
  } catch {
    return ''
  }
}

/** Noroff v2: API-key shape can vary. */
type ApiKeyObject = { key?: string; apiKey?: string }
type ApiKeyResponse = { data: ApiKeyObject | string }

/**
 * Ensure an API key exists. If missing, create via backend and persist.
 * Returns the API key string.
 */
async function ensureApiKey(): Promise<string> {
  const existing = loadApiKey()
  if (existing) return existing

  const res = await api.post<ApiKeyResponse>('/auth/create-api-key', {})
  const data = res?.data

  let key = ''
  if (typeof data === 'string') key = data
  else if (data) key = data.key ?? data.apiKey ?? ''

  if (!key) throw new Error('Failed to create API key')

  localStorage.setItem(STORAGE_API_KEY, key)
  return key
}

/**
 * Auth store
 * - Persists user and API key in LocalStorage.
 * - Configures the shared API client with accessToken and API key.
 */
export const useAuth = create<AuthState>((set) => ({
  user: loadUser(),

  async login({ email, password }) {
    // 1) Authenticate
    const res = await api.post<{ data: Profile }>('/auth/login', { email, password })
    const user = res.data

    // 2) Persist & configure token for subsequent requests
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user))
    api.setToken(user.accessToken || '')

    // 3) Ensure API key exists and configure client with it
    try {
      const key = await ensureApiKey()
      api.setApiKey(key)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      // Non-fatal: user is logged in, but some requests may require an API key.
      console.warn('Could not create/load API key:', msg)
    }

    set({ user })
  },

  logout() {
    // Clear storage and client tokens
    localStorage.removeItem(STORAGE_USER_KEY)
    localStorage.removeItem(STORAGE_API_KEY)
    api.setToken('')
    api.setApiKey('')
    set({ user: null })
  },
}))

// Initialize API client on app load (in case of refresh)
api.setToken(loadUser()?.accessToken || '')
api.setApiKey(loadApiKey())
