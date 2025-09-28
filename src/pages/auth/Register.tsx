// src/pages/auth/Register.tsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/utils/api'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/stores/auth'
import Spinner from '@/components/Spinner'

/**
 * registration page.
 * - creates account via `/auth/register`.
 * - auto-logs in using `useAuth().login` on success.
 * - shows toasts for success/error and disables submit while pending.
 */
export default function Register() {
  const navigate = useNavigate()
  const { success: toastSuccess, error: toastError } = useToast()
  const { login } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [venueManager, setVenueManager] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // set document title
  useEffect(() => {
    document.title = 'Holidaze | Register'
  }, [])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return

    const nameClean = name.trim()
    const emailClean = email.trim().toLowerCase()
    const passwordClean = password.trim()

    if (!nameClean) {
      const msg = 'Please enter your name.'
      setErr(msg); toastError(msg); return
    }
    if (!/^[^@]+@stud\.noroff\.no$/i.test(emailClean)) {
      const msg = 'Email must be a stud.noroff.no address.'
      setErr(msg); toastError(msg); return
    }
    if (passwordClean.length < 8) {
      const msg = 'Password must be at least 8 characters.'
      setErr(msg); toastError(msg); return
    }

    try {
      setSubmitting(true)
      setErr(null)

      // create user
      await api.post('/auth/register', {
        name: nameClean,
        email: emailClean,
        password: passwordClean,
        venueManager,
      })

      // auto-login via store (updates token+user globally)
      await login({ email: emailClean, password: passwordClean })

      toastSuccess('Account created!')
      navigate('/')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Registration failed'
      setErr(msg)
      toastError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="px-4">
      <section className="mx-auto w-full max-w-md py-12 md:py-16">
        <div className="overflow-hidden rounded-2xl border bg-white shadow-lg">
          <div className="h-28 w-full bg-cover bg-center [background-image:url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop')]" />
          <div className="p-6 sm:p-8">
            <h1 className="text-center text-2xl font-extrabold tracking-tight">HOLIDAZE</h1>
            <p className="mt-1 text-center text-sm text-gray-600">Create account</p>

            {err && (
              <p className="mt-4 text-sm text-red-600" role="alert" aria-live="polite">
                {err}
              </p>
            )}

            <form onSubmit={onSubmit} className="mt-6 grid gap-4" noValidate>
              {/* Name */}
              <label className="grid gap-1">
                <span className="sr-only">Name</span>
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-lg border px-3 py-2"
                  aria-invalid={Boolean(err)}
                  autoComplete="name"
                  required
                />
              </label>

              {/* email */}
              <label className="grid gap-1">
                <span className="sr-only">Email</span>
                <input
                  type="email"
                  placeholder="stud.noroff.no email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border px-3 py-2"
                  aria-invalid={Boolean(err)}
                  inputMode="email"
                  autoComplete="username"
                  spellCheck={false}
                  required
                />
              </label>

              {/* password */}
              <label className="grid gap-1">
                <span className="sr-only">Password</span>
                <input
                  type="password"
                  placeholder="Password (min 8 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-lg border px-3 py-2"
                  aria-invalid={Boolean(err)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              {/* venue manager */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={venueManager}
                  onChange={(e) => setVenueManager(e.target.checked)}
                  className="h-4 w-4 rounded border"
                />
                I am a Venue Manager
              </label>

              {/* submit */}
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
