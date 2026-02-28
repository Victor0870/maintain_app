"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-14 shrink-0 border-b border-slate-200 bg-white flex items-center justify-between px-4">
      <div className="text-slate-600 font-medium">Hệ thống quản lý bảo dưỡng bảo trì</div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">{user?.email}</span>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
