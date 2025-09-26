// src/pages/auth/Login.tsx
/**
 * Login page.
 * - Uses `useAuth().login` to authenticate.
 * - Shows toasts on success/error.
 * - Disables the submit button while submitting.
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

  // Set the browser tab title
  useEffect(() => {
    document.title = 'Holidaze | Login'
  }, [])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return

    const emailClean = email.trim().toLowerCase()
    const passwordClean = password.trim()

    if (!emailClean || !passwordClean) {
      setErr('Please enter your email and password.')
      toastError('Please enter your email and password.')
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

  return (
    <main className="px-4">
      <section className="mx-auto w-full max-w-md py-12 md:py-16">
        <div className="overflow-hidden rounded-2xl border bg-white shadow-lg">
          <div className="h-28 w-full bg-cover bg-center [background-image:url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop')]" />
          <div className="p-6 sm:p-8">
            <h1 className="text-center text-2xl font-extrabold tracking-tight">HOLIDAZE</h1>
            <p className="mt-1 text-center text-sm text-gray-600">Login</p>

            {err && (
              <p className="mt-4 text-sm text-red-600" role="alert" aria-live="polite">
                {err}
              </p>
            )}

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
                  className="rounded-lg border px-3 py-2"
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
                  className="rounded-lg border px-3 py-2"
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

            <p className="mt-4 text-center text-sm text-gray-600">
              No account?{' '}
              <Link to="/register" className="underline underline-offset-2">
                Register
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
