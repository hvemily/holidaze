// src/pages/auth/Register.tsx
/**
 * Registration page.
 * - creates account via `/auth/register`.
 * - auto-logs in using `useAuth().login` on success.
 * - shows toasts for success/error and disables submit while pending.
 * - uI: a centered card with a background photo + dark overlay for contrast.
 */
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/utils/api'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/stores/auth'
import Spinner from '@/components/Spinner'

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

  // large background image inside the card (Trolltunga)
  const bg =
    'https://res.cloudinary.com/simpleview/image/upload/v1450120681/clients/norway/hiking-trolltunga-hardangerfjord-norway-2-1_353a98f6-1f27-4a0d-953c-f2267f4e4b20.jpg'

  return (
    <main className="px-4">
      <section className="mx-auto w-full max-w-lg py-10 md:py-14">
        <div className="relative overflow-hidden rounded-2xl border shadow-lg">
          {/* background image + overlay */}
          <img
            src={bg}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            decoding="async"
          />
          <div className="absolute inset-0 bg-black/45" />

          {/* foreground content */}
          <div className="relative z-10 p-6 sm:p-8 text-white">
            <h1 className="text-center text-3xl font-extrabold tracking-tight">
              HOLIDAZE
            </h1>
            <p className="mt-1 text-center text-sm text-white/90">Create account</p>

            {err && (
              <p
                className="mt-4 rounded-lg bg-red-600/90 px-3 py-2 text-sm"
                role="alert"
                aria-live="polite"
              >
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
                  className="rounded-lg border bg-white px-3 py-2 text-gray-900"
                  aria-invalid={Boolean(err)}
                  autoComplete="name"
                  required
                />
              </label>

              {/* Email */}
              <label className="grid gap-1">
                <span className="sr-only">Email</span>
                <input
                  type="email"
                  placeholder="stud.noroff.no email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border bg-white px-3 py-2 text-gray-900"
                  aria-invalid={Boolean(err)}
                  inputMode="email"
                  autoComplete="username"
                  spellCheck={false}
                  required
                />
              </label>

              {/* Password */}
              <label className="grid gap-1">
                <span className="sr-only">Password</span>
                <input
                  type="password"
                  placeholder="Password (min 8 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-lg border bg-white px-3 py-2 text-gray-900"
                  aria-invalid={Boolean(err)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              {/* Venue manager */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={venueManager}
                  onChange={(e) => setVenueManager(e.target.checked)}
                  className="h-4 w-4 rounded border bg-white"
                />
                I am a Venue Manager
              </label>

              {/* Submit */}
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

            <p className="mt-4 text-center text-sm text-white/90">
              Have an account?{' '}
              <Link
                to="/login"
                className="underline underline-offset-2 hover:text-white"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
