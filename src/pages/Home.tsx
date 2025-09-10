import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <section className="grid gap-4">
      <h1 className="text-3xl font-bold">Find your next stay</h1>
      <p className="text-gray-700 max-w-prose">
        Browse venues, check availability, and book securely.
      </p>
      <div className="flex gap-3">
        <Link to="/venues" className="rounded-xl bg-blue-600 text-white px-4 py-2">
          Browse Venues
        </Link>
        <Link to="/register" className="rounded-xl border px-4 py-2">
          Get Started
        </Link>
      </div>
    </section>
  )
}
