import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-black text-white py-10 sm:py-12 px-4 sm:px-8">

      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">

        {/* ── Logo ── */}
        <div className="col-span-2 sm:col-span-2 md:col-span-1">
          <h2 className="text-xl font-bold mb-3">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-2 mb-0.5" />
            MyBlog
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            A modern AI powered blogging platform where ideas come to life.
          </p>
        </div>

        {/* ── Navigation ── */}
        <div>
          <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">
            Navigation
          </h3>
          <div className="flex flex-col gap-2 sm:gap-2.5">
            {[
              { label: "Home", href: "/" },
              { label: "Blogs", href: "/blog" },
              { label: "Login", href: "/login" },
              { label: "Register", href: "/register" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Resources ── */}
        <div>
          <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">
            Resources
          </h3>
          <div className="flex flex-col gap-2 sm:gap-2.5">
            {[
              { label: "Privacy Policy", href: "#" },
              { label: "Terms of Service", href: "#" },
              { label: "Help Center", href: "#" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Social ── */}
        <div>
          <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">
            Follow Us
          </h3>
          <div className="flex flex-col gap-2 sm:gap-2.5">
            {[
              { label: "Twitter", href: "#", icon: "𝕏" },
              { label: "LinkedIn", href: "#", icon: "in" },
              { label: "GitHub", href: "#", icon: "⌥" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors duration-200 group"
              >
                <span className="w-6 h-6 rounded bg-gray-800 group-hover:bg-gray-700 flex items-center justify-center text-xs flex-shrink-0 transition-colors">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* ── Bottom Bar ── */}
      <div className="border-t border-gray-800 mt-8 sm:mt-10 pt-5 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-gray-500 text-xs sm:text-sm">
        <span>© 2026 MyBlog. All rights reserved.</span>
        <span className="text-gray-600">Made with ♥ for writers</span>
      </div>

    </footer>
  )
}