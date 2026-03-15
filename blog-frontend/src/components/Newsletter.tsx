import { Mail } from "lucide-react"

export default function Newsletter() {
  return (
    <section className="bg-[#0f0b08] text-white py-16 sm:py-20 lg:py-28 px-4 sm:px-6">

      <div className="max-w-4xl mx-auto text-center">

        {/* ── Icon ── */}
        <div className="flex justify-center mb-5 sm:mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/30">
            <Mail className="text-orange-400" size={22} />
          </div>
        </div>

        {/* ── Label ── */}
        <p className="uppercase tracking-widest text-xs sm:text-sm text-orange-400 mb-3 sm:mb-4">
          Newsletter
        </p>

        {/* ── Title ── */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-semibold mb-4 sm:mb-6 leading-tight">
          Ideas, Delivered Weekly
        </h2>

        {/* ── Description ── */}
        <p className="text-gray-400 max-w-xs sm:max-w-md lg:max-w-xl mx-auto mb-8 sm:mb-10 text-sm sm:text-base lg:text-lg leading-relaxed">
          One email each Friday — curated stories on design, culture,
          and the ideas worth thinking about. No noise, no spam.
        </p>

        {/* ── Stats ── */}
        <div className="flex justify-center gap-6 sm:gap-10 lg:gap-12 mb-8 sm:mb-12">

          {[
            { value: "14,200+", label: "Subscribers" },
            { value: "Weekly", label: "Frequency" },
            { value: "Free", label: "Always" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl sm:text-2xl font-semibold">{stat.value}</p>
              <p className="text-xs sm:text-sm text-gray-500 tracking-widest uppercase mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}

        </div>

        {/* ── Divider ── */}
        <div className="w-12 h-px bg-orange-500/30 mx-auto mb-8 sm:mb-10" />

        {/* ── Email Form ── */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="bg-white/95 text-black px-5 sm:px-6 py-3.5 sm:py-4 rounded-full w-full sm:w-[360px] lg:w-[420px] outline-none text-sm sm:text-base focus:ring-2 focus:ring-orange-400 transition"
          />
          <button className="bg-orange-500 hover:bg-orange-600 active:scale-[0.98] px-7 sm:px-8 py-3.5 sm:py-4 rounded-full font-semibold transition-all duration-200 text-sm sm:text-base whitespace-nowrap shadow-lg shadow-orange-500/20">
            Subscribe →
          </button>
        </div>

        {/* ── Fine Print ── */}
        <p className="text-gray-600 text-xs sm:text-sm mt-4 sm:mt-6">
          Unsubscribe anytime. We respect your inbox.
        </p>

      </div>

    </section>
  )
}