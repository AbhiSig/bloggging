"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Blog {
  id: string;
  title: string;
  content: string;
  image_url?: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  is_ai: boolean;           // ← new
  user?: {
    username: string;
  } | null;                 // ← nullable (AI comments have no user)
}

interface BlogModalProps {
  blog: Blog | null;
  onClose: () => void;
}

export default function BlogModal({ blog, onClose }: BlogModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!blog) return;
    api.get(`/comments/${blog.id}`)
      .then((res) => setComments(res.data))
      .catch(console.error);
  }, [blog]);

  const submitComment = async () => {
    if (!blog || !content.trim()) return;
    try {
      const res = await api.post(`/comments/${blog.id}`, { content });
      setComments((prev) => [res.data, ...prev]);
      setContent("");
    } catch (error) {
      console.error(error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submitComment();
  };

  if (!blog) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:w-[90%] md:w-[700px] max-h-[92vh] sm:max-h-[90vh] overflow-y-auto sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col">

        {/* ── Header ── */}
        <div className="sticky top-0 bg-white z-10 flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 pr-4 leading-snug">
            {blog.title}
          </h2>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all text-sm"
          >
            ✕
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">

          {/* Blog Image */}
          {blog.image_url && (
            <img
              src={blog.image_url}
              alt="blog image"
              className="w-full rounded-xl mb-4 sm:mb-5 object-cover max-h-48 sm:max-h-72"
            />
          )}

          {/* Blog Content */}
          <p className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line mb-6 sm:mb-8">
            {blog.content}
          </p>

          {/* ── Comments Section ── */}
          <div className="border-t border-gray-100 pt-4 sm:pt-5">
            <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
              💬 Comments
              {comments.length > 0 && (
                <span className="ml-2 text-xs sm:text-sm font-normal text-gray-400">
                  ({comments.length})
                </span>
              )}
            </h3>

            {/* Add Comment */}
            <div className="flex gap-2 mb-4 sm:mb-5">
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm sm:text-base outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition placeholder-gray-400"
                placeholder="Write a comment…"
              />
              <button
                onClick={submitComment}
                disabled={!content.trim()}
                className="bg-black text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                Post
              </button>
            </div>

            {/* Comments List */}
            {comments.length === 0 ? (
              <div className="text-center py-8 sm:py-10 text-gray-400">
                <p className="text-2xl mb-2">🗨️</p>
                <p className="text-sm">No comments yet. Be the first!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {comments.map((c) => {
                  const isAI      = c.is_ai;
                  const name      = isAI ? "BlogBot AI" : (c.user?.username ?? "User");
                  const initials  = isAI ? "🤖" : name[0]?.toUpperCase();

                  return (
                    <div
                      key={c.id}
                      className={`py-3 px-3 rounded-xl border mb-2 last:mb-0 transition-all ${
                        isAI
                          ? "bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200"
                          : "border-gray-50 border-b last:border-0 bg-transparent rounded-none"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {/* Avatar */}
                          <div
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs flex items-center justify-center font-semibold flex-shrink-0 ${
                              isAI
                                ? "bg-gradient-to-br from-violet-500 to-indigo-500 text-white"
                                : "bg-gray-800 text-white"
                            }`}
                          >
                            {initials}
                          </div>

                          {/* Name */}
                          <p className="font-semibold text-xs sm:text-sm text-gray-800">
                            {name}
                          </p>

                          {/* AI Badge */}
                          {isAI && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                              </svg>
                              AI Suggestion
                            </span>
                          )}
                        </div>

                        <span className="text-xs text-gray-400">
                          {new Date(c.created_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric",
                          })}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 leading-relaxed pl-8 sm:pl-9">
                        {c.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}