"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-14 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur-sm flex items-center justify-between gap-3 px-4 sm:px-5 safe-area-padding">
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden p-2.5 -ml-1.5 rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Mở menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        <span className="text-slate-600 font-medium truncate hidden sm:block text-sm">Hệ thống bảo dưỡng bảo trì</span>
        <span className="text-slate-600 font-medium truncate sm:hidden text-sm">Bảo dưỡng</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-xs sm:text-sm text-slate-500 truncate max-w-[120px] sm:max-w-none" title={user?.email ?? ""}>
          {user?.email}
        </span>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 active:scale-[0.98] min-h-[44px]"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
