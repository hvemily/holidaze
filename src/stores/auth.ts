// src/stores/auth.ts
import { create } from 'zustand'
import type { Profile } from '../utils/types'
import { api } from '../utils/api'

type LoginPayload = { email: string; password: string }

type AuthState = {
  user: Profile | null
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
}

function loadUser(): Profile | null {
  try {
    return JSON.parse(localStorage.getItem('auth:user') || 'null')
  } catch {
    return null
  }
}

function loadApiKey(): string {
  try {
    return localStorage.getItem('auth:apiKey') || ''
  } catch {
    return ''
  }
}

/** Noroff v2: API-key respons kan være string eller objekt */
type ApiKeyObject = { key?: string; apiKey?: string }
type ApiKeyResponse = { data: ApiKeyObject | string }

async function ensureApiKey(): Promise<string> {
  const existing = loadApiKey()
  if (existing) return existing

  const res = await api.post<ApiKeyResponse>('/auth/create-api-key', {})
  const data = res?.data

  let key = ''
  if (typeof data === 'string') {
    key = data
  } else if (data) {
    key = data.key ?? data.apiKey ?? ''
  }

  if (!key) throw new Error('Failed to create API key')

  localStorage.setItem('auth:apiKey', key)
  return key
}

export const useAuth = create<AuthState>((set) => ({
  user: loadUser(),
  login: async ({ email, password }) => {
    const res = await api.post<{ data: Profile }>('/auth/login', { email, password })
    const user = res.data

    localStorage.setItem('auth:user', JSON.stringify(user))
    api.setToken(user.accessToken || '')

    try {
      const key = await ensureApiKey()
      api.setApiKey(key)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : e
      console.warn('Could not create/load API key:', msg)
    }

    set({ user })
  },
  logout: () => {
    localStorage.removeItem('auth:user')
    localStorage.removeItem('auth:apiKey')
    api.setToken('')
    api.setApiKey('')
    set({ user: null })
  },
}))

// init token + apiKey på app-load
api.setToken(loadUser()?.accessToken || '')
api.setApiKey(loadApiKey())
