// src/pages/auth/Register.tsx
import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/utils/api'
import { useToast } from '@/components/Toast'

type RegisterForm = {
  name: string
  email: string
  password: string
  venueManager: boolean
}

export default function Register() {
  const nav = useNavigate()
  const { success, error: toastError } = useToast()

  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    venueManager: false,
  })
  const [submitting, setSubmitting] = useState(false)

  const isNoroffEmail = (e: string) =>
    /@(stud\.)?noroff\.no$/i.test(e.trim())

  async function onSubmit(e: FormEvent) {
    e.preventDefault()

    // Enkel klientvalidering
    if (!form.name.trim()) {
      toastError('Please enter your name')
      return
    }
    if (!isNoroffEmail(form.email)) {
      toastError('Use your @stud.noroff.no email')
      return
    }
    if (form.password.trim().length < 8) {
      toastError('Password must be at least 8 characters')
      return
    }

    try {
      setSubmitting(true)
      await api.post('/auth/register', form)
      success('Account created — please sign in 👋', 3000)
      nav('/login')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      toastError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create account</h1>

      <form onSubmit={onSubmit} className="grid gap-3">
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-lg border px-3 py-2"
          autoComplete="name"
          required
        />
        <input
          placeholder="stud.noroff.no email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-lg border px-3 py-2"
          inputMode="email"
          autoComplete="email"
          required
        />
        <input
          placeholder="Password (min 8 chars)"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="rounded-lg border px-3 py-2"
          autoComplete="new-password"
          required
          minLength={8}
        />

        <label className="flex items-center gap-2 text-sm select-none">
          <input
            type="checkbox"
            checked={form.venueManager}
            onChange={(e) =>
              setForm({ ...form, venueManager: e.target.checked })
            }
          />
          I am a Venue Manager
        </label>

        <button
          className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? 'Creating account…' : 'Register'}
        </button>
      </form>

      <p className="text-sm mt-3">
        Have an account? <Link to="/login" className="underline">Login</Link>
      </p>
    </div>
  )
}
