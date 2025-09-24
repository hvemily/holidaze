export default function Hero() {
  const img =
    'https://images.unsplash.com/photo-1664825381616-5cb8397fd9b1?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.1.0'

  return (
    <section
      className="
        relative h-[56vh] md:h-[68vh]
        w-screen
        ml-[calc(50%-50vw)] mr-[calc(50%-50vw)]
      "
    >
      <img
        src={img}
        alt="Norwegian fjord landscape with waterfalls and mountains"
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/40" />
      <div className="relative z-10 flex h-full items-center justify-center px-4">
        <div className="text-center text-white max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Holidaze — Discover Norway
          </h1>
          <p className="mt-3 text-sm md:text-lg text-white/90">
            Find unique stays in fjords, mountains and vibrant cities across Norway.
          </p>
          <a href="#venues-list" className="inline-block mt-6 btn-hero">
            Browse venues
          </a>

        </div>
      </div>
    </section>
  )
}
