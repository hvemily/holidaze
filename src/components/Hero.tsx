// src/components/Hero.tsx
export default function Hero() {
  const img =
    'https://images.unsplash.com/photo-1664825381616-5cb8397fd9b1?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'

  return (
    <section className="relative h-[56vh] md:h-[68vh]">
      {/* bg image */}
      <img
        src={img}
        alt="Norwegian fjord landscape with waterfalls and mountains"
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />
      {/* overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/40" />

      {/* content */}
      <div className="relative z-10 flex h-full items-center justify-center px-4">
        <div className="text-center text-white">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Holidaze — Discover Norway
          </h1>
          <p className="mt-3 text-sm md:text-lg text-white/90 max-w-xl mx-auto">
            Find unique stays in fjords, mountains and vibrant cities across Norway.
          </p>

          {/* Optional CTA – scroll til liste */}
          <a
            href="#venues-list"
            className="inline-block mt-6 rounded-full bg-white/90 text-gray-900 px-5 py-2 text-sm font-medium hover:bg-white"
          >
            Browse venues
          </a>
        </div>
      </div>
    </section>
  )
}
