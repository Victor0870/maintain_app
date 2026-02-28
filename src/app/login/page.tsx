"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đăng nhập thất bại.";
      setError(message.includes("auth/") ? "Email hoặc mật khẩu không đúng." : message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-slate-100 to-primary-50/40 p-4 safe-area-padding">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-card-hover p-6 sm:p-8">
        <h1 className="text-xl sm:text-2xl font-bold text-center text-slate-800 mb-2">
          Quản lý Bảo dưỡng Bảo trì
        </h1>
        <p className="text-center text-slate-500 text-sm mb-6">
          Đăng nhập bằng tài khoản do quản trị cấp
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 min-h-[48px] focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-base"
              placeholder="email@congty.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 min-h-[48px] focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-base"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-primary-600 py-3.5 min-h-[48px] font-medium text-white hover:bg-primary-700 active:scale-[0.99] disabled:opacity-50"
          >
            {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">
          Không có tài khoản? Liên hệ quản trị viên để được cấp tài khoản.
        </p>
      </div>
    </div>
  );
}
