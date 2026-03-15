"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import Image from "next/image"
import Link from "next/link"

type Blog = {
  id: string
  title: string
  content: string
  image_url?: string
  category?: string
}

const categories = ["All", "Technology", "Nature", "Politics", "Science", "AI", "Travel"]

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    try {
      const res = await api.get("/blogs")
      setBlogs(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredBlogs = blogs
    .filter(blog => selectedCategory === "All" || blog.category === selectedCategory)
    .filter(blog =>
      !search.trim() ||
      blog.title.toLowerCase().includes(search.toLowerCase()) ||
      blog.content.toLowerCase().includes(search.toLowerCase())
    )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .bp { font-family: 'DM Sans', sans-serif; min-height: 100vh; background: #f9f6f1; color: #2c2825; }

        /* grain */
        .bp::before { content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E"); opacity: 0.4; }

        /* ── Layout ── */
        .bp-inner { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 80px 16px 60px; }
        @media (min-width: 480px) { .bp-inner { padding: 88px 24px 72px; } }
        @media (min-width: 768px) { .bp-inner { padding: 100px 32px 80px; } }
        @media (min-width: 1024px) { .bp-inner { padding: 112px 40px 100px; } }

        /* ── Hero heading ── */
        .bp-hero { text-align: center; margin-bottom: 36px; animation: bpFade 0.6s ease both; }
        @media (min-width: 768px) { .bp-hero { margin-bottom: 48px; } }

        .bp-eyebrow { font-size: 10px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; color: #a8926a; margin-bottom: 12px; }
        @media (min-width: 768px) { .bp-eyebrow { font-size: 11px; } }

        .bp-title { font-family: 'Playfair Display', serif; font-size: clamp(28px, 6vw, 52px); font-weight: 700; color: #2c2825; letter-spacing: -0.02em; line-height: 1.1; margin-bottom: 12px; }
        .bp-subtitle { font-size: 14px; color: #a39280; line-height: 1.6; max-width: 380px; margin: 0 auto; }
        @media (min-width: 768px) { .bp-subtitle { font-size: 15px; max-width: 460px; } }

        /* ── Search ── */
        .bp-search-wrap { max-width: 420px; margin: 0 auto 28px; position: relative; animation: bpFade 0.6s 0.05s ease both; }
        @media (min-width: 768px) { .bp-search-wrap { margin-bottom: 36px; } }
        .bp-search { width: 100%; font-family: 'DM Sans', sans-serif; background: #fff; border: 1px solid #e5ddd4; border-radius: 100px; padding: 11px 20px 11px 42px; font-size: 13.5px; color: #2c2825; outline: none; transition: border-color 0.2s, box-shadow 0.2s; box-shadow: 0 2px 8px rgba(44,40,37,0.05); }
        .bp-search:focus { border-color: #a8926a; box-shadow: 0 0 0 3px rgba(168,146,106,0.12); }
        .bp-search::placeholder { color: #c4b8a8; }
        .bp-search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #c4b8a8; font-size: 14px; pointer-events: none; }

        /* ── Categories ── */
        .bp-cats { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 36px; animation: bpFade 0.6s 0.1s ease both; }
        @media (min-width: 768px) { .bp-cats { gap: 10px; margin-bottom: 48px; } }

        .bp-cat { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; padding: 6px 14px; border-radius: 100px; border: 1px solid #e5ddd4; background: #fff; color: #78716c; cursor: pointer; transition: all 0.2s; letter-spacing: 0.01em; }
        @media (min-width: 768px) { .bp-cat { font-size: 13px; padding: 7px 18px; } }
        .bp-cat:hover { border-color: #c4b8a8; color: #2c2825; background: #f5f0e8; }
        .bp-cat.active { background: #2c2825; color: #f9f6f1; border-color: #2c2825; box-shadow: 0 4px 12px rgba(44,40,37,0.2); transform: translateY(-1px); }

        /* ── Results bar ── */
        .bp-results-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; animation: bpFade 0.6s 0.15s ease both; flex-wrap: wrap; gap: 8px; }
        @media (min-width: 768px) { .bp-results-bar { margin-bottom: 28px; } }
        .bp-results-count { font-size: 12.5px; color: #a39280; }
        @media (min-width: 768px) { .bp-results-count { font-size: 13px; } }
        .bp-results-cat { font-weight: 600; color: #2c2825; }
        .bp-divider { height: 1px; background: #e5ddd4; margin-bottom: 20px; }
        @media (min-width: 768px) { .bp-divider { margin-bottom: 28px; } }

        /* ── Grid ── */
        .bp-grid { display: grid; grid-template-columns: 1fr; gap: 20px; animation: bpFade 0.6s 0.2s ease both; }
        @media (min-width: 560px) { .bp-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; } }
        @media (min-width: 900px) { .bp-grid { grid-template-columns: repeat(3, 1fr); gap: 28px; } }

        /* ── Card ── */
        .bp-card { background: #fff; border: 1px solid #e5ddd4; border-radius: 16px; overflow: hidden; transition: transform 0.3s ease, box-shadow 0.3s ease; display: flex; flex-direction: column; }
        @media (hover: hover) { .bp-card:hover { transform: translateY(-6px); box-shadow: 0 16px 48px rgba(44,40,37,0.12); } }

        .bp-card-img { position: relative; height: 180px; overflow: hidden; background: #f5f0e8; flex-shrink: 0; }
        @media (min-width: 768px) { .bp-card-img { height: 210px; } }
        @media (min-width: 1024px) { .bp-card-img { height: 224px; } }

        .bp-card-img-inner { transition: transform 0.6s ease; width: 100%; height: 100%; }
        .bp-card:hover .bp-card-img-inner { transform: scale(1.06); }

        .bp-card-img-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(44,40,37,0.35), transparent 60%); }

        /* no-image placeholder */
        .bp-card-no-img { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f5ede0, #ede4d8); }
        .bp-card-no-img-mark { font-family: 'Playfair Display', serif; font-size: 28px; color: #c4b8a8; font-style: italic; }

        .bp-card-body { padding: 18px 18px 20px; display: flex; flex-direction: column; flex: 1; }
        @media (min-width: 768px) { .bp-card-body { padding: 20px 22px 22px; } }

        .bp-card-cat { font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #a8926a; margin-bottom: 8px; }
        @media (min-width: 768px) { .bp-card-cat { font-size: 10.5px; } }

        .bp-card-title { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 600; color: #2c2825; line-height: 1.35; margin-bottom: 10px; transition: color 0.2s; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        @media (min-width: 768px) { .bp-card-title { font-size: 17px; } }
        .bp-card:hover .bp-card-title { color: #a8926a; }

        .bp-card-excerpt { font-size: 13px; color: #78716c; line-height: 1.7; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; flex: 1; }
        @media (min-width: 768px) { .bp-card-excerpt { font-size: 13.5px; } }

        .bp-card-footer { margin-top: 16px; padding-top: 14px; border-top: 1px solid #f0ebe4; display: flex; align-items: center; justify-content: space-between; }
        .bp-card-read { font-size: 12px; font-weight: 600; color: #a8926a; letter-spacing: 0.04em; display: flex; align-items: center; gap: 5px; transition: gap 0.2s; }
        .bp-card:hover .bp-card-read { gap: 8px; }

        /* ── Skeleton ── */
        .bp-skel-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        @media (min-width: 560px) { .bp-skel-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 900px) { .bp-skel-grid { grid-template-columns: repeat(3, 1fr); gap: 28px; } }

        .bp-skel-card { background: #fff; border: 1px solid #e5ddd4; border-radius: 16px; overflow: hidden; animation: bpShimmer 1.4s ease-in-out infinite; }
        .bp-skel-img { height: 180px; background: #ede8e1; }
        @media (min-width: 768px) { .bp-skel-img { height: 210px; } }
        .bp-skel-body { padding: 18px; }
        @media (min-width: 768px) { .bp-skel-body { padding: 20px 22px; } }
        .bp-skel-line { height: 10px; background: #ede8e1; border-radius: 4px; margin-bottom: 10px; }
        @keyframes bpShimmer { 0%,100%{opacity:1} 50%{opacity:0.5} }

        /* ── Empty state ── */
        .bp-empty { text-align: center; padding: 64px 0; }
        .bp-empty-icon { font-size: 36px; margin-bottom: 14px; }
        .bp-empty-title { font-family: 'Playfair Display', serif; font-size: 20px; color: #c4b8a8; font-style: italic; margin-bottom: 6px; }
        @media (min-width: 768px) { .bp-empty-title { font-size: 22px; } }
        .bp-empty-sub { font-size: 13.5px; color: #c4b8a8; }

        @keyframes bpFade { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="bp">
        <div className="bp-inner">

          {/* ── Hero ── */}
          <div className="bp-hero">
            <p className="bp-eyebrow">Our Publication</p>
            <h1 className="bp-title">Explore Blogs</h1>
            <p className="bp-subtitle">Discover ideas, stories and insights from our writers</p>
          </div>

          {/* ── Search ── */}
          <div className="bp-search-wrap">
            <span className="bp-search-icon">⌕</span>
            <input
              className="bp-search"
              placeholder="Search by title or content…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* ── Categories ── */}
          <div className="bp-cats">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`bp-cat${selectedCategory === cat ? " active" : ""}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ── Results bar ── */}
          {!loading && (
            <>
              <div className="bp-results-bar">
                <span className="bp-results-count">
                  {filteredBlogs.length === 0
                    ? "No posts found"
                    : <>{filteredBlogs.length} post{filteredBlogs.length !== 1 ? "s" : ""} in <span className="bp-results-cat">{selectedCategory}</span></>
                  }
                </span>
              </div>
              <div className="bp-divider" />
            </>
          )}

          {/* ── Content ── */}
          {loading ? (
            <div className="bp-skel-grid">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bp-skel-card">
                  <div className="bp-skel-img" />
                  <div className="bp-skel-body">
                    <div className="bp-skel-line" style={{ width: "40%", height: 8 }} />
                    <div className="bp-skel-line" style={{ width: "85%", height: 14, marginBottom: 14 }} />
                    <div className="bp-skel-line" style={{ width: "95%" }} />
                    <div className="bp-skel-line" style={{ width: "80%" }} />
                    <div className="bp-skel-line" style={{ width: "60%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="bp-empty">
              <div className="bp-empty-icon">✦</div>
              <div className="bp-empty-title">
                {search ? `No results for "${search}"` : `No posts in ${selectedCategory}`}
              </div>
              <div className="bp-empty-sub">
                {search ? "Try a different search term." : "Check back soon for new stories."}
              </div>
            </div>
          ) : (
            <div className="bp-grid">
              {filteredBlogs.map((blog, i) => (
                <Link key={blog.id} href={`/blog/${blog.id}`} style={{ textDecoration: "none", animationDelay: `${i * 0.05}s` }}>
                  <div className="bp-card">

                    {/* Image */}
                    <div className="bp-card-img">
                      {blog.image_url ? (
                        <>
                          <div className="bp-card-img-inner">
                            <Image
                              src={blog.image_url}
                              alt={blog.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"
                            />
                          </div>
                          <div className="bp-card-img-overlay" />
                        </>
                      ) : (
                        <div className="bp-card-no-img">
                          <span className="bp-card-no-img-mark">✦</span>
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="bp-card-body">
                      <span className="bp-card-cat">{blog.category || "General"}</span>
                      <h3 className="bp-card-title">{blog.title}</h3>
                      <p className="bp-card-excerpt">{blog.content.slice(0, 120)}…</p>
                      <div className="bp-card-footer">
                        <span className="bp-card-read">Read more <span>→</span></span>
                      </div>
                    </div>

                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  )
}