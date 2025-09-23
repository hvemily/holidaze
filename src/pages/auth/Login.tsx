// src/pages/auth/Login.tsx
import type { FormEvent } from 'react'
import { useState } from 'react'
import { useLocation, useNavigate, Link, type Location } from 'react-router-dom'
import { useAuth } from '@/stores/auth'
import { useToast } from '@/components/Toast'

type LocationState = { from?: { pathname: string } }

export default function Login() {
  const { login } = useAuth()
  const { success, error: toastError } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const nav = useNavigate()
  const loc = useLocation() as Location & { state?: LocationState }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login({ email, password })
      success('Welcome back 👋')
      nav(loc.state?.from?.pathname || '/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      toastError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-4">Login</h1>

      <form onSubmit={onSubmit} className="grid gap-3">
        <input
          placeholder="Email (stud.noroff.no)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border px-3 py-2"
          inputMode="email"
          autoComplete="email"
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border px-3 py-2"
          autoComplete="current-password"
          required
        />

        <button
          className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-sm mt-3">
        No account? <Link to="/register" className="underline">Register</Link>
      </p>
    </div>
  )
}
