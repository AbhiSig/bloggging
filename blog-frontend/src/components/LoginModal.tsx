"use client"

import { useState } from "react"
import { PenLine, X } from "lucide-react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"

type Props = {
  isOpen: boolean
  onClose: () => void
  onSwitch: () => void
}

export default function LoginModal({ isOpen, onClose, onSwitch }: Props) {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  if (!isOpen) return null

  const handleLogin = async () => {
    try {
      setLoading(true)
      setMessage("")

      const res = await api.post("/auth/login", { email, password })

      const token = res.data.access_token
      const role = res.data.role
      const username = res.data.username ?? res.data.name ?? res.data.user?.username ?? "User"

      localStorage.setItem("token", token)
      localStorage.setItem("role", role)
      localStorage.setItem("username", username)

      setIsSuccess(true)
      setMessage("Login successful!")

      setTimeout(() => {
        onClose()
        router.push(role === "ADMIN" ? "/admin" : "/")
      }, 800)

    } catch (error: any) {
      setIsSuccess(false)
      setMessage(error?.response?.data?.detail || "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleLogin()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >

      {/* Glow blob — hidden on small screens */}
      <div className="hidden sm:block absolute w-[400px] h-[400px] bg-orange-400/20 blur-3xl rounded-full animate-pulse pointer-events-none" />

      {/* Modal card */}
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Orange top accent bar ── */}
        <div className="h-1 w-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400" />

        <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-7 sm:pb-8">

          {/* ── Close button ── */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all"
          >
            <X size={15} />
          </button>

          {/* ── Mobile drag handle ── */}
          <div className="flex justify-center mb-4 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          {/* ── Icon ── */}
          <div className="flex justify-center mb-5 sm:mb-6">
            <div className="w-13 h-13 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
              <PenLine size={24} className="sm:hidden" />
              <PenLine size={28} className="hidden sm:block" />
            </div>
          </div>

          {/* ── Heading ── */}
          <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-1">
            Welcome Back
          </h2>
          <p className="text-center text-gray-500 text-sm sm:text-base mb-5 sm:mb-6">
            Login to continue writing blogs.
          </p>

          {/* ── Error message ── */}
          {message && !isSuccess && (
            <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm text-center">
              {message}
            </div>
          )}

          {/* ── Success message ── */}
          {message && isSuccess && (
            <div className="mb-4 px-4 py-2.5 rounded-lg bg-green-50 border border-green-100 text-green-600 text-sm text-center">
              ✅ {message}
            </div>
          )}

          {/* ── Inputs ── */}
          <div className="space-y-3 mb-4">
            <input
              type="email"
              placeholder="Email address"
              className="w-full border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none rounded-xl px-4 py-3 text-sm sm:text-base transition bg-gray-50 focus:bg-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleEnter}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none rounded-xl px-4 py-3 text-sm sm:text-base transition bg-gray-50 focus:bg-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleEnter}
            />
          </div>

          {/* ── Login Button ── */}
          <button
            onClick={handleLogin}
            disabled={loading || isSuccess}
            className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-gray-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Logging in…
              </span>
            ) : "Login"}
          </button>

          {/* ── Switch to Register ── */}
          <p className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{" "}
            <button
              onClick={onSwitch}
              className="text-orange-500 font-semibold hover:text-orange-600 hover:underline transition-colors"
            >
              Register
            </button>
          </p>

        </div>
      </div>
    </div>
  )
}