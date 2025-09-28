// src/pages/auth/Login.tsx
/**
 * Login page.
 * - uses `useAuth().login` to authenticate.
 * - shows toasts on success/error.
 * - disables the submit button while submitting.
 * - uI: a centered card with a background photo + dark overlay for contrast.
 */
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/stores/auth'
import Spinner from '@/components/Spinner'

export default function Login() {
  const navigate = useNavigate()
  const { success: toastSuccess, error: toastError } = useToast()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // set the browser tab title
  useEffect(() => {
    document.title = 'Holidaze | Login'
  }, [])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return

    const emailClean = email.trim().toLowerCase()
    const passwordClean = password.trim()

    if (!emailClean || !passwordClean) {
      const msg = 'Please enter your email and password.'
      setErr(msg)
      toastError(msg)
      return
    }

    try {
      setSubmitting(true)
      setErr(null)

      await login({ email: emailClean, password: passwordClean })
      toastSuccess('Welcome back!')
      navigate('/')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Login failed'
      setErr(msg)
      toastError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // large background image inside the card
  const bg =
    "https://res.cloudinary.com/simpleview/image/upload/v1450120681/clients/norway/hiking-trolltunga-hardangerfjord-norway-2-1_353a98f6-1f27-4a0d-953c-f2267f4e4b20.jpg"

  return (
    <main className="px-4">
      {/* center the card; keep some vertical breathing room */}
      <section className="mx-auto w-full max-w-lg py-10 md:py-14">
        <div className="relative overflow-hidden rounded-2xl border shadow-lg">
          {/* background image + soft dark overlay to improve text contrast */}
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
            <p className="mt-1 text-center text-sm text-white/90">Login</p>

            {err && (
              <p
                className="mt-4 rounded-lg bg-red-600/90 px-3 py-2 text-sm"
                role="alert"
                aria-live="polite"
              >
                {err}
              </p>
            )}

            {/* form lives on top of the image; inputs are white to ensure legibility */}
            <form onSubmit={onSubmit} className="mt-6 grid gap-4" noValidate>
              <label className="grid gap-1">
                <span className="sr-only">Email</span>
                <input
                  type="email"
                  placeholder="Email (stud.noroff.no)"
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border bg-white px-3 py-2 text-gray-900"
                  aria-invalid={Boolean(err)}
                  required
                  autoFocus
                  spellCheck={false}
                />
              </label>

              <label className="grid gap-1">
                <span className="sr-only">Password</span>
                <input
                  type="password"
                  placeholder="Password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-lg border bg-white px-3 py-2 text-gray-900"
                  aria-invalid={Boolean(err)}
                  required
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className="btn-solid w-full"
              >
                {submitting ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Spinner size="sm" /> Signing in…
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-white/90">
              No account?{' '}
              <Link
                to="/register"
                className="underline underline-offset-2 hover:text-white"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
