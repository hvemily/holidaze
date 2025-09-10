// src/stores/auth.ts
import { create } from 'zustand'
import type { Profile } from '../utils/types';
import { api } from '../utils/api'

type LoginPayload = { email: string; password: string }
type AuthState = {
  user: Profile | null
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
}

function loadUser(): Profile | null {
  try { return JSON.parse(localStorage.getItem('auth:user') || 'null') }
  catch { return null }
}

function loadApiKey(): string {
  try { return localStorage.getItem('auth:apiKey') || '' }
  catch { return '' }
}

async function ensureApiKey(): Promise<string> {
  const existing = loadApiKey()
  if (existing) return existing
  // Noroff v2 endpoint for å lage API key:
  // svarformen kan variere, vi forsøker å hente 'key' eller 'apiKey' feltet.
  const res = await api.post<{ data: any }>('/auth/create-api-key', {})
  const data = (res as any)?.data
  const key = data?.key || data?.apiKey || (typeof data === 'string' ? data : '')
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

    // Hent/lag API key og sett den på klienten
    try {
      const key = await ensureApiKey()
      api.setApiKey(key)
    } catch (e) {
      console.warn('Could not create/load API key:', e)
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
