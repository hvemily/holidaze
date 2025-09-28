// src/stores/auth.ts
import { create } from 'zustand'
import type { Profile } from '../utils/types'
import { api } from '../utils/api'

/** LocalStorage keys used to persist auth state between reloads. */
const STORAGE_USER_KEY = 'auth:user'
const STORAGE_API_KEY  = 'auth:apiKey'

/** Payload the login endpoint expects. */
type LoginPayload = { email: string; password: string }

/**
 * shape of the authentication store.
 * - `user` reflects the currently signed-in profile (or `null`).
 * - `login` performs a network login, persists user + tokens, and updates the API client.
 * - `logout` clears all persisted credentials and resets the API client.
 * - `patchUser` allows updating parts of the in-memory user (and LocalStorage) to keep the UI in sync
 *   after profile edits (e.g. avatar/banner) without requiring a full re-login.
 */
type AuthState = {
  user: Profile | null
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
  /** merge-patch the in-memory (and persisted) user; triggers rerenders. */
  patchUser: (patch: Partial<Profile>) => void
}

/**
 * safely parse JSON; returns `null` on failure instead of throwing.
 * useful when reading from LocalStorage where data may be missing or stale.
 */
function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/** load the persisted user from LocalStorage, if present. */
function loadUser(): Profile | null {
  return safeParse<Profile>(localStorage.getItem(STORAGE_USER_KEY))
}

/** load the persisted API key from LocalStorage, if present. */
function loadApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_API_KEY) || ''
  } catch {
    return ''
  }
}

/** Noroff v2: API-key response may be a string or an object; support both shapes. */
type ApiKeyObject = { key?: string; apiKey?: string }
type ApiKeyResponse = { data: ApiKeyObject | string }

/**
 * ensure an API key exists for the current user.
 * - if a key is already persisted, reuse it.
 * - otherwise create a new key via `/auth/create-api-key`, persist it, and return it.
 * @throws Error when the API key could not be created.
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
 * authentication store:
 * - persists `user` and API key in LocalStorage so sessions survive page reloads.
 * - configures the shared API client (`api`) with the current access token and API key.
 */
export const useAuth = create<AuthState>((set, get) => ({
  /** initial user state is loaded from LocalStorage on store creation. */
  user: loadUser(),

  /**
   * perform login against the backend.
   * - on success: persist the user, set the Bearer token, ensure API key, and update store state.
   * - if API key creation fails we log a warning, but still keep the user logged in.
   */
  async login({ email, password }) {
    // 1) authenticate and receive profile (including accessToken).
    const res = await api.post<{ data: Profile }>('/auth/login', { email, password })
    const user = res.data

    // 2) persist the user and configure Bearer token for subsequent requests.
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user))
    api.setToken(user.accessToken || '')

    // 3) ensure an API key is available and set it on the API client.
    try {
      const key = await ensureApiKey()
      api.setApiKey(key)
    } catch (e) {
      // non-fatal: some endpoints may rely on X-Noroff-API-Key; we surface a warning for debugging.
      console.warn('Could not create/load API key:', e instanceof Error ? e.message : e)
    }

    // 4) update in-memory state to trigger UI rerenders.
    set({ user })
  },

  /**
   * clear all authentication state:
   * - remove persisted user and API key.
   * - reset API client headers.
   * - null out the in-memory user (triggers rerender).
   */
  logout() {
    localStorage.removeItem(STORAGE_USER_KEY)
    localStorage.removeItem(STORAGE_API_KEY)
    api.setToken('')
    api.setApiKey('')
    set({ user: null })
  },

  /**
   * merge-patch the current user in memory and in LocalStorage.
   * use this after profile edits (e.g., avatar/banner update) to ensure
   * the header/menu and other subscribers reflect changes immediately.
   * @param patch partial user fields to merge into the existing profile.
   */
patchUser(patch) {
  const current = get().user
  if (!current) return

  // create a new object reference so Zustand subscribers re-render.
  const next = { ...current, ...patch }
  set({ user: next })

  try {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(next))
  } catch (err) {
    console.warn('Failed to persist user to localStorage', err)
  }
},
}))

/**
 * on app bootstrap (cold reload), hydrate the API client with any persisted
 * tokens so that early requests (before first login) have the correct headers.
 */
api.setToken(loadUser()?.accessToken || '')
api.setApiKey(loadApiKey())
