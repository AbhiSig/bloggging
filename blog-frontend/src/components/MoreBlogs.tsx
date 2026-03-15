import Image from "next/image"
import Link from "next/link"

const blogs = [
  {
    id: 1,
    title: "Understanding Modern UI Design",
    description: "Learn how modern design systems help developers build scalable interfaces.",
    image: "/image.png",
    author: "Emily Watson",
    read: "5 min read",
  },
  {
    id: 2,
    title: "AI Content Moderation Explained",
    description: "How artificial intelligence helps detect harmful content online.",
    image: "/image1.png",
    author: "David Lee",
    read: "6 min read",
  },
  {
    id: 3,
    title: "Building Fast APIs with FastAPI",
    description: "A guide to building high-performance APIs using Python and FastAPI.",
    image: "/blog6.jpg",
    author: "Sophia Brown",
    read: "7 min read",
  },
  {
    id: 4,
    title: "Why Every Developer Should Blog",
    description: "Writing blogs improves knowledge sharing and personal branding.",
    image: "/blog7.jpg",
    author: "John Carter",
    read: "4 min read",
  },
]

export default function MoreBlogs() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">

      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-8 sm:mb-10 lg:mb-12">
        <div>
          <p className="text-xs font-semibold tracking-widest text-orange-500 uppercase mb-1">
            Keep Reading
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            More Blogs
          </h2>
        </div>
        <Link
          href="/blog"
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors hidden sm:flex items-center gap-1 group"
        >
          View all
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
        {blogs.map((blog) => (
          <Link
            key={blog.id}
            href={`/blog/${blog.id}`}
            className="group flex flex-col sm:block"
          >
            {/* Horizontal layout on mobile, vertical on sm+ */}
            <div className="flex gap-4 sm:block">

              {/* ── Image ── */}
              <div className="relative w-24 h-24 flex-shrink-0 sm:w-full sm:h-48 rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={blog.image}
                  alt={blog.title}
                  fill
                  className="object-cover group-hover:scale-110 transition duration-500"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition duration-300" />
              </div>

              {/* ── Text ── */}
              <div className="flex-1 sm:mt-4">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition leading-snug line-clamp-2">
                  {blog.title}
                </h3>

                <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                  {blog.description}
                </p>

                <div className="flex items-center gap-2 mt-2 sm:mt-3">
                  {/* Author avatar */}
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-800 text-white text-xs flex items-center justify-center font-semibold flex-shrink-0">
                    {blog.author[0]}
                  </div>
                  <p className="text-gray-400 text-xs truncate">
                    <span className="text-gray-600 font-medium">{blog.author}</span>
                    <span className="mx-1">·</span>
                    {blog.read}
                  </p>
                </div>
              </div>

            </div>
          </Link>
        ))}
      </div>

      {/* ── Mobile: View All button ── */}
      <div className="mt-8 flex justify-center sm:hidden">
        <Link
          href="/blog"
          className="text-sm font-medium text-gray-700 border border-gray-200 px-5 py-2.5 rounded-full hover:border-gray-400 transition-colors"
        >
          View all blogs →
        </Link>
      </div>

    </section>
  )
}