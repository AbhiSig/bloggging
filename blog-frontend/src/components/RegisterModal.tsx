"use client"

import { useState } from "react"
import { PenLine, X } from "lucide-react"
import { api } from "@/lib/api"

type Props = {
  isOpen: boolean
  onClose: () => void
  onSwitch: () => void
}

export default function RegisterModal({ isOpen, onClose, onSwitch }: Props) {

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("USER")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  if (!isOpen) return null

  const handleRegister = async () => {
    try {
      setLoading(true)
      setMessage("")

      await api.post("/auth/register", { username, email, password, role })

      setIsSuccess(true)
      setMessage("Account created successfully!")

      setTimeout(() => onClose(), 1500)

    } catch (error: any) {
      setIsSuccess(false)
      setMessage(error?.response?.data?.detail || "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleRegister()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >

      {/* Glow — desktop only */}
      <div className="hidden sm:block absolute w-[400px] h-[400px] bg-orange-400/20 blur-3xl rounded-full animate-pulse pointer-events-none" />

      {/* Modal card */}
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Orange accent bar ── */}
        <div className="h-1 w-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400" />

        <div className="px-5 sm:px-8 pt-5 sm:pt-7 pb-7 sm:pb-8 overflow-y-auto max-h-[90vh] sm:max-h-none">

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
          <div className="flex justify-center mb-4 sm:mb-5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
              <PenLine size={22} className="sm:hidden" />
              <PenLine size={26} className="hidden sm:block" />
            </div>
          </div>

          {/* ── Heading ── */}
          <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-1">
            Welcome to MyBlog
          </h2>
          <p className="text-center text-gray-500 text-sm sm:text-base mb-5 sm:mb-6">
            Create your account and start sharing ideas.
          </p>

          {/* ── Error / Success message ── */}
          {message && (
            <div className={`mb-4 px-4 py-2.5 rounded-lg border text-sm text-center ${
              isSuccess
                ? "bg-green-50 border-green-100 text-green-600"
                : "bg-red-50 border-red-100 text-red-600"
            }`}>
              {isSuccess ? "✅ " : "✕ "}{message}
            </div>
          )}

          {/* ── Inputs ── */}
          <div className="space-y-3 mb-3">
            <input
              type="text"
              placeholder="Username"
              className="w-full border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none rounded-xl px-4 py-3 text-sm sm:text-base transition bg-gray-50 focus:bg-white"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleEnter}
            />
            <input
              type="email"
              placeholder="Email address"
              className="w-full border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none rounded-xl px-4 py-3 text-sm sm:text-base transition bg-gray-50 focus:bg-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleEnter}
            />
            <div>
              <input
                type="password"
                placeholder="Password"
                className="w-full border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none rounded-xl px-4 py-3 text-sm sm:text-base transition bg-gray-50 focus:bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleEnter}
              />
              <p className="text-xs text-gray-400 mt-1.5 ml-1">
                Must be at least 8 characters
              </p>
            </div>
          </div>

          {/* ── Account type ── */}
          <div className="mb-5 sm:mb-6">
            <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2.5">
              Select account type
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {[
                { value: "USER", label: "User", desc: "Write and publish blogs", icon: "✍️" },
                { value: "ADMIN", label: "Admin", desc: "Moderate blog content", icon: "🛡️" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRole(option.value)}
                  className={`p-3 sm:p-3.5 rounded-xl border-2 text-left transition-all duration-200 ${
                    role === option.value
                      ? "border-orange-400 bg-orange-50 shadow-sm shadow-orange-100"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm">{option.icon}</span>
                    <p className="font-semibold text-sm text-gray-900">{option.label}</p>
                  </div>
                  <p className="text-xs text-gray-500 leading-snug">
                    {option.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Register Button ── */}
          <button
            onClick={handleRegister}
            disabled={loading || isSuccess}
            className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-gray-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Creating account…
              </span>
            ) : "Create Account"}
          </button>

          {/* ── Switch to Login ── */}
          <p className="text-center text-sm text-gray-500 mt-4 sm:mt-5">
            Already have an account?{" "}
            <button
              onClick={onSwitch}
              className="text-orange-500 font-semibold hover:text-orange-600 hover:underline transition-colors"
            >
              Login
            </button>
          </p>

        </div>
      </div>
    </div>
  )
}