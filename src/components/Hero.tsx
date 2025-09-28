// src/components/Hero.tsx

/**
 * Hero section
 * - Mobile/Tablet: contained (shares the page container, perfectly centered).
 * - Desktop (lg+): full-bleed using 100dvw + margin breakout (no white strip).
 * - Keeps gradient overlay + CTA.
 */
export default function Hero() {
  const base =
    'https://images.unsplash.com/photo-1664825381616-5cb8397fd9b1?auto=format&fit=crop&ixlib=rb-4.1.0'

  return (
    <section className="pt-6 lg:pt-0 pb-6">

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-0">

        <div
          className="
            relative overflow-hidden rounded-2xl border shadow
            lg:rounded-none lg:border-0 lg:shadow-none
            lg:w-[100dvw] lg:ml-[calc(50%-50dvw)] lg:mr-[calc(50%-50dvw)]
          "
        >
          {/* background image (cover) */}
          <img
            src={`${base}&w=1920&q=70`}
            srcSet={`
              ${base}&w=768&q=60 768w,
              ${base}&w=1280&q=65 1280w,
              ${base}&w=1920&q=70 1920w
            `}
            sizes="(max-width: 1024px) 100vw, 1920px"
            alt="Norwegian fjord landscape with waterfalls and mountains"
            className="block h-[48vh] w-full object-cover md:h-[62vh]"
            decoding="async"
            fetchPriority="high"
          />

          {/* gradient overlay for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/40" />

          {/* centered foreground content */}
          <div className="absolute inset-0 flex items-center justify-center px-4">
            {/* Use the same max width as your content so text never looks too wide */}
            <div className="mx-auto max-w-3xl text-center text-white">
              <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                Holidaze — Discover Norway
              </h1>
              <p className="mt-3 text-sm text-white/90 md:text-lg">
                Find unique stays in fjords, mountains and vibrant cities across Norway.
              </p>

              <a
                href="#venues-list"
                className="btn-hero mt-6 inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              >
                Browse venues
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
