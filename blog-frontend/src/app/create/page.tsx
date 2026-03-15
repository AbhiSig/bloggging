"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"

type Blog = {
  id: string
  title: string
  content: string
  image_url?: string
  status: string
  created_at: string
}

const getToken = () => localStorage.getItem("token")

const QUOTES = [
  { text: "A writer only begins a book. A reader finishes it.", author: "Samuel Johnson" },
  { text: "Fill your paper with the breathings of your heart.", author: "William Wordsworth" },
  { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou" },
  { text: "Writing is the painting of the voice.", author: "Voltaire" },
  { text: "The pen is mightier than the sword.", author: "Edward Bulwer-Lytton" },
  { text: "Words are, of course, the most powerful drug used by mankind.", author: "Rudyard Kipling" },
  { text: "You can make anything by writing.", author: "C.S. Lewis" },
  { text: "Start writing, no matter what. The water does not flow until the faucet is turned on.", author: "Louis L'Amour" },
]

export default function CreateBlogPage() {
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [blogs, setBlogs] = useState<Blog[]>([])
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [quoteIndex, setQuoteIndex] = useState(0)
  const [quoteFading, setQuoteFading] = useState(false)

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const token = getToken()
    if (!token) { router.push("/"); return }
    fetchBlogs()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteFading(true)
      setTimeout(() => {
        setQuoteIndex((i) => (i + 1) % QUOTES.length)
        setQuoteFading(false)
      }, 600)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchBlogs = async () => {
    const token = getToken()
    if (!token) return
    try {
      const res = await api.get("/blogs/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBlogs(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImageFile(file)
    if (file) setImagePreview(URL.createObjectURL(file))
    else setImagePreview(null)
  }

  const createBlog = async () => {
    const token = getToken()
    if (!token) return
    if (!title.trim() || !content.trim()) { setError("Title and content are required."); return }

    setSubmitting(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData()
    formData.append("title", title)
    formData.append("content", content)
    if (imageFile) formData.append("image", imageFile)

    try {
      await api.post("/blogs/", formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTitle(""); setContent(""); setImageFile(null); setImagePreview(null)
      setSuccess(true)
      fetchBlogs()
      setTimeout(() => setSuccess(false), 4000)
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create blog. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const updateBlog = async () => {
    const token = getToken()
    if (!token || !editingBlog) return

    setSubmitting(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData()
    formData.append("title", title)
    formData.append("content", content)
    if (imageFile) formData.append("image", imageFile)

    try {
      await api.put(`/blogs/${editingBlog.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEditingBlog(null)
      setTitle(""); setContent(""); setImageFile(null); setImagePreview(null)
      setSuccess(true)
      fetchBlogs()
      setTimeout(() => setSuccess(false), 4000)
    } catch {
      setError("Failed to update blog.")
    } finally {
      setSubmitting(false)
    }
  }

  const deleteBlog = async (id: string) => {
    const token = getToken()
    if (!token) return
    if (!confirm("Are you sure you want to delete this blog?")) return
    try {
      await api.delete(`/blogs/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      fetchBlogs()
    } catch {
      alert("Failed to delete blog. Try again.")
    }
  }

  const startEditing = (blog: Blog) => {
    setEditingBlog(blog)
    setTitle(blog.title)
    setContent(blog.content)
    setImagePreview(blog.image_url || null)
    setImageFile(null)
    setError(null)
    setSuccess(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const cancelEditing = () => {
    setEditingBlog(null)
    setTitle("")
    setContent("")
    setImageFile(null)
    setImagePreview(null)
    setError(null)
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    router.push("/")
  }

  const statusStyle = (status?: string) => {
    if (status === "APPROVED") return { bg: "#d1fae5", color: "#065f46", dot: "#10b981" }
    if (status === "PENDING")  return { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" }
    if (status === "REJECTED") return { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" }
    return { bg: "#f5f5f4", color: "#78716c", dot: "#a8a29e" }
  }

  const currentQuote = QUOTES[quoteIndex]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #faf8f4; }

        .page-wrap { font-family: 'DM Sans', sans-serif; min-height: 100vh; background: #faf8f4; color: #1c1917; }
        .page-wrap::before { content: ''; position: fixed; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"); pointer-events: none; z-index: 0; opacity: 0.5; }

        .content { position: relative; z-index: 1; max-width: 860px; margin: 0 auto; padding: 24px 16px 72px; }
        @media (min-width: 480px) { .content { padding: 32px 20px 80px; } }
        @media (min-width: 768px) { .content { padding: 48px 24px 96px; } }

        /* ── Header ── */
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; animation: slideDown 0.7s cubic-bezier(0.16,1,0.3,1) both; gap: 12px; flex-wrap: wrap; }
        @media (min-width: 480px) { .header { margin-bottom: 40px; flex-wrap: nowrap; } }
        @media (min-width: 768px) { .header { margin-bottom: 56px; } }

        .site-eyebrow { font-size: 10px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #a8926a; margin-bottom: 5px; }
        @media (min-width: 768px) { .site-eyebrow { font-size: 11px; margin-bottom: 6px; } }
        .site-title { font-family: 'Playfair Display', serif; font-size: clamp(22px, 5vw, 40px); font-weight: 700; line-height: 1.1; color: #1c1917; }

        .logout-btn { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; padding: 8px 16px; border-radius: 100px; border: 1.5px solid #d6c9b0; background: transparent; color: #78716c; cursor: pointer; letter-spacing: 0.02em; transition: all 0.2s ease; margin-top: 4px; white-space: nowrap; flex-shrink: 0; }
        @media (min-width: 768px) { .logout-btn { font-size: 13px; padding: 10px 22px; margin-top: 8px; } }
        .logout-btn:hover { background: #1c1917; color: #faf8f4; border-color: #1c1917; }

        /* ── Quote banner ── */
        .quote-banner { background: linear-gradient(135deg, #1c1917 0%, #292524 100%); border-radius: 16px; padding: 28px 24px; margin-bottom: 28px; overflow: hidden; position: relative; animation: fadeUp 0.8s 0.2s cubic-bezier(0.16,1,0.3,1) both; }
        @media (min-width: 480px) { .quote-banner { padding: 32px 36px; margin-bottom: 36px; border-radius: 18px; } }
        @media (min-width: 768px) { .quote-banner { padding: 40px 48px; margin-bottom: 52px; border-radius: 20px; } }
        .quote-banner::before { content: '201C'; font-family: 'Playfair Display', serif; font-size: 140px; line-height: 1; position: absolute; top: -16px; left: 16px; color: #a8926a; opacity: 0.15; pointer-events: none; }
        @media (min-width: 768px) { .quote-banner::before { font-size: 200px; top: -20px; left: 28px; } }

        .quote-text { font-family: 'Playfair Display', serif; font-size: clamp(15px, 3vw, 22px); font-style: italic; line-height: 1.6; color: #faf8f4; margin-bottom: 12px; position: relative; z-index: 1; transition: opacity 0.6s ease, transform 0.6s ease; }
        @media (min-width: 768px) { .quote-text { margin-bottom: 16px; } }
        .quote-text.fading { opacity: 0; transform: translateY(8px); }
        .quote-author { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #a8926a; font-weight: 500; transition: opacity 0.6s ease; }
        @media (min-width: 768px) { .quote-author { font-size: 12px; } }
        .quote-author.fading { opacity: 0; }
        .quote-dots { display: flex; gap: 6px; margin-top: 18px; }
        @media (min-width: 768px) { .quote-dots { margin-top: 24px; } }
        .quote-dot { width: 6px; height: 6px; border-radius: 50%; background: #57534e; cursor: pointer; transition: all 0.3s; }
        .quote-dot.active { background: #a8926a; transform: scale(1.3); }

        /* ── Create / Edit card ── */
        .create-card { background: #ffffff; border: 1px solid #e8e0d5; border-radius: 18px; padding: 24px 18px; margin-bottom: 36px; position: relative; overflow: hidden; box-shadow: 0 4px 32px rgba(28,25,23,0.06); animation: fadeUp 0.8s 0.3s cubic-bezier(0.16,1,0.3,1) both; }
        @media (min-width: 480px) { .create-card { padding: 32px 28px; margin-bottom: 44px; border-radius: 20px; } }
        @media (min-width: 768px) { .create-card { padding: 48px; margin-bottom: 56px; border-radius: 24px; } }
        .create-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #a8926a, #c4a882, #a8926a); background-size: 200% 100%; animation: shimmer 3s linear infinite; }
        @keyframes shimmer { 0%{background-position:0%} 100%{background-position:200%} }

        /* Edit mode accent */
        .create-card.editing-mode::before { background: linear-gradient(90deg, #3b82f6, #6366f1, #3b82f6); background-size: 200% 100%; animation: shimmer 3s linear infinite; }

        .edit-notice { display: flex; align-items: center; gap: 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 10px 14px; margin-bottom: 20px; font-size: 13px; color: #1d4ed8; }
        @media (min-width: 768px) { .edit-notice { border-radius: 12px; padding: 12px 18px; margin-bottom: 24px; font-size: 13.5px; } }
        .edit-notice strong { font-weight: 600; }

        .section-label { font-size: 10px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #a8926a; margin-bottom: 7px; }
        @media (min-width: 768px) { .section-label { font-size: 11px; margin-bottom: 8px; } }
        .section-heading { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 600; color: #1c1917; margin-bottom: 22px; line-height: 1.3; }
        @media (min-width: 480px) { .section-heading { font-size: 22px; margin-bottom: 26px; } }
        @media (min-width: 768px) { .section-heading { font-size: 26px; margin-bottom: 32px; } }

        .alert { border-radius: 10px; padding: 12px 16px; font-size: 13px; margin-bottom: 18px; display: flex; align-items: flex-start; gap: 9px; line-height: 1.5; }
        @media (min-width: 768px) { .alert { border-radius: 12px; padding: 14px 18px; font-size: 13.5px; } }
        .alert-error   { background: #fff1f2; color: #9f1239; border: 1px solid #fecdd3; }
        .alert-success { background: #f0fdf4; color: #14532d; border: 1px solid #bbf7d0; }

        .field-group { margin-bottom: 16px; }
        @media (min-width: 768px) { .field-group { margin-bottom: 20px; } }
        .field-label { display: block; font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: #78716c; margin-bottom: 7px; }

        .styled-input, .styled-textarea { width: 100%; font-family: 'DM Sans', sans-serif; border: 1.5px solid #e8e0d5; border-radius: 12px; padding: 12px 14px; font-size: 14px; color: #1c1917; background: #faf8f4; outline: none; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; }
        @media (min-width: 768px) { .styled-input, .styled-textarea { border-radius: 14px; padding: 14px 18px; font-size: 15px; } }
        .styled-input:focus, .styled-textarea:focus { border-color: #a8926a; background: #ffffff; box-shadow: 0 0 0 4px rgba(168,146,106,0.1); }
        .styled-input::placeholder, .styled-textarea::placeholder { color: #c4b8a8; }
        .styled-textarea { resize: vertical; min-height: 140px; line-height: 1.7; }
        @media (min-width: 768px) { .styled-textarea { min-height: 160px; } }

        /* Upload */
        .upload-zone { border: 2px dashed #d6c9b0; border-radius: 12px; padding: 22px 16px; text-align: center; cursor: pointer; transition: all 0.2s; position: relative; background: #faf8f4; }
        @media (min-width: 768px) { .upload-zone { border-radius: 14px; padding: 28px; } }
        .upload-zone:hover { border-color: #a8926a; background: #fdf8f0; }
        .upload-zone input[type=file] { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
        .upload-icon { font-size: 24px; margin-bottom: 6px; }
        @media (min-width: 768px) { .upload-icon { font-size: 28px; margin-bottom: 8px; } }
        .upload-text { font-size: 12.5px; color: #a39280; }
        @media (min-width: 768px) { .upload-text { font-size: 13px; } }
        .upload-text strong { color: #a8926a; }

        .img-preview-wrap { margin-top: 14px; position: relative; display: inline-block; width: 100%; }
        .img-preview { height: 140px; width: 100%; object-fit: cover; border-radius: 10px; display: block; box-shadow: 0 4px 16px rgba(28,25,23,0.12); }
        @media (min-width: 768px) { .img-preview { height: 160px; border-radius: 12px; } }
        .img-remove-btn { position: absolute; top: 8px; right: 8px; background: rgba(28,25,23,0.8); color: #faf8f4; border: none; border-radius: 7px; padding: 4px 10px; font-size: 11.5px; cursor: pointer; transition: background 0.2s; backdrop-filter: blur(4px); }
        @media (min-width: 768px) { .img-remove-btn { top: 10px; right: 10px; font-size: 12px; padding: 5px 12px; border-radius: 8px; } }
        .img-remove-btn:hover { background: #1c1917; }

        /* Button row */
        .btn-row { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
        @media (min-width: 480px) { .btn-row { flex-direction: row; align-items: center; } }

        .publish-btn { font-family: 'DM Sans', sans-serif; background: #1c1917; color: #faf8f4; border: none; border-radius: 12px; padding: 13px 24px; font-size: 14px; font-weight: 500; cursor: pointer; letter-spacing: 0.02em; transition: all 0.25s cubic-bezier(0.16,1,0.3,1); display: flex; align-items: center; gap: 8px; justify-content: center; flex: 1; }
        @media (min-width: 480px) { .publish-btn { border-radius: 14px; padding: 15px 32px; font-size: 15px; gap: 10px; flex: 0 0 auto; } }
        .publish-btn:hover:not(:disabled) { background: #a8926a; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(168,146,106,0.35); }
        .publish-btn:disabled { background: #d6cfc7; cursor: not-allowed; }
        .publish-btn.edit-btn { background: #1d4ed8; }
        .publish-btn.edit-btn:hover:not(:disabled) { background: #1e40af; box-shadow: 0 8px 24px rgba(29,78,216,0.3); }

        .cancel-btn { font-family: 'DM Sans', sans-serif; background: transparent; color: #78716c; border: 1.5px solid #d6c9b0; border-radius: 12px; padding: 12px 22px; font-size: 14px; font-weight: 500; cursor: pointer; letter-spacing: 0.02em; transition: all 0.2s ease; display: flex; align-items: center; gap: 7px; justify-content: center; }
        @media (min-width: 480px) { .cancel-btn { border-radius: 14px; padding: 14px 24px; font-size: 15px; } }
        .cancel-btn:hover { background: #f5f0ea; border-color: #a8926a; color: #1c1917; }

        /* ── Blog list ── */
        .blogs-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; animation: fadeUp 0.8s 0.4s cubic-bezier(0.16,1,0.3,1) both; flex-wrap: wrap; gap: 8px; }
        @media (min-width: 768px) { .blogs-header { margin-bottom: 28px; align-items: baseline; } }
        .blogs-heading { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 600; color: #1c1917; }
        @media (min-width: 768px) { .blogs-heading { font-size: 28px; } }
        .blogs-count { font-size: 12px; color: #a39280; background: #f0ebe4; padding: 3px 12px; border-radius: 100px; }
        @media (min-width: 768px) { .blogs-count { font-size: 13px; padding: 4px 14px; } }

        .empty-state { text-align: center; padding: 48px 24px; background: #ffffff; border: 1px dashed #d6c9b0; border-radius: 16px; animation: fadeUp 0.8s 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        @media (min-width: 768px) { .empty-state { padding: 64px 32px; border-radius: 20px; } }
        .empty-icon { font-size: 32px; margin-bottom: 10px; }
        @media (min-width: 768px) { .empty-icon { font-size: 40px; margin-bottom: 12px; } }
        .empty-text { color: #a39280; font-size: 14px; }
        @media (min-width: 768px) { .empty-text { font-size: 15px; } }

        .blog-grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
        @media (min-width: 640px) { .blog-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; } }
        @media (min-width: 768px) { .blog-grid { gap: 24px; } }

        .blog-card { background: #ffffff; border: 1px solid #e8e0d5; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 16px rgba(28,25,23,0.04); transition: all 0.3s cubic-bezier(0.16,1,0.3,1); animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both; display: flex; flex-direction: column; }
        @media (min-width: 768px) { .blog-card { border-radius: 20px; } }
        .blog-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(28,25,23,0.1); border-color: #d6c9b0; }
        .blog-card.is-editing { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.15), 0 8px 32px rgba(28,25,23,0.08); }

        .blog-img { width: 100%; height: 170px; object-fit: cover; display: block; transition: transform 0.5s ease; }
        @media (min-width: 768px) { .blog-img { height: 200px; } }
        .blog-card:hover .blog-img { transform: scale(1.03); }
        .blog-img-wrap { overflow: hidden; }

        .blog-body { padding: 18px 16px 20px; display: flex; flex-direction: column; flex: 1; }
        @media (min-width: 480px) { .blog-body { padding: 22px 24px 24px; } }
        @media (min-width: 768px) { .blog-body { padding: 28px 32px; } }

        .blog-title { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 600; color: #1c1917; margin-bottom: 8px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        @media (min-width: 768px) { .blog-title { font-size: 20px; margin-bottom: 10px; } }

        .blog-excerpt { font-size: 13px; color: #78716c; line-height: 1.75; margin-bottom: 18px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; flex: 1; }
        @media (min-width: 768px) { .blog-excerpt { font-size: 14px; margin-bottom: 24px; } }

        .blog-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-top: auto; }

        .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px; border-radius: 100px; font-size: 11px; font-weight: 500; letter-spacing: 0.06em; white-space: nowrap; }
        @media (min-width: 768px) { .status-badge { gap: 7px; padding: 5px 14px; font-size: 11.5px; } }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        @media (min-width: 768px) { .status-dot { width: 7px; height: 7px; } }

        .card-actions { display: flex; gap: 8px; }

        .edit-btn-card { font-family: 'DM Sans', sans-serif; font-size: 12px; border: 1.5px solid #bfdbfe; background: transparent; color: #1d4ed8; padding: 6px 14px; border-radius: 8px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        @media (min-width: 768px) { .edit-btn-card { font-size: 13px; padding: 8px 18px; border-radius: 10px; } }
        .edit-btn-card:hover { background: #eff6ff; transform: scale(1.02); }

        .delete-btn { font-family: 'DM Sans', sans-serif; font-size: 12px; border: 1.5px solid #fecdd3; background: transparent; color: #be123c; padding: 6px 14px; border-radius: 8px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        @media (min-width: 768px) { .delete-btn { font-size: 13px; padding: 8px 18px; border-radius: 10px; } }
        .delete-btn:hover { background: #fff1f2; transform: scale(1.02); }

        /* ── Divider ── */
        .ornamental-divider { display: flex; align-items: center; gap: 14px; margin: 36px 0 28px; animation: fadeUp 0.8s 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        @media (min-width: 768px) { .ornamental-divider { gap: 16px; margin: 52px 0; } }
        .divider-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #d6c9b0, transparent); }
        .divider-ornament { color: #a8926a; font-size: 16px; }
        @media (min-width: 768px) { .divider-ornament { font-size: 18px; } }

        @keyframes slideDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(24px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      <div className="page-wrap">
        <div className="content">

          {/* Header */}
          <header className="header">
            <div className="header-left">
              <p className="site-eyebrow">✦ Writer's Studio</p>
              <h1 className="site-title">My Blog Dashboard</h1>
            </div>
            <button className="logout-btn" onClick={logout}>Sign out</button>
          </header>

          {/* Rotating Quote Banner */}
          <div className="quote-banner">
            <p className={`quote-text${quoteFading ? " fading" : ""}`}>
              "{currentQuote.text}"
            </p>
            <p className={`quote-author${quoteFading ? " fading" : ""}`}>
              — {currentQuote.author}
            </p>
            <div className="quote-dots">
              {QUOTES.map((_, i) => (
                <div
                  key={i}
                  className={`quote-dot${i === quoteIndex ? " active" : ""}`}
                  onClick={() => {
                    setQuoteFading(true)
                    setTimeout(() => { setQuoteIndex(i); setQuoteFading(false) }, 300)
                  }}
                />
              ))}
            </div>
          </div>

          {/* Create / Edit Blog Card */}
          <div className={`create-card${editingBlog ? " editing-mode" : ""}`}>
            <p className="section-label">{editingBlog ? "Editing Entry" : "New Entry"}</p>
            <h2 className="section-heading">
              {editingBlog ? "Revise Your Story" : "Craft Your Story"}
            </h2>

            {/* Edit notice banner */}
            {editingBlog && (
              <div className="edit-notice">
                <span>Editing: <strong>{editingBlog.title}</strong></span>
              </div>
            )}

            {error && (
              <div className="alert alert-error">
                <span>✕</span> {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success">
                <span>✓</span>{" "}
                {editingBlog
                  ? "Blog updated successfully!"
                  : "Blog submitted for review — beautifully done!"}
              </div>
            )}

            <div className="field-group">
              <label className="field-label">Title</label>
              <input
                className="styled-input"
                placeholder="Give your story a compelling title…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="field-label">Content</label>
              <textarea
                className="styled-textarea"
                placeholder="Begin your story here…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="field-label">Cover Image</label>
              <div className="upload-zone">
                <input type="file" accept="image/*" onChange={handleImageChange} />
                <div className="upload-icon">🖼</div>
                <p className="upload-text"><strong>Click to upload</strong> or drag & drop</p>
                <p className="upload-text" style={{ marginTop: 4, fontSize: 11.5 }}>PNG, JPG, WEBP</p>
              </div>
              {imagePreview && (
                <div className="img-preview-wrap">
                  <img src={imagePreview} alt="Preview" className="img-preview" />
                  <button
                    className="img-remove-btn"
                    onClick={() => { setImageFile(null); setImagePreview(null) }}
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
            </div>

            <div className="btn-row">
              <button
                onClick={editingBlog ? updateBlog : createBlog}
                disabled={submitting}
                className={`publish-btn${editingBlog ? " edit-btn" : ""}`}
              >
                {submitting ? (
                  <>
                    <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>◌</span>
                    {editingBlog ? "Updating…" : "Publishing…"}
                  </>
                ) : (
                  <>
                    <span>{editingBlog ? "✎" : "✦"}</span>
                    {editingBlog ? "Update Blog" : "Publish Blog"}
                  </>
                )}
              </button>

              {editingBlog && (
                <button className="cancel-btn" onClick={cancelEditing}>
                  ✕ Cancel Edit
                </button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="ornamental-divider">
            <div className="divider-line" />
            <span className="divider-ornament">✦</span>
            <div className="divider-line" />
          </div>

          {/* Blog History */}
          <div className="blogs-header">
            <h2 className="blogs-heading">My Writings</h2>
            {blogs.length > 0 && (
              <span className="blogs-count">
                {blogs.length} {blogs.length === 1 ? "piece" : "pieces"}
              </span>
            )}
          </div>

          {blogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✍️</div>
              <p className="empty-text">Your stories are waiting to be written.</p>
            </div>
          ) : (
            <div className="blog-grid">
              {blogs.map((blog, i) => {
                const s = statusStyle(blog.status)
                const isBeingEdited = editingBlog?.id === blog.id
                return (
                  <div
                    key={blog.id}
                    className={`blog-card${isBeingEdited ? " is-editing" : ""}`}
                    style={{ animationDelay: `${0.5 + i * 0.08}s` }}
                  >
                    {blog.image_url && (
                      <div className="blog-img-wrap">
                        <img src={blog.image_url} alt={blog.title} className="blog-img" />
                      </div>
                    )}
                    <div className="blog-body">
                      <h3 className="blog-title">{blog.title}</h3>
                      <p className="blog-excerpt">
                        {blog.content.slice(0, 160)}{blog.content.length > 160 ? "…" : ""}
                      </p>
                      <div className="blog-footer">
                        <span className="status-badge" style={{ background: s.bg, color: s.color }}>
                          <span className="status-dot" style={{ background: s.dot }} />
                          {blog.status
                            ? blog.status.charAt(0) + blog.status.slice(1).toLowerCase()
                            : "Unknown"}
                        </span>
                        <div className="card-actions">
                          <button
                            className="edit-btn-card"
                            onClick={() => startEditing(blog)}
                            disabled={isBeingEdited}
                          >
                            {isBeingEdited ? "Editing…" : "Edit"}
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => deleteBlog(blog.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </>
  )
}