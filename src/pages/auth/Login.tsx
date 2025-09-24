import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/stores/auth'
import Spinner from '@/components/Spinner'

export default function Login() {
  const nav = useNavigate()
  const { success: toastSuccess, error: toastError } = useToast()
  const { login } = useAuth() // ⬅️ bruk store-metoden i stedet for setAuth

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toastError('Please enter your email and password.')
      return
    }
    try {
      setSubmitting(true)
      await login({ email, password }) 
      toastSuccess('Welcome back!')
      nav('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      toastError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="px-4">
      <section className="mx-auto w-full max-w-md py-12 md:py-16">
        <div className="rounded-2xl border bg-white shadow-lg overflow-hidden">
          <div className="h-28 w-full bg-[url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center" />
          <div className="p-6 sm:p-8">
            <h1 className="text-center text-2xl font-extrabold tracking-tight">HOLIDAZE</h1>
            <p className="mt-1 text-center text-sm text-gray-600">Login</p>

            <form onSubmit={onSubmit} className="mt-6 grid gap-4">
              <label className="grid gap-1">
                <span className="sr-only">Email</span>
                <input
                  type="email"
                  placeholder="Email (stud.noroff.no)"
                  autoComplete="username"
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
                  placeholder="Password"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="rounded-lg border px-3 py-2"
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
