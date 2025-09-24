import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/utils/api'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/stores/auth'
import Spinner from '@/components/Spinner'

export default function Register() {
  const nav = useNavigate()
  const { success: toastSuccess, error: toastError } = useToast()
  const { login } = useAuth() // ⬅️ bruker login for auto-innlogging etter register

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [venueManager, setVenueManager] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!/^[^@]+@stud\.noroff\.no$/i.test(email)) {
      toastError('Email must be a stud.noroff.no address.')
      return
    }
    if (password.length < 8) {
      toastError('Password must be at least 8 characters.')
      return
    }

    try {
      setSubmitting(true)
      // Opprett bruker
      await api.post('/auth/register', { name, email, password, venueManager })
      // Auto-login via store (oppdaterer token+user riktig i hele appen)
      await login({ email, password }) // ✅ ett objekt
      toastSuccess('Account created!')
      nav('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      toastError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="px-4">
      <section className="mx-auto w-full max-w-md py-12 md:py-16">
        <div className="rounded-2xl border bg-white shadow-lg overflow-hidden">
          <div className="h-28 w-full bg-[url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center" />
          <div className="p-6 sm:p-8">
            <h1 className="text-center text-2xl font-extrabold tracking-tight">HOLIDAZE</h1>
            <p className="mt-1 text-center text-sm text-gray-600">Create account</p>

            <form onSubmit={onSubmit} className="mt-6 grid gap-4">
              <label className="grid gap-1">
                <span className="sr-only">Name</span>
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="rounded-lg border px-3 py-2"
                  required
                />
              </label>

              <label className="grid gap-1">
                <span className="sr-only">Email</span>
                <input
                  type="email"
                  placeholder="stud.noroff.no email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="rounded-lg border px-3 py-2"
                  required
                />
              </label>

              <label className="grid gap-1">
                <span className="sr-only">Password</span>
                <input
                  type="password"
                  placeholder="Password (min 8 chars)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="rounded-lg border px-3 py-2"
                  required
                  minLength={8}
                />
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={venueManager}
                  onChange={e => setVenueManager(e.target.checked)}
                  className="h-4 w-4 rounded border"
                />
                I am a Venue Manager
              </label>

              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className="btn-solid w-full"
              >
                {submitting ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Spinner size="sm" /> Creating…
                  </span>
                ) : (
                  'Create user'
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-600">
              Have an account?{' '}
              <Link to="/login" className="underline underline-offset-2">
                Login
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
