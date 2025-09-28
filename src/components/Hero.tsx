// src/components/Hero.tsx

/**
 * Hero section for the landing page.
 * - Renders a large responsive Unsplash background image.
 * - Uses srcSet + sizes for responsive loading.
 * - Includes gradient overlay for text readability.
 * - Provides a call-to-action link to scroll down to the venues list.
 */
export default function Hero() {
  // Base Unsplash image URL (without width/quality params).
  const base =
    'https://images.unsplash.com/photo-1664825381616-5cb8397fd9b1?auto=format&fit=crop&ixlib=rb-4.1.0'

  return (
    <section
      className="
        full-bleed           /* 👈 makes this section go edge-to-edge */
        relative
        h-[56vh] md:h-[68vh]
      "
    >
      {/* Responsive background image */}
      <img
        src={`${base}&w=1920&q=70`}
        srcSet={`
          ${base}&w=768&q=60   768w,
          ${base}&w=1280&q=65 1280w,
          ${base}&w=1920&q=70 1920w,
          ${base}&w=2560&q=70 2560w
        `}
        sizes="100vw"
        alt="Norwegian fjord landscape with waterfalls and mountains"
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
        decoding="async"
      />

      {/* Gradient overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/40" />

      {/* Foreground content */}
      <div className="relative z-10 flex h-full items-center justify-center px-4">
        <div className="mx-auto max-w-3xl text-center text-white">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Holidaze — Discover Norway
          </h1>
          <p className="mt-3 text-sm text-white/90 md:text-lg">
            Find unique stays in fjords, mountains and vibrant cities across
            Norway.
          </p>

          {/* CTA link scrolls down to venues list */}
          <a
            href="#venues-list"
            className="btn-hero mt-6 inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            Browse venues
          </a>
        </div>
      </div>
    </section>
  )
}
