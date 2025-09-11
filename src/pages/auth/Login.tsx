import type { FormEvent } from 'react'
import { useState } from 'react'
import { useLocation, useNavigate, Link, type Location } from 'react-router-dom'
import { useAuth } from '../../stores/auth'

type LocationState = {
  from?: { pathname: string }
}

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const nav = useNavigate()
  const loc = useLocation() as Location & { state?: LocationState }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await login({ email, password })
      nav(loc.state?.from?.pathname || '/')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Login failed')
      }
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
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border px-3 py-2"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="rounded-xl bg-black text-white px-4 py-2">Sign in</button>
      </form>
      <p className="text-sm mt-3">
        No account? <Link to="/register" className="underline">Register</Link>
      </p>
    </div>
  )
}
