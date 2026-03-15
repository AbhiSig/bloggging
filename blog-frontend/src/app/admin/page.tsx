"use client"

import { useEffect, useRef, useState } from "react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"

type Blog = {
  id: string
  title: string
  content: string
  image_url?: string
}

const getToken = () => localStorage.getItem("token")

export default function AdminPage() {
  const [pendingBlogs, setPendingBlogs] = useState<Blog[]>([])
  const [rejectedBlogs, setRejectedBlogs] = useState<Blog[]>([])
  const [tab, setTab] = useState("pending")
  const [wsStatus, setWsStatus] = useState<"connected" | "disconnected" | "retrying">("disconnected")

  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectError, setRejectError] = useState<string | null>(null)
  const [rejectSubmitting, setRejectSubmitting] = useState(false)

  const [previewBlog, setPreviewBlog] = useState<Blog | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: "info" | "success" | "error" } | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const wsRef = useRef<WebSocket | null>(null)
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const retryCount = useRef(0)
  const MAX_RETRIES = 5

  const clearPingInterval = () => {
    if (pingInterval.current) { clearInterval(pingInterval.current); pingInterval.current = null }
  }

  const showToast = (msg: string, type: "info" | "success" | "error" = "info") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const connectWebSocket = () => {
    const wsUrl = process.env.NEXT_PUBLIC_API_WS
    const token = getToken()
    if (!wsUrl || !token) return
    clearPingInterval()
    if (wsRef.current) wsRef.current.close()
    const ws = new WebSocket(`${wsUrl}/ws/admin?token=${token}`)
    wsRef.current = ws
    ws.onopen = () => {
      setWsStatus("connected"); retryCount.current = 0
      pingInterval.current = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send("ping") }, 30000)
    }
    ws.onmessage = (event) => { if (event.data === "pong") return; showToast(event.data, "info"); fetchPending() }
    ws.onerror = () => {}
    ws.onclose = () => {
      clearPingInterval(); setWsStatus("disconnected")
      if (retryCount.current < MAX_RETRIES) {
        const delay = Math.min(1000 * 2 ** retryCount.current, 30000)
        retryCount.current += 1; setWsStatus("retrying")
        retryTimeout.current = setTimeout(connectWebSocket, delay)
      }
    }
  }

  useEffect(() => {
    const token = getToken(); if (!token) { router.push("/"); return }
    connectWebSocket()
    return () => { clearPingInterval(); if (retryTimeout.current) clearTimeout(retryTimeout.current); wsRef.current?.close() }
  }, [])

  useEffect(() => {
    const token = getToken(); if (!token) { router.push("/"); return }
    const init = async () => { setLoading(true); await Promise.all([fetchPending(), fetchRejected()]); setLoading(false) }
    init()
  }, [])

  useEffect(() => {
    document.body.style.overflow = (rejectModalOpen || !!previewBlog) ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [rejectModalOpen, previewBlog])

  const fetchPending = async () => {
    const token = getToken(); if (!token) return
    try { const res = await api.get("/admin/pending", { headers: { Authorization: `Bearer ${token}` } }); setPendingBlogs(res.data) } catch {}
  }

  const fetchRejected = async () => {
    const token = getToken(); if (!token) return
    try { const res = await api.get("/admin/rejected", { headers: { Authorization: `Bearer ${token}` } }); setRejectedBlogs(res.data) } catch {}
  }

  const approveBlog = async (id: string) => {
    const token = getToken(); if (!token) return
    try {
      await api.put(`/admin/approve/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } })
      showToast("Blog approved successfully.", "success"); setPreviewBlog(null); fetchPending()
    } catch { showToast("Failed to approve.", "error") }
  }

  const openRejectModal = (id: string) => {
    setRejectTargetId(id); setRejectReason(""); setRejectError(null); setRejectModalOpen(true)
  }

  const submitReject = async () => {
    if (!rejectReason.trim()) { setRejectError("Please provide a rejection reason."); return }
    if (!rejectTargetId) return
    setRejectSubmitting(true)
    try {
      const token = getToken()
      await api.put(`/admin/reject/${rejectTargetId}?reason=${encodeURIComponent(rejectReason)}`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setRejectModalOpen(false); setPreviewBlog(null)
      showToast("Blog rejected.", "error"); fetchPending(); fetchRejected()
    } catch { setRejectError("Failed to reject. Please try again.") }
    finally { setRejectSubmitting(false) }
  }

  const logout = () => {
    clearPingInterval(); wsRef.current?.close()
    localStorage.removeItem("token"); localStorage.removeItem("role"); router.push("/")
  }

  const blogs = tab === "pending" ? pendingBlogs : rejectedBlogs
  const filteredBlogs = blogs.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.content.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .adm { font-family: 'DM Sans', sans-serif; min-height: 100vh; background: #f9f6f1; color: #2c2825; }
        .adm::before { content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E"); opacity: 0.4; }

        .adm-inner { position: relative; z-index: 1; max-width: 860px; margin: 0 auto; padding: 24px 16px 80px; }
        @media (min-width: 640px) { .adm-inner { padding: 40px 24px 100px; } }
        @media (min-width: 768px) { .adm-inner { padding: 64px 28px 120px; } }

        /* ── Top bar ── */
        .adm-topbar { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; padding-bottom: 20px; margin-bottom: 24px; border-bottom: 1px solid #e5ddd4; animation: fadeIn 0.5s ease both; }
        @media (min-width: 640px) { .adm-topbar { align-items: center; padding-bottom: 28px; margin-bottom: 28px; gap: 0; } }
        .adm-topbar-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        @media (min-width: 640px) { .adm-topbar-left { gap: 16px; } }
        .adm-site-label { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 700; color: #2c2825; letter-spacing: -0.3px; }
        @media (min-width: 640px) { .adm-site-label { font-size: 18px; } }
        .adm-divider-dot { width: 4px; height: 4px; border-radius: 50%; background: #c4b8a8; display: none; }
        @media (min-width: 400px) { .adm-divider-dot { display: block; } }
        .adm-admin-tag { font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: #a8926a; background: #f5ede0; border: 1px solid #e8d9c4; padding: 3px 9px; border-radius: 100px; }
        @media (min-width: 640px) { .adm-admin-tag { font-size: 11px; padding: 3px 10px; } }

        .adm-topbar-right { display: flex; align-items: center; gap: 12px; }
        .adm-ws-status { display: flex; align-items: center; gap: 6px; }
        .adm-ws-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .adm-ws-dot.connected { background: #4ade80; }
        .adm-ws-dot.retrying { background: #fbbf24; animation: blink 1s ease-in-out infinite; }
        .adm-ws-dot.disconnected { background: #f87171; }
        .adm-ws-text { font-size: 11px; color: #a39280; }
        @media (min-width: 640px) { .adm-ws-text { font-size: 11.5px; } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

        .adm-signout { font-family: 'DM Sans', sans-serif; font-size: 12px; background: none; border: none; color: #a39280; cursor: pointer; transition: color 0.2s; padding: 0; text-decoration: underline; text-underline-offset: 3px; }
        @media (min-width: 640px) { .adm-signout { font-size: 13px; } }
        .adm-signout:hover { color: #2c2825; }

        /* ── Page heading ── */
        .adm-heading { margin-bottom: 28px; animation: fadeIn 0.5s 0.05s ease both; }
        @media (min-width: 640px) { .adm-heading { margin-bottom: 40px; } }
        .adm-eyebrow { font-size: 10px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #a8926a; margin-bottom: 8px; }
        @media (min-width: 640px) { .adm-eyebrow { font-size: 11px; } }
        .adm-title { font-family: 'Playfair Display', serif; font-size: clamp(26px, 5vw, 44px); font-weight: 700; color: #2c2825; line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 14px; }
        @media (min-width: 640px) { .adm-title { margin-bottom: 16px; } }

        /* Stats row */
        .adm-stats { display: flex; gap: 18px; flex-wrap: wrap; }
        @media (min-width: 480px) { .adm-stats { gap: 24px; } }
        @media (min-width: 640px) { .adm-stats { gap: 32px; } }
        .adm-stat-num { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; line-height: 1; margin-bottom: 3px; }
        @media (min-width: 640px) { .adm-stat-num { font-size: 28px; } }
        .adm-stat-num.gold { color: #a8926a; }
        .adm-stat-num.green { color: #16a34a; }
        .adm-stat-num.red { color: #dc2626; }
        .adm-stat-label { font-size: 10.5px; color: #a39280; letter-spacing: 0.04em; }
        @media (min-width: 640px) { .adm-stat-label { font-size: 11.5px; } }
        .adm-stat-sep { width: 1px; background: #e5ddd4; align-self: stretch; }

        /* ── Toolbar ── */
        .adm-toolbar { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; animation: fadeIn 0.5s 0.1s ease both; }
        @media (min-width: 600px) { .adm-toolbar { flex-direction: row; align-items: center; gap: 20px; margin-bottom: 32px; } }

        .adm-tabs { display: flex; gap: 0; border-bottom: 2px solid #e5ddd4; }
        .adm-tab { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; padding: 8px 14px; background: none; border: none; cursor: pointer; color: #a39280; position: relative; transition: color 0.2s; margin-bottom: -2px; display: flex; align-items: center; gap: 7px; }
        @media (min-width: 640px) { .adm-tab { font-size: 14px; padding: 8px 20px; } }
        .adm-tab.active { color: #2c2825; border-bottom: 2px solid #2c2825; }
        .adm-tab:hover { color: #2c2825; }
        .adm-badge { font-size: 10px; font-weight: 600; padding: 1px 7px; border-radius: 100px; line-height: 1.7; }
        .adm-badge.amber { background: #fef3c7; color: #92400e; }
        .adm-badge.rose { background: #fee2e2; color: #991b1b; }

        .adm-search { flex: 1; min-width: 0; position: relative; }
        .adm-search-input { width: 100%; font-family: 'DM Sans', sans-serif; background: #ffffff; border: 1px solid #e5ddd4; border-radius: 8px; padding: 9px 14px 9px 36px; font-size: 13px; color: #2c2825; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        @media (min-width: 640px) { .adm-search-input { font-size: 13.5px; } }
        .adm-search-input:focus { border-color: #a8926a; box-shadow: 0 0 0 3px rgba(168,146,106,0.1); }
        .adm-search-input::placeholder { color: #c4b8a8; }
        .adm-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #c4b8a8; font-size: 13px; pointer-events: none; }

        /* ── Skeleton ── */
        .adm-skeleton { margin-bottom: 1px; padding: 28px 0; border-bottom: 1px solid #e5ddd4; animation: shimmer 1.4s ease-in-out infinite; }
        @media (min-width: 640px) { .adm-skeleton { padding: 32px 0; } }
        .adm-skel-line { height: 11px; background: #ede8e1; border-radius: 4px; margin-bottom: 10px; }
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.5} }

        /* ── Empty state ── */
        .adm-empty { text-align: center; padding: 56px 0; animation: fadeIn 0.4s ease both; }
        @media (min-width: 640px) { .adm-empty { padding: 80px 0; } }
        .adm-empty-title { font-family: 'Playfair Display', serif; font-size: 18px; color: #c4b8a8; margin-bottom: 6px; font-style: italic; }
        @media (min-width: 640px) { .adm-empty-title { font-size: 20px; } }
        .adm-empty-sub { font-size: 13px; color: #c4b8a8; }

        /* ── Blog list ── */
        .adm-item { padding: 24px 0; border-bottom: 1px solid #e5ddd4; display: flex; flex-direction: column; gap: 16px; animation: fadeIn 0.4s ease both; }
        @media (min-width: 600px) { .adm-item { display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: start; padding: 32px 0; } }
        .adm-item:first-child { border-top: 1px solid #e5ddd4; }

        .adm-item-left { min-width: 0; }
        .adm-item-right { display: flex; flex-direction: row; align-items: center; gap: 12px; flex-shrink: 0; flex-wrap: wrap; }
        @media (min-width: 600px) { .adm-item-right { flex-direction: column; align-items: flex-end; } }

        .adm-item-title { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 600; color: #2c2825; line-height: 1.3; margin-bottom: 8px; cursor: pointer; transition: color 0.2s; display: inline; }
        @media (min-width: 640px) { .adm-item-title { font-size: 20px; margin-bottom: 10px; } }
        .adm-item-title:hover { color: #a8926a; }

        .adm-item-excerpt { font-size: 13px; color: #78716c; line-height: 1.75; margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        @media (min-width: 640px) { .adm-item-excerpt { font-size: 14px; margin-bottom: 16px; } }

        .adm-item-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        @media (min-width: 640px) { .adm-item-meta { gap: 14px; } }
        .adm-item-thumb { width: 64px; height: 48px; border-radius: 6px; object-fit: cover; display: block; flex-shrink: 0; border: 1px solid #e5ddd4; }
        @media (min-width: 600px) { .adm-item-thumb { width: 72px; height: 52px; } }

        .adm-status-pending { font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: #92400e; background: #fef3c7; border: 1px solid #fde68a; padding: 3px 8px; border-radius: 4px; white-space: nowrap; }
        .adm-status-rejected { font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: #991b1b; background: #fee2e2; border: 1px solid #fecaca; padding: 3px 8px; border-radius: 4px; white-space: nowrap; }

        .adm-actions { display: flex; gap: 8px; }
        .adm-btn-approve { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; padding: 7px 14px; border-radius: 6px; background: #2c2825; color: #f9f6f1; border: none; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        @media (min-width: 640px) { .adm-btn-approve { font-size: 13px; padding: 8px 18px; } }
        .adm-btn-approve:hover { background: #16a34a; transform: translateY(-1px); }
        .adm-btn-reject { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; padding: 7px 14px; border-radius: 6px; background: transparent; color: #78716c; border: 1px solid #e5ddd4; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        @media (min-width: 640px) { .adm-btn-reject { font-size: 13px; padding: 8px 18px; } }
        .adm-btn-reject:hover { border-color: #dc2626; color: #dc2626; background: #fff5f5; }

        .adm-preview-link { font-size: 12px; color: #a39280; background: none; border: none; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; font-family: 'DM Sans', sans-serif; transition: color 0.2s; padding: 0; }
        @media (min-width: 640px) { .adm-preview-link { font-size: 12.5px; } }
        .adm-preview-link:hover { color: #2c2825; }

        /* ── Modals (bottom sheet on mobile) ── */
        .adm-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(44,40,37,0.5); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; padding: 0; animation: fadeIn 0.2s ease; }
        @media (min-width: 640px) { .adm-overlay { align-items: center; padding: 24px; } }

        .adm-modal { background: #f9f6f1; border: 1px solid #e5ddd4; border-radius: 20px 20px 0 0; width: 100%; max-width: 100%; padding: 24px 20px 32px; position: relative; box-shadow: 0 -8px 40px rgba(44,40,37,0.15); animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1); max-height: 90vh; overflow-y: auto; }
        @media (min-width: 640px) { .adm-modal { border-radius: 16px; max-width: 440px; padding: 36px 40px 32px; box-shadow: 0 24px 64px rgba(44,40,37,0.15); } }

        /* Drag handle for modal */
        .adm-modal-handle { width: 36px; height: 4px; background: #e5ddd4; border-radius: 2px; margin: 0 auto 20px; display: block; }
        @media (min-width: 640px) { .adm-modal-handle { display: none; } }

        @keyframes slideUp { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
        @media (min-width: 640px) { @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} } }

        .adm-modal-close { position: absolute; top: 16px; right: 16px; background: #f0ebe4; border: none; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #a39280; font-size: 14px; line-height: 1; transition: all 0.2s; }
        @media (min-width: 640px) { .adm-modal-close { top: 18px; right: 18px; width: 32px; height: 32px; background: none; } }
        .adm-modal-close:hover { background: #2c2825; color: #f9f6f1; }

        .adm-modal-label-top { font-size: 10px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; color: #a8926a; margin-bottom: 7px; }
        @media (min-width: 640px) { .adm-modal-label-top { font-size: 11px; margin-bottom: 8px; } }
        .adm-modal-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #2c2825; margin-bottom: 5px; }
        @media (min-width: 640px) { .adm-modal-title { font-size: 22px; margin-bottom: 6px; } }
        .adm-modal-sub { font-size: 13px; color: #a39280; margin-bottom: 20px; line-height: 1.6; }
        @media (min-width: 640px) { .adm-modal-sub { margin-bottom: 24px; } }
        .adm-modal-field-label { font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: #78716c; display: block; margin-bottom: 8px; }
        .adm-modal-textarea { width: 100%; font-family: 'DM Sans', sans-serif; background: #ffffff; border: 1px solid #e5ddd4; border-radius: 8px; padding: 12px 14px; font-size: 14px; color: #2c2825; outline: none; resize: none; min-height: 100px; line-height: 1.7; transition: border-color 0.2s, box-shadow 0.2s; }
        @media (min-width: 640px) { .adm-modal-textarea { min-height: 110px; } }
        .adm-modal-textarea:focus { border-color: #a8926a; box-shadow: 0 0 0 3px rgba(168,146,106,0.1); }
        .adm-modal-textarea::placeholder { color: #c4b8a8; }
        .adm-modal-error { background: #fff1f2; border: 1px solid #fecdd3; color: #9f1239; border-radius: 6px; padding: 10px 14px; font-size: 13px; margin-top: 10px; }
        .adm-modal-footer { display: flex; gap: 8px; justify-content: stretch; margin-top: 18px; }
        @media (min-width: 640px) { .adm-modal-footer { justify-content: flex-end; gap: 10px; margin-top: 20px; } }
        .adm-modal-cancel { font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500; padding: 11px 20px; border-radius: 7px; border: 1px solid #e5ddd4; background: transparent; color: #78716c; cursor: pointer; transition: all 0.2s; flex: 1; }
        @media (min-width: 640px) { .adm-modal-cancel { flex: none; } }
        .adm-modal-cancel:hover { background: #f0ebe4; }
        .adm-modal-confirm { font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500; padding: 11px 20px; border-radius: 7px; border: none; background: #2c2825; color: #f9f6f1; cursor: pointer; transition: all 0.2s; flex: 1; }
        @media (min-width: 640px) { .adm-modal-confirm { flex: none; padding: 10px 24px; } }
        .adm-modal-confirm:hover:not(:disabled) { background: #dc2626; }
        .adm-modal-confirm:disabled { background: #c4b8a8; cursor: not-allowed; }

        /* ── Preview modal ── */
        .adm-preview-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(44,40,37,0.5); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; padding: 0; animation: fadeIn 0.2s ease; }
        @media (min-width: 640px) { .adm-preview-overlay { align-items: center; padding: 24px; } }

        .adm-preview-card { background: #f9f6f1; border: 1px solid #e5ddd4; border-radius: 20px 20px 0 0; width: 100%; max-height: 92vh; overflow-y: auto; box-shadow: 0 -8px 40px rgba(44,40,37,0.15); animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1); position: relative; }
        @media (min-width: 640px) { .adm-preview-card { border-radius: 16px; max-width: 640px; max-height: 88vh; box-shadow: 0 24px 64px rgba(44,40,37,0.15); } }
        .adm-preview-card::-webkit-scrollbar { width: 4px; }
        .adm-preview-card::-webkit-scrollbar-thumb { background: #e5ddd4; border-radius: 2px; }

        .adm-preview-handle { width: 36px; height: 4px; background: rgba(255,255,255,0.4); border-radius: 2px; margin: 12px auto 0; display: block; position: absolute; top: 0; left: 50%; transform: translateX(-50%); }
        @media (min-width: 640px) { .adm-preview-handle { display: none; } }

        .adm-preview-img { width: 100%; height: 180px; object-fit: cover; display: block; border-radius: 20px 20px 0 0; }
        @media (min-width: 640px) { .adm-preview-img { height: 240px; border-radius: 16px 16px 0 0; } }
        .adm-preview-body { padding: 24px 20px 28px; }
        @media (min-width: 640px) { .adm-preview-body { padding: 36px 40px; } }
        .adm-preview-close { position: absolute; top: 14px; right: 14px; background: rgba(249,246,241,0.9); border: 1px solid #e5ddd4; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #78716c; transition: all 0.2s; font-size: 13px; backdrop-filter: blur(4px); }
        @media (min-width: 640px) { .adm-preview-close { top: 18px; right: 18px; width: 32px; height: 32px; font-size: 14px; } }
        .adm-preview-close:hover { background: #2c2825; color: #f9f6f1; }
        .adm-preview-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #2c2825; margin-bottom: 16px; line-height: 1.25; }
        @media (min-width: 640px) { .adm-preview-title { font-size: 26px; margin-bottom: 20px; } }
        .adm-preview-content { font-size: 14px; color: #57534e; line-height: 1.85; white-space: pre-wrap; margin-bottom: 24px; }
        @media (min-width: 640px) { .adm-preview-content { font-size: 15px; margin-bottom: 28px; } }
        .adm-preview-divider { height: 1px; background: #e5ddd4; margin-bottom: 20px; }
        @media (min-width: 640px) { .adm-preview-divider { margin-bottom: 24px; } }

        /* ── Toast ── */
        .adm-toast { position: fixed; bottom: 20px; left: 16px; right: 16px; z-index: 300; font-size: 13px; padding: 12px 18px; border-radius: 10px; display: flex; align-items: center; gap: 10px; animation: toastIn 0.3s cubic-bezier(0.16,1,0.3,1); font-family: 'DM Sans', sans-serif; font-weight: 500; box-shadow: 0 8px 32px rgba(44,40,37,0.15); }
        @media (min-width: 480px) { .adm-toast { left: 50%; right: auto; transform: translateX(-50%); bottom: 32px; white-space: nowrap; font-size: 13.5px; padding: 12px 22px; border-radius: 8px; } }
        .adm-toast.info { background: #2c2825; color: #f9f6f1; }
        .adm-toast.success { background: #f0fdf4; color: #14532d; border: 1px solid #bbf7d0; }
        .adm-toast.error { background: #fff1f2; color: #9f1239; border: 1px solid #fecdd3; }
        @keyframes toastIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @media (min-width: 480px) { @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} } }

        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="adm">
        <div className="adm-inner">

          {/* ── Top bar ── */}
          <div className="adm-topbar">
            <div className="adm-topbar-left">
              <span className="adm-site-label">MyBlog</span>
              <div className="adm-divider-dot" />
              <span className="adm-admin-tag">Admin</span>
              <div className="adm-ws-status">
                <span className={`adm-ws-dot ${wsStatus}`} />
                <span className="adm-ws-text">
                  {wsStatus === "connected" ? "Live" : wsStatus === "retrying" ? "Reconnecting…" : "Offline"}
                </span>
              </div>
            </div>
            <div className="adm-topbar-right">
              <button className="adm-signout" onClick={logout}>Sign out</button>
            </div>
          </div>

          {/* ── Page heading ── */}
          <div className="adm-heading">
            <p className="adm-eyebrow">Editorial Review</p>
            <h1 className="adm-title">Admin Dashboard</h1>
            <div className="adm-stats">
              <div className="adm-stat">
                <div className="adm-stat-num gold">{pendingBlogs.length + rejectedBlogs.length}</div>
                <div className="adm-stat-label">Total submissions</div>
              </div>
              <div className="adm-stat-sep" />
              <div className="adm-stat">
                <div className="adm-stat-num green">{pendingBlogs.length}</div>
                <div className="adm-stat-label">Awaiting review</div>
              </div>
              <div className="adm-stat-sep" />
              <div className="adm-stat">
                <div className="adm-stat-num red">{rejectedBlogs.length}</div>
                <div className="adm-stat-label">Rejected</div>
              </div>
            </div>
          </div>

          {/* ── Toolbar ── */}
          <div className="adm-toolbar">
            <div className="adm-tabs">
              <button className={`adm-tab${tab === "pending" ? " active" : ""}`} onClick={() => { setTab("pending"); setSearch("") }}>
                Pending
                {pendingBlogs.length > 0 && <span className="adm-badge amber">{pendingBlogs.length}</span>}
              </button>
              <button className={`adm-tab${tab === "rejected" ? " active" : ""}`} onClick={() => { setTab("rejected"); setSearch("") }}>
                Rejected
                {rejectedBlogs.length > 0 && <span className="adm-badge rose">{rejectedBlogs.length}</span>}
              </button>
            </div>
            <div className="adm-search">
              <span className="adm-search-icon">⌕</span>
              <input
                className="adm-search-input"
                placeholder="Search by title or content…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* ── Blog list ── */}
          {loading ? (
            <div>
              {[1,2,3].map(i => (
                <div key={i} className="adm-skeleton">
                  <div className="adm-skel-line" style={{ width: "55%", height: 18, marginBottom: 14 }} />
                  <div className="adm-skel-line" style={{ width: "90%" }} />
                  <div className="adm-skel-line" style={{ width: "70%" }} />
                </div>
              ))}
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="adm-empty">
              <div className="adm-empty-title">{search ? `No results for "${search}"` : `No ${tab} submissions`}</div>
              <div className="adm-empty-sub">{search ? "Try a different search term." : "Check back later."}</div>
            </div>
          ) : (
            <div className="adm-list">
              {filteredBlogs.map((blog, i) => (
                <div key={blog.id} className="adm-item" style={{ animationDelay: `${i * 0.06}s` }}>

                  <div className="adm-item-left">
                    <h2 className="adm-item-title" onClick={() => setPreviewBlog(blog)}>
                      {blog.title}
                    </h2>
                    <p className="adm-item-excerpt">{blog.content}</p>
                    <div className="adm-item-meta">
                      {tab === "pending"
                        ? <span className="adm-status-pending">Pending review</span>
                        : <span className="adm-status-rejected">Rejected</span>
                      }
                      <button className="adm-preview-link" onClick={() => setPreviewBlog(blog)}>
                        Read full post
                      </button>
                    </div>
                  </div>

                  <div className="adm-item-right">
                    {blog.image_url && (
                      <img src={blog.image_url} alt={blog.title} className="adm-item-thumb" />
                    )}
                    {tab === "pending" && (
                      <div className="adm-actions">
                        <button className="adm-btn-approve" onClick={() => approveBlog(blog.id)}>Approve</button>
                        <button className="adm-btn-reject" onClick={() => openRejectModal(blog.id)}>Reject</button>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── Reject Modal ── */}
      {rejectModalOpen && (
        <div className="adm-overlay" onClick={(e) => { if (e.target === e.currentTarget) setRejectModalOpen(false) }}>
          <div className="adm-modal">
            <span className="adm-modal-handle" />
            <button className="adm-modal-close" onClick={() => setRejectModalOpen(false)}>✕</button>
            <p className="adm-modal-label-top">Editorial Decision</p>
            <h2 className="adm-modal-title">Reject Submission</h2>
            <p className="adm-modal-sub">Provide a reason so the author can improve and resubmit.</p>
            <label className="adm-modal-field-label">Reason for rejection</label>
            <textarea
              className="adm-modal-textarea"
              placeholder="e.g. The content doesn't meet our editorial guidelines…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            {rejectError && <div className="adm-modal-error">{rejectError}</div>}
            <div className="adm-modal-footer">
              <button className="adm-modal-cancel" onClick={() => setRejectModalOpen(false)}>Cancel</button>
              <button className="adm-modal-confirm" onClick={submitReject} disabled={rejectSubmitting}>
                {rejectSubmitting ? "Rejecting…" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {previewBlog && (
        <div className="adm-preview-overlay" onClick={(e) => { if (e.target === e.currentTarget) setPreviewBlog(null) }}>
          <div className="adm-preview-card">
            <span className="adm-preview-handle" />
            <button className="adm-preview-close" onClick={() => setPreviewBlog(null)}>✕</button>
            {previewBlog.image_url && (
              <img src={previewBlog.image_url} alt={previewBlog.title} className="adm-preview-img" />
            )}
            <div className="adm-preview-body">
              <h2 className="adm-preview-title">{previewBlog.title}</h2>
              <div className="adm-preview-divider" />
              <p className="adm-preview-content">{previewBlog.content}</p>
              {tab === "pending" && (
                <div className="adm-actions">
                  <button className="adm-btn-approve" onClick={() => approveBlog(previewBlog.id)}>Approve</button>
                  <button className="adm-btn-reject" onClick={() => { setPreviewBlog(null); openRejectModal(previewBlog.id) }}>Reject</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && <div className={`adm-toast ${toast.type}`}>{toast.msg}</div>}
    </>
  )
}