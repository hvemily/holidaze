import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api'

type RegisterForm = {
  name: string
  email: string
  password: string
  venueManager: boolean
}

export default function Register() {
  const nav = useNavigate()
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    venueManager: false,
  })
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErr(null)
    try {
      await api.post('/auth/register', form)
      nav('/login')
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErr(error.message)
      } else {
        setErr('Registration failed')
      }
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
        />
        <input
          placeholder="stud.noroff.no email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-lg border px-3 py-2"
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="rounded-lg border px-3 py-2"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.venueManager}
            onChange={(e) =>
              setForm({ ...form, venueManager: e.target.checked })
            }
          />
          I am a Venue Manager
        </label>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="rounded-xl bg-black text-white px-4 py-2">
          Register
        </button>
      </form>
      <p className="text-sm mt-3">
        Have an account?{' '}
        <Link to="/login" className="underline">
          Login
        </Link>
      </p>
    </div>
  )
}
