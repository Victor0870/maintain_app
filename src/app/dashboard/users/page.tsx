"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

type CreateUserResponse = { uid: string; email: string; message: string } | { error: string };

export default function UsersPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const idToken = await user?.getIdToken();
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ email, password, displayName: displayName || undefined }),
      });
      const data: CreateUserResponse = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: (data as { error: string }).error });
        return;
      }
      setMessage({ type: "ok", text: (data as { message: string }).message });
      setEmail("");
      setPassword("");
      setDisplayName("");
    } catch {
      setMessage({ type: "err", text: "Không thể gọi API." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Quản lý người dùng</h1>
      <p className="text-slate-600">
        Tạo tài khoản mới và cấp cho người dùng (email + mật khẩu). Ứng dụng không có chức năng đăng ký — chỉ quản trị tạo tài khoản.
      </p>
      <div className="max-w-md rounded-xl bg-white border border-slate-200 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-4">Tạo tài khoản mới</h2>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="nhanvien@congty.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Tối thiểu 6 ký tự"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên hiển thị</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Nguyễn Văn A"
            />
          </div>
          {message && (
            <p className={`text-sm rounded-lg px-3 py-2 ${message.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary-600 px-4 py-2 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? "Đang tạo..." : "Tạo tài khoản"}
          </button>
        </form>
      </div>
      <p className="text-xs text-slate-500">
        Cấu hình Firebase Admin (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY) trong Vercel/env để API tạo user hoạt động. Nếu chưa cấu hình, bạn có thể tạo user trực tiếp trong Firebase Console (Authentication → Add user).
      </p>
    </div>
  );
}
