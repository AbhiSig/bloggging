"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { api } from "@/lib/api"

type Blog = {
  id: string
  title: string
  content: string
  image_url?: string
  author: {
    username: string
  }
}

interface Props {
  onBlogClick: (blog: Blog) => void
}

export default function FeaturedBlogs({ onBlogClick }: Props) {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    try {
      const res = await api.get<Blog[]>("/blogs")
      setBlogs(res.data)
    } catch (error) {
      console.error("Failed to load blogs", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">

      {/* ── Title ── */}
      <div className="text-center mb-8 sm:mb-12 lg:mb-16">
        <span className="inline-block text-xs font-semibold tracking-widest text-amber-600 uppercase mb-3">
          From the Community
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
          Featured Blogs
        </h2>
        <p className="text-gray-500 mt-2 sm:mt-3 text-sm sm:text-base max-w-md mx-auto">
          Discover insights, ideas and stories from our community
        </p>
      </div>

      {/* ── Loading Skeleton ── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7 lg:gap-10">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden shadow-md animate-pulse">
              <div className="h-44 sm:h-52 lg:h-60 bg-gray-200" />
              <div className="p-4 sm:p-6 space-y-3 bg-white">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && blogs.length === 0 && (
        <div className="text-center py-16 sm:py-24 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm sm:text-base">No blogs published yet.</p>
        </div>
      )}

      {/* ── Blog Grid ── */}
      {!loading && blogs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7 lg:gap-10">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              onClick={() => onBlogClick(blog)}
              className="group cursor-pointer"
            >
              <div className="bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 sm:hover:-translate-y-3 h-full flex flex-col">

                {/* ── Image ── */}
                <div className="relative h-44 sm:h-52 lg:h-60 overflow-hidden flex-shrink-0 bg-gray-100">
                  {blog.image_url ? (
                    <>
                      <Image
                        src={blog.image_url}
                        alt={blog.title}
                        fill
                        className="object-cover group-hover:scale-110 transition duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* ── Content ── */}
                <div className="p-4 sm:p-5 lg:p-6 flex flex-col flex-1">
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition leading-snug line-clamp-2">
                    {blog.title}
                  </h3>

                  <p className="text-gray-500 mt-2 sm:mt-3 text-xs sm:text-sm leading-relaxed line-clamp-3 flex-1">
                    {blog.content.slice(0, 120)}…
                  </p>

                  {/* ── Footer ── */}
                  <div className="mt-4 sm:mt-5 flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      {/* Avatar */}
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-800 text-white text-xs flex items-center justify-center font-semibold flex-shrink-0">
                        {blog.author?.username?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="text-xs text-gray-500 font-medium truncate max-w-[80px] sm:max-w-[100px]">
                        {blog.author?.username || "Unknown"}
                      </span>
                    </div>

                    <span className="text-xs text-blue-600 font-medium group-hover:underline flex-shrink-0">
                      Read more →
                    </span>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </section>
  )
}