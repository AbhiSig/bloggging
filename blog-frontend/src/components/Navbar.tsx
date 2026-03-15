"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Menu, X, MessageCircle, PenLine, BookOpen, LogOut, Send, CheckCircle, LayoutDashboard, Inbox } from "lucide-react"
import { useRouter } from "next/navigation"
import RegisterModal from "@/components/RegisterModal"
import LoginModal from "@/components/LoginModal"
import { api } from "@/lib/api"

type Message = {
  id: string
  subject: string
  message: string
  username?: string
  email?: string
  created_at?: string
  replied?: boolean
  reply?: string
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const [token, setToken] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  const [openRegister, setOpenRegister] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  const [msgOpen, setMsgOpen] = useState(false)
  const [msgText, setMsgText] = useState("")
  const [msgSubject, setMsgSubject] = useState("")
  const [msgSending, setMsgSending] = useState(false)
  const [msgSent, setMsgSent] = useState(false)
  const [msgError, setMsgError] = useState<string | null>(null)

  const [inboxOpen, setInboxOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inboxLoading, setInboxLoading] = useState(false)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replySending, setReplySending] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)
  const [replySuccess, setReplySuccess] = useState<string | null>(null)

  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", handleScroll)
    syncAuth()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => { if (!loginOpen) syncAuth() }, [loginOpen])
  useEffect(() => { if (!openRegister) syncAuth() }, [openRegister])

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 768) setMobileOpen(false) }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Lock scroll when mobile menu or modals open
  useEffect(() => {
    document.body.style.overflow = (msgOpen || inboxOpen || mobileOpen) ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [msgOpen, inboxOpen, mobileOpen])

  const syncAuth = () => {
    const storedToken = localStorage.getItem("token")
    const storedRole = localStorage.getItem("role")
    const storedUsername = localStorage.getItem("username")
    setToken(storedToken)
    setRole(storedRole)
    if (storedUsername && storedUsername !== "undefined" && storedUsername !== "null" && storedUsername.trim() !== "") {
      setUsername(storedUsername)
    } else {
      setUsername(null)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const logout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("role"); localStorage.removeItem("username")
    setToken(null); setRole(null); setUsername(null)
    setUserMenuOpen(false); setMobileOpen(false)
    router.push("/")
  }

  const openLoginModal = () => { setOpenRegister(false); setLoginOpen(true); setMobileOpen(false) }
  const openRegisterModal = () => { setLoginOpen(false); setOpenRegister(true); setMobileOpen(false) }

  const openMsgModal = () => {
    setUserMenuOpen(false); setMobileOpen(false)
    setMsgText(""); setMsgSubject(""); setMsgSent(false); setMsgError(null)
    setMsgOpen(true)
  }

  const sendMessage = async () => {
    if (!msgSubject.trim() || !msgText.trim()) { setMsgError("Please fill in both subject and message."); return }
    setMsgSending(true); setMsgError(null)
    try {
      const t = localStorage.getItem("token")
      await api.post("/messages/", { subject: msgSubject, message: msgText }, {
        headers: { Authorization: `Bearer ${t}` }
      })
      setMsgSent(true)
      setTimeout(() => setMsgOpen(false), 2200)
    } catch (err: any) {
      setMsgError(err?.response?.data?.detail || "Failed to send. Please try again.")
    } finally { setMsgSending(false) }
  }

  const openInbox = async () => {
    setUserMenuOpen(false); setMobileOpen(false)
    setInboxOpen(true); setInboxLoading(true)
    setReplyingId(null); setReplyText(""); setReplyError(null); setReplySuccess(null)
    try {
      const t = localStorage.getItem("token")
      const res = await api.get("/messages/", { headers: { Authorization: `Bearer ${t}` } })
      setMessages(res.data)
    } catch { } finally { setInboxLoading(false) }
  }

  const submitReply = async (id: string) => {
    if (!replyText.trim()) { setReplyError("Reply cannot be empty."); return }
    setReplySending(true); setReplyError(null)
    try {
      const t = localStorage.getItem("token")
      await api.post(`/messages/${id}/reply`, { reply: replyText }, { headers: { Authorization: `Bearer ${t}` } })
      setReplySuccess(id); setReplyingId(null); setReplyText("")
      const res = await api.get("/messages/", { headers: { Authorization: `Bearer ${t}` } })
      setMessages(res.data)
    } catch (err: any) {
      setReplyError(err?.response?.data?.detail || "Failed to send reply.")
    } finally { setReplySending(false) }
  }

  const isAdmin = role === "ADMIN"
  const initials = username
    ? username.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "U"

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,600&family=DM+Sans:wght@300;400;500&display=swap');

        .nb-wrap { position: fixed; top: 0; left: 0; right: 0; z-index: 50; display: flex; justify-content: center; font-family: 'DM Sans', sans-serif; }
        .nb-inner { transition: all 0.45s cubic-bezier(0.16,1,0.3,1); background: rgba(250,248,244,0.95); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid #e8e0d5; }
        .nb-inner.scrolled { width: 88%; margin-top: 14px; border-radius: 100px; padding: 10px 28px; box-shadow: 0 8px 32px rgba(28,25,23,0.1); }
        .nb-inner.top { width: 100%; margin-top: 0; border-radius: 0; border-left: none; border-right: none; border-top: none; padding: 14px 20px; }
        @media (min-width: 768px) { .nb-inner.top { padding: 16px 40px; } }
        .nb-row { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }

        .nb-logo { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #1c1917; text-decoration: none; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px; }
        @media (min-width: 768px) { .nb-logo { font-size: 22px; } }
        .nb-logo-dot { width: 7px; height: 7px; border-radius: 50%; background: #a8926a; display: inline-block; margin-bottom: 2px; }

        /* Desktop links */
        .nb-links { display: none; align-items: center; gap: 32px; }
        @media (min-width: 768px) { .nb-links { display: flex; } }

        .nb-link { font-size: 14px; font-weight: 500; color: #57534e; text-decoration: none; position: relative; letter-spacing: 0.01em; transition: color 0.2s; }
        .nb-link::after { content: ''; position: absolute; left: 0; bottom: -3px; width: 0; height: 1.5px; background: #a8926a; transition: width 0.3s cubic-bezier(0.16,1,0.3,1); }
        .nb-link:hover { color: #1c1917; }
        .nb-link:hover::after { width: 100%; }

        .nb-btn-login { font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500; padding: 8px 20px; border-radius: 100px; border: 1.5px solid #d6c9b0; background: transparent; color: #57534e; cursor: pointer; transition: all 0.2s; }
        .nb-btn-login:hover { border-color: #a8926a; color: #1c1917; background: #fdf8f0; }
        .nb-btn-register { font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500; padding: 8px 22px; border-radius: 100px; border: none; background: #1c1917; color: #faf8f4; cursor: pointer; transition: all 0.25s; }
        .nb-btn-register:hover { background: #a8926a; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(168,146,106,0.3); }

        .nb-user-btn { display: flex; align-items: center; gap: 9px; padding: 6px 16px 6px 6px; border-radius: 100px; border: 1.5px solid #e8e0d5; background: transparent; cursor: pointer; transition: all 0.2s; }
        .nb-user-btn:hover { border-color: #a8926a; background: #fdf8f0; }
        .nb-user-btn.admin-btn { border-color: #a8926a; background: linear-gradient(135deg, #fdf8f0, #faf4e8); }

        .nb-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #1c1917, #a8926a); color: #faf8f4; font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center; letter-spacing: 0.05em; flex-shrink: 0; }
        .nb-avatar.admin-avatar { background: linear-gradient(135deg, #a8926a, #c4a882); }
        .nb-username { font-size: 13.5px; font-weight: 500; color: #1c1917; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .nb-chevron { font-size: 10px; color: #a39280; margin-left: 2px; transition: transform 0.2s; }
        .nb-chevron.open { transform: rotate(180deg); }

        .nb-dropdown { position: absolute; right: 0; top: calc(100% + 12px); width: 220px; background: #ffffff; border: 1px solid #e8e0d5; border-radius: 18px; box-shadow: 0 16px 48px rgba(28,25,23,0.12); padding: 8px; overflow: hidden; animation: dropIn 0.2s cubic-bezier(0.16,1,0.3,1); }
        @keyframes dropIn { from { opacity:0; transform:translateY(-8px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }

        .nb-dropdown-header { padding: 12px 14px 10px; border-bottom: 1px solid #f0ebe4; margin-bottom: 6px; }
        .nb-dropdown-name { font-size: 14px; font-weight: 600; color: #1c1917; }
        .nb-dropdown-role { font-size: 11px; color: #a39280; margin-top: 3px; letter-spacing: 0.05em; text-transform: uppercase; }
        .nb-dropdown-role.admin-role { color: #a8926a; font-weight: 600; }

        .nb-dropdown-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 12px; font-size: 13.5px; color: #44403c; text-decoration: none; cursor: pointer; transition: all 0.15s; border: none; background: transparent; width: 100%; text-align: left; font-family: 'DM Sans', sans-serif; font-weight: 400; }
        .nb-dropdown-item:hover { background: #faf8f4; color: #1c1917; }
        .nb-dropdown-item.danger { color: #be123c; }
        .nb-dropdown-item.danger:hover { background: #fff1f2; }
        .nb-dropdown-divider { height: 1px; background: #f0ebe4; margin: 6px 0; }
        .nb-dropdown-icon { width: 30px; height: 30px; border-radius: 9px; background: #f5f0e8; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .nb-dropdown-item.danger .nb-dropdown-icon { background: #fff1f2; }

        /* Mobile toggle */
        .nb-mobile-toggle { display: flex; background: none; border: none; cursor: pointer; color: #1c1917; padding: 6px; border-radius: 8px; transition: background 0.2s; }
        .nb-mobile-toggle:hover { background: #f0ebe4; }
        @media (min-width: 768px) { .nb-mobile-toggle { display: none; } }
        .nb-user-wrap { position: relative; }

        /* ── Mobile Drawer ── */
        .nb-mobile-backdrop { position: fixed; inset: 0; z-index: 40; background: rgba(28,25,23,0.4); backdrop-filter: blur(4px); animation: overlayIn 0.2s ease; }
        .nb-mobile-drawer { position: fixed; top: 0; right: 0; bottom: 0; z-index: 41; width: min(300px, 85vw); background: #faf8f4; box-shadow: -16px 0 48px rgba(28,25,23,0.15); display: flex; flex-direction: column; animation: drawerIn 0.3s cubic-bezier(0.16,1,0.3,1); overflow-y: auto; }
        @keyframes drawerIn { from { transform: translateX(100%) } to { transform: translateX(0) } }

        .nb-drawer-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 16px; border-bottom: 1px solid #e8e0d5; }
        .nb-drawer-logo { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #1c1917; text-decoration: none; display: flex; align-items: center; gap: 7px; }
        .nb-drawer-close { background: #f0ebe4; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #78716c; transition: all 0.2s; }
        .nb-drawer-close:hover { background: #1c1917; color: #faf8f4; }

        .nb-drawer-user { display: flex; align-items: center; gap: 12px; padding: 16px 20px; background: #ffffff; border-bottom: 1px solid #f0ebe4; }
        .nb-drawer-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #1c1917, #a8926a); color: #faf8f4; font-size: 14px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .nb-drawer-avatar.admin { background: linear-gradient(135deg, #a8926a, #c4a882); }
        .nb-drawer-user-name { font-size: 15px; font-weight: 600; color: #1c1917; }
        .nb-drawer-user-role { font-size: 11px; color: #a8926a; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }

        .nb-drawer-section { padding: 10px 12px; border-bottom: 1px solid #f0ebe4; }
        .nb-drawer-section-label { font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #c4b8a8; padding: 6px 8px 4px; }
        .nb-drawer-item { display: flex; align-items: center; gap: 12px; padding: 11px 10px; border-radius: 12px; font-size: 14px; color: #44403c; text-decoration: none; cursor: pointer; transition: all 0.15s; border: none; background: transparent; width: 100%; text-align: left; font-family: 'DM Sans', sans-serif; font-weight: 400; }
        .nb-drawer-item:hover { background: #f0ebe4; color: #1c1917; }
        .nb-drawer-item.danger { color: #be123c; }
        .nb-drawer-item.danger:hover { background: #fff1f2; }
        .nb-drawer-icon { width: 34px; height: 34px; border-radius: 10px; background: #f5f0e8; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .nb-drawer-item.danger .nb-drawer-icon { background: #fff1f2; }

        .nb-drawer-auth { padding: 16px 12px; display: flex; flex-direction: column; gap: 10px; margin-top: auto; border-top: 1px solid #e8e0d5; }
        .nb-drawer-btn-login { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; padding: 12px; border-radius: 12px; border: 1.5px solid #d6c9b0; background: transparent; color: #57534e; cursor: pointer; transition: all 0.2s; text-align: center; }
        .nb-drawer-btn-login:hover { border-color: #a8926a; color: #1c1917; }
        .nb-drawer-btn-register { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; padding: 12px; border-radius: 12px; border: none; background: #1c1917; color: #faf8f4; cursor: pointer; transition: all 0.25s; text-align: center; }
        .nb-drawer-btn-register:hover { background: #a8926a; }

        /* ── Modals ── */
        .modal-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(28,25,23,0.45); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); display: flex; align-items: flex-end; justify-content: center; padding: 0; animation: overlayIn 0.25s ease; }
        @media (min-width: 640px) { .modal-overlay { align-items: center; padding: 20px; } }
        @keyframes overlayIn { from { opacity:0 } to { opacity:1 } }

        .msg-card { background: #ffffff; border-radius: 24px 24px 0 0; width: 100%; max-width: 100%; padding: 28px 20px 32px; box-shadow: 0 -8px 40px rgba(28,25,23,0.15); position: relative; overflow: hidden; animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1); max-height: 92vh; overflow-y: auto; }
        @media (min-width: 640px) { .msg-card { border-radius: 24px; max-width: 480px; padding: 36px 40px 32px; animation: cardIn 0.3s cubic-bezier(0.16,1,0.3,1); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(100%) } to { opacity:1; transform:translateY(0) } }
        @keyframes cardIn { from { opacity:0; transform:translateY(24px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
        .msg-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #a8926a, #c4a882, #a8926a); background-size: 200%; animation: shimmer 3s linear infinite; }
        @keyframes shimmer { 0%{background-position:0%} 100%{background-position:200%} }

        /* Mobile drag handle for msg modal */
        .msg-drag-handle { width: 36px; height: 4px; background: #e8e0d5; border-radius: 2px; margin: 0 auto 20px; display: block; }
        @media (min-width: 640px) { .msg-drag-handle { display: none; } }

        .msg-close { position: absolute; top: 18px; right: 18px; background: #f5f0e8; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; color: #78716c; }
        .msg-close:hover { background: #1c1917; color: #faf8f4; }
        .msg-icon-wrap { width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(135deg, #1c1917, #a8926a); display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
        @media (min-width: 640px) { .msg-icon-wrap { width: 48px; height: 48px; border-radius: 16px; margin-bottom: 16px; } }
        .msg-eyebrow { font-size: 11px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; color: #a8926a; margin-bottom: 6px; }
        .msg-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #1c1917; margin-bottom: 4px; }
        @media (min-width: 640px) { .msg-title { font-size: 22px; } }
        .msg-subtitle { font-size: 13px; color: #a39280; margin-bottom: 22px; line-height: 1.5; }
        @media (min-width: 640px) { .msg-subtitle { margin-bottom: 28px; } }
        .msg-label { display: block; font-size: 11.5px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: #78716c; margin-bottom: 7px; }
        .msg-input, .msg-textarea { width: 100%; font-family: 'DM Sans', sans-serif; border: 1.5px solid #e8e0d5; border-radius: 12px; padding: 12px 16px; font-size: 14px; color: #1c1917; background: #faf8f4; outline: none; transition: border-color 0.2s, box-shadow 0.2s; margin-bottom: 16px; box-sizing: border-box; }
        .msg-input:focus, .msg-textarea:focus { border-color: #a8926a; background: #ffffff; box-shadow: 0 0 0 4px rgba(168,146,106,0.1); }
        .msg-input::placeholder, .msg-textarea::placeholder { color: #c4b8a8; }
        .msg-textarea { resize: none; min-height: 110px; line-height: 1.7; }
        .msg-error { background: #fff1f2; color: #9f1239; border: 1px solid #fecdd3; border-radius: 10px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
        .msg-footer { display: flex; gap: 10px; justify-content: stretch; margin-top: 4px; }
        @media (min-width: 640px) { .msg-footer { justify-content: flex-end; } }
        .msg-btn-cancel { font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500; padding: 11px 22px; border-radius: 12px; border: 1.5px solid #e8e0d5; background: transparent; color: #78716c; cursor: pointer; transition: all 0.2s; flex: 1; }
        @media (min-width: 640px) { .msg-btn-cancel { flex: none; } }
        .msg-btn-cancel:hover { border-color: #c4b8a8; background: #faf8f4; }
        .msg-btn-send { font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500; padding: 11px 26px; border-radius: 12px; border: none; background: #1c1917; color: #faf8f4; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.25s; flex: 1; }
        @media (min-width: 640px) { .msg-btn-send { flex: none; } }
        .msg-btn-send:hover:not(:disabled) { background: #a8926a; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(168,146,106,0.3); }
        .msg-btn-send:disabled { background: #d6cfc7; cursor: not-allowed; }
        .msg-success { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px 0 8px; animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1); }
        .msg-success-icon { color: #10b981; margin-bottom: 16px; }
        .msg-success-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #1c1917; margin-bottom: 8px; }
        .msg-success-sub { font-size: 14px; color: #a39280; line-height: 1.6; }

        /* Inbox modal */
        .inbox-card { background: #faf8f4; border-radius: 24px 24px 0 0; width: 100%; max-height: 92vh; display: flex; flex-direction: column; box-shadow: 0 -8px 40px rgba(28,25,23,0.2); overflow: hidden; animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1); }
        @media (min-width: 640px) { .inbox-card { border-radius: 24px; max-width: 580px; max-height: 88vh; animation: cardIn 0.3s cubic-bezier(0.16,1,0.3,1); } }
        .inbox-drag-handle { width: 36px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; margin: 12px auto 0; display: block; }
        @media (min-width: 640px) { .inbox-drag-handle { display: none; } }
        .inbox-header { background: linear-gradient(135deg, #1c1917, #2d2926); padding: 16px 20px 20px; position: relative; flex-shrink: 0; }
        @media (min-width: 640px) { .inbox-header { padding: 28px 32px 24px; } }
        .inbox-header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #a8926a, transparent); }
        .inbox-header-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .inbox-eyebrow { font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #a8926a; margin-bottom: 6px; }
        .inbox-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #f5f0e8; letter-spacing: -0.01em; }
        @media (min-width: 640px) { .inbox-title { font-size: 24px; } }
        .inbox-count { font-size: 12px; color: #78716c; margin-top: 4px; }
        .inbox-close { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #78716c; transition: all 0.2s; flex-shrink: 0; }
        .inbox-close:hover { background: rgba(255,255,255,0.16); color: #f5f0e8; }
        .inbox-body { overflow-y: auto; padding: 16px; flex: 1; }
        @media (min-width: 640px) { .inbox-body { padding: 20px 24px; } }
        .inbox-body::-webkit-scrollbar { width: 4px; }
        .inbox-body::-webkit-scrollbar-track { background: transparent; }
        .inbox-body::-webkit-scrollbar-thumb { background: #d6c9b0; border-radius: 2px; }
        .inbox-empty { text-align: center; padding: 40px 24px; color: #a39280; font-size: 14px; }
        .inbox-empty-icon { font-size: 32px; margin-bottom: 12px; }
        .inbox-loading { text-align: center; padding: 40px; color: #a39280; font-size: 14px; }
        .inbox-msg { background: #ffffff; border: 1px solid #e8e0d5; border-radius: 14px; margin-bottom: 12px; overflow: hidden; transition: box-shadow 0.2s; }
        .inbox-msg:hover { box-shadow: 0 4px 20px rgba(28,25,23,0.08); }
        .inbox-msg.replied { border-left: 3px solid #10b981; }
        .inbox-msg-head { padding: 14px 16px 12px; }
        @media (min-width: 640px) { .inbox-msg-head { padding: 18px 20px 14px; } }
        .inbox-msg-meta { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; gap: 8px; }
        .inbox-msg-from { font-size: 12px; font-weight: 600; color: #1c1917; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        @media (min-width: 640px) { .inbox-msg-from { font-size: 13px; gap: 8px; } }
        .inbox-msg-time { font-size: 11px; color: #c4b8a8; flex-shrink: 0; }
        .inbox-msg-subject { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 600; color: #1c1917; margin-bottom: 5px; }
        @media (min-width: 640px) { .inbox-msg-subject { font-size: 15px; } }
        .inbox-msg-preview { font-size: 13px; color: #78716c; line-height: 1.6; }
        .inbox-replied-badge { display: inline-flex; align-items: center; gap: 4px; background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; border-radius: 100px; padding: 2px 8px; font-size: 10px; font-weight: 500; white-space: nowrap; }
        .inbox-pending-badge { display: inline-flex; align-items: center; gap: 4px; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; border-radius: 100px; padding: 2px 8px; font-size: 10px; font-weight: 500; white-space: nowrap; }
        .inbox-reply-section { border-top: 1px solid #f0ebe4; padding: 12px 16px 16px; background: #faf8f4; }
        @media (min-width: 640px) { .inbox-reply-section { padding: 16px 20px 20px; } }
        .inbox-existing-reply { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 10px 14px; margin-bottom: 10px; font-size: 13px; color: #14532d; line-height: 1.6; }
        .inbox-existing-reply-label { font-size: 10.5px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #15803d; margin-bottom: 6px; }
        .inbox-reply-label { font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: #78716c; display: block; margin-bottom: 8px; }
        .inbox-reply-textarea { width: 100%; font-family: 'DM Sans', sans-serif; border: 1.5px solid #e8e0d5; border-radius: 10px; padding: 11px 14px; font-size: 13.5px; color: #1c1917; background: #ffffff; outline: none; resize: none; min-height: 80px; line-height: 1.6; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; margin-bottom: 10px; }
        .inbox-reply-textarea:focus { border-color: #a8926a; box-shadow: 0 0 0 3px rgba(168,146,106,0.1); }
        .inbox-reply-textarea::placeholder { color: #c4b8a8; }
        .inbox-reply-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
        .inbox-reply-error { font-size: 12px; color: #9f1239; }
        .inbox-reply-btn { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; padding: 9px 20px; border-radius: 10px; border: none; background: #1c1917; color: #faf8f4; cursor: pointer; display: flex; align-items: center; gap: 7px; transition: all 0.2s; }
        .inbox-reply-btn:hover:not(:disabled) { background: #a8926a; transform: translateY(-1px); }
        .inbox-reply-btn:disabled { background: #d6cfc7; cursor: not-allowed; }
        .inbox-toggle-reply { font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500; padding: 7px 14px; border-radius: 9px; border: 1.5px solid #e8e0d5; background: transparent; color: #78716c; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; margin-top: 10px; }
        .inbox-toggle-reply:hover { border-color: #a8926a; color: #1c1917; }

        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {/* ── Navbar ── */}
      <header className="nb-wrap">
        <nav className={`nb-inner ${scrolled ? "scrolled" : "top"}`}>
          <div className="nb-row">

            <Link href="/" className="nb-logo">
              <span className="nb-logo-dot" />
              MyBlog
            </Link>

            {/* Desktop links */}
            <div className="nb-links">
              <Link href="/" className="nb-link">Home</Link>
              <Link href="/blog" className="nb-link">Blog</Link>

              {!token ? (
                <>
                  <button onClick={openLoginModal} className="nb-btn-login">Login</button>
                  <button onClick={openRegisterModal} className="nb-btn-register">Register</button>
                </>
              ) : (
                <div className="nb-user-wrap" ref={menuRef}>
                  <button
                    className={`nb-user-btn${isAdmin ? " admin-btn" : ""}`}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <div className={`nb-avatar${isAdmin ? " admin-avatar" : ""}`}>{initials}</div>
                    <span className="nb-username">{username || "User"}</span>
                    <span className={`nb-chevron${userMenuOpen ? " open" : ""}`}>▼</span>
                  </button>

                  {userMenuOpen && (
                    <div className="nb-dropdown">
                      <div className="nb-dropdown-header">
                        <div className="nb-dropdown-name">{username || "User"}</div>
                        <div className={`nb-dropdown-role${isAdmin ? " admin-role" : ""}`}>
                          {isAdmin ? "★ Administrator" : "✦ Member"}
                        </div>
                      </div>

                      {isAdmin ? (
                        <>
                          <Link href="/admin" className="nb-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                            <span className="nb-dropdown-icon"><LayoutDashboard size={14} color="#a8926a" /></span>
                            Dashboard
                          </Link>
                          <button className="nb-dropdown-item" onClick={openInbox}>
                            <span className="nb-dropdown-icon"><Inbox size={14} color="#a8926a" /></span>
                            User Messages
                          </button>
                        </>
                      ) : (
                        <>
                          <Link href="/create" className="nb-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                            <span className="nb-dropdown-icon"><PenLine size={14} color="#a8926a" /></span>
                            Write Blog
                          </Link>
                          <Link href="/my-blogs" className="nb-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                            <span className="nb-dropdown-icon"><BookOpen size={14} color="#a8926a" /></span>
                            My Blogs
                          </Link>
                          <button className="nb-dropdown-item" onClick={openMsgModal}>
                            <span className="nb-dropdown-icon"><MessageCircle size={14} color="#a8926a" /></span>
                            Message Admin
                          </button>
                        </>
                      )}

                      <div className="nb-dropdown-divider" />
                      <button onClick={logout} className="nb-dropdown-item danger">
                        <span className="nb-dropdown-icon"><LogOut size={14} color="#be123c" /></span>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button className="nb-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <>
          <div className="nb-mobile-backdrop" onClick={() => setMobileOpen(false)} />
          <div className="nb-mobile-drawer">

            {/* Drawer head */}
            <div className="nb-drawer-head">
              <Link href="/" className="nb-drawer-logo" onClick={() => setMobileOpen(false)}>
                <span className="nb-logo-dot" />
                MyBlog
              </Link>
              <button className="nb-drawer-close" onClick={() => setMobileOpen(false)}>
                <X size={15} />
              </button>
            </div>

            {/* User info (if logged in) */}
            {token && (
              <div className="nb-drawer-user">
                <div className={`nb-drawer-avatar${isAdmin ? " admin" : ""}`}>{initials}</div>
                <div>
                  <div className="nb-drawer-user-name">{username || "User"}</div>
                  <div className="nb-drawer-user-role">{isAdmin ? "★ Administrator" : "✦ Member"}</div>
                </div>
              </div>
            )}

            {/* Nav links */}
            <div className="nb-drawer-section">
              <div className="nb-drawer-section-label">Navigate</div>
              <Link href="/" className="nb-drawer-item" onClick={() => setMobileOpen(false)}>
                <span className="nb-drawer-icon">🏠</span> Home
              </Link>
              <Link href="/blog" className="nb-drawer-item" onClick={() => setMobileOpen(false)}>
                <span className="nb-drawer-icon">📝</span> Blog
              </Link>
            </div>

            {/* Authenticated user actions */}
            {token && (
              <div className="nb-drawer-section">
                <div className="nb-drawer-section-label">{isAdmin ? "Admin" : "My Account"}</div>
                {isAdmin ? (
                  <>
                    <Link href="/admin" className="nb-drawer-item" onClick={() => setMobileOpen(false)}>
                      <span className="nb-drawer-icon"><LayoutDashboard size={15} color="#a8926a" /></span>
                      Dashboard
                    </Link>
                    <button className="nb-drawer-item" onClick={openInbox}>
                      <span className="nb-drawer-icon"><Inbox size={15} color="#a8926a" /></span>
                      User Messages
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/create" className="nb-drawer-item" onClick={() => setMobileOpen(false)}>
                      <span className="nb-drawer-icon"><PenLine size={15} color="#a8926a" /></span>
                      Write Blog
                    </Link>
                    <Link href="/my-blogs" className="nb-drawer-item" onClick={() => setMobileOpen(false)}>
                      <span className="nb-drawer-icon"><BookOpen size={15} color="#a8926a" /></span>
                      My Blogs
                    </Link>
                    <button className="nb-drawer-item" onClick={openMsgModal}>
                      <span className="nb-drawer-icon"><MessageCircle size={15} color="#a8926a" /></span>
                      Message Admin
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Auth buttons or logout */}
            <div className="nb-drawer-auth">
              {!token ? (
                <>
                  <button className="nb-drawer-btn-login" onClick={openLoginModal}>Login</button>
                  <button className="nb-drawer-btn-register" onClick={openRegisterModal}>Register</button>
                </>
              ) : (
                <button className="nb-drawer-item danger" onClick={logout}>
                  <span className="nb-drawer-icon"><LogOut size={15} color="#be123c" /></span>
                  Logout
                </button>
              )}
            </div>

          </div>
        </>
      )}

      {/* ── User: Message Admin Modal ── */}
      {msgOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setMsgOpen(false) }}>
          <div className="msg-card">
            <span className="msg-drag-handle" />
            <button className="msg-close" onClick={() => setMsgOpen(false)}><X size={15} /></button>
            {msgSent ? (
              <div className="msg-success">
                <CheckCircle size={52} className="msg-success-icon" strokeWidth={1.5} />
                <div className="msg-success-title">Message Sent!</div>
                <div className="msg-success-sub">The admin has received your message<br />and will get back to you soon.</div>
              </div>
            ) : (
              <>
                <div className="msg-icon-wrap"><MessageCircle size={22} color="#faf8f4" strokeWidth={1.8} /></div>
                <p className="msg-eyebrow">Support</p>
                <h2 className="msg-title">Message Admin</h2>
                <p className="msg-subtitle">Have a question or feedback? Send a message and we'll respond as soon as possible.</p>
                {msgError && <div className="msg-error">✕ {msgError}</div>}
                <label className="msg-label">Subject</label>
                <input className="msg-input" placeholder="What's this about?" value={msgSubject} onChange={(e) => setMsgSubject(e.target.value)} />
                <label className="msg-label">Message</label>
                <textarea className="msg-textarea" placeholder="Write your message here…" value={msgText} onChange={(e) => setMsgText(e.target.value)} />
                <div className="msg-footer">
                  <button className="msg-btn-cancel" onClick={() => setMsgOpen(false)}>Cancel</button>
                  <button className="msg-btn-send" onClick={sendMessage} disabled={msgSending}>
                    {msgSending ? <>◌ Sending…</> : <><Send size={14} /> Send Message</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Admin: Inbox Modal ── */}
      {inboxOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setInboxOpen(false) }}>
          <div className="inbox-card">
            <div className="inbox-header">
              <span className="inbox-drag-handle" />
              <div className="inbox-header-top">
                <div>
                  <p className="inbox-eyebrow">✦ Admin Panel</p>
                  <h2 className="inbox-title">User Messages</h2>
                  {!inboxLoading && (
                    <p className="inbox-count">
                      {messages.length} message{messages.length !== 1 ? "s" : ""} · {messages.filter(m => m.replied).length} replied
                    </p>
                  )}
                </div>
                <button className="inbox-close" onClick={() => setInboxOpen(false)}><X size={15} /></button>
              </div>
            </div>

            <div className="inbox-body">
              {inboxLoading ? (
                <div className="inbox-loading">Loading messages…</div>
              ) : messages.length === 0 ? (
                <div className="inbox-empty">
                  <div className="inbox-empty-icon">📭</div>
                  No messages yet.
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`inbox-msg${msg.replied ? " replied" : ""}`}>
                    <div className="inbox-msg-head">
                      <div className="inbox-msg-meta">
                        <span className="inbox-msg-from">
                          {msg.username || msg.email || "Anonymous"}
                          {msg.replied
                            ? <span className="inbox-replied-badge">✓ Replied</span>
                            : <span className="inbox-pending-badge">⏳ Pending</span>
                          }
                        </span>
                        {msg.created_at && (
                          <span className="inbox-msg-time">
                            {new Date(msg.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                      <div className="inbox-msg-subject">{msg.subject}</div>
                      <div className="inbox-msg-preview">{msg.message}</div>
                      {!msg.replied && replyingId !== msg.id && (
                        <button className="inbox-toggle-reply" onClick={() => { setReplyingId(msg.id); setReplyText(""); setReplyError(null) }}>
                          <Send size={12} /> Reply
                        </button>
                      )}
                    </div>

                    {(replyingId === msg.id || msg.reply) && (
                      <div className="inbox-reply-section">
                        {msg.reply && (
                          <div>
                            <div className="inbox-existing-reply-label">Your reply</div>
                            <div className="inbox-existing-reply">{msg.reply}</div>
                          </div>
                        )}
                        {replyingId === msg.id && !msg.replied && (
                          <>
                            <label className="inbox-reply-label">Write reply</label>
                            <textarea
                              className="inbox-reply-textarea"
                              placeholder="Type your reply…"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                            />
                            <div className="inbox-reply-row">
                              <span className="inbox-reply-error">{replyError || ""}</span>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button className="inbox-toggle-reply" onClick={() => setReplyingId(null)}>Cancel</button>
                                <button className="inbox-reply-btn" disabled={replySending} onClick={() => submitReply(msg.id)}>
                                  {replySending ? "Sending…" : <><Send size={13} /> Send Reply</>}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} onSwitch={openRegisterModal} />
      <RegisterModal isOpen={openRegister} onClose={() => setOpenRegister(false)} onSwitch={openLoginModal} />
    </>
  )
}