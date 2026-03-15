"use client"

import { useState } from "react"

import Hero from "@/components/Hero"
import FeaturedBlogs from "@/components/FeaturedBlogs"
import MoreBlogs from "@/components/MoreBlogs"
import Newsletter from "@/components/Newsletter"
import Footer from "@/components/Footer"
import BlogModal from "@/components/BlogModal"

interface Blog {
  id: string
  title: string
  content: string
  image_url?: string
}

export default function Home() {

  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)

  return (
    <main>

      <Hero />

      {/* Featured blogs */}
      <FeaturedBlogs onBlogClick={setSelectedBlog} />

      {/* More blogs */}
      <MoreBlogs />

      <Newsletter />

      <Footer />

      {/* Blog popup modal */}
      {selectedBlog && (
        <BlogModal
          blog={selectedBlog}
          onClose={() => setSelectedBlog(null)}
        />
      )}

    </main>
  )
}