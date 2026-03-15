import Image from "next/image"
import Link from "next/link"

export default function Hero() {
  return (
    <section className="relative min-h-screen w-full">

      {/* ── Background Image ── */}
      <Image
        src="/hero.jpg"
        alt="Hero"
        fill
        priority
        className="object-cover object-center"
      />

      {/* ── Gradient Overlay ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20 sm:bg-gradient-to-r sm:from-black/75 sm:via-black/45 sm:to-transparent" />

      {/* ── Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen flex items-end sm:items-center pb-10 sm:pb-0">

        <div className="w-full max-w-xs sm:max-w-xl lg:max-w-3xl text-white">

          {/* ── Category + Meta ── */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm uppercase tracking-widest text-gray-300">
            <span>March 2026</span>
            <span className="bg-orange-500 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-white text-xs font-medium">
              Design
            </span>
            <span>6 min read</span>
          </div>

          {/* ── Title ── */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold leading-tight tracking-tight">
            The Quiet Revolution in How We Think About Space
          </h1>

          {/* ── Description ── */}
          <p className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg text-gray-300 max-w-xs sm:max-w-sm lg:max-w-xl leading-relaxed">
            Architects and designers are rethinking the spaces we inhabit —
            not as backdrops to life, but as active participants in how we
            feel, think, and connect.
          </p>

          {/* ── Author + Button ── */}
          <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4 sm:gap-6 mt-6 sm:mt-8">

            {/* Author */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative w-9 h-9 sm:w-11 sm:h-11 flex-shrink-0">
                <Image
                  src="/author.jpg"
                  alt="author"
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div>
                <p className="font-semibold text-sm sm:text-base">Maya Chen</p>
                <p className="text-xs sm:text-sm text-gray-400">Staff Writer</p>
              </div>
            </div>

            {/* Divider — visible on sm+ */}
            <span className="hidden xs:block w-px h-8 bg-white/20" />

            {/* CTA Button */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 bg-white text-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-medium hover:bg-orange-500 hover:text-white transition-all duration-300 group flex-shrink-0"
            >
              Read Story
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </Link>

          </div>

          {/* ── Scroll hint — mobile only ── */}
          <div className="flex items-center gap-2 mt-8 sm:hidden text-gray-400 text-xs">
            <span className="block w-4 h-px bg-gray-500" />
            Scroll to explore
          </div>

        </div>

      </div>

      {/* ── Bottom fade — mobile readability ── */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent sm:hidden" />

    </section>
  )
}