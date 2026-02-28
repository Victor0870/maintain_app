"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  Cpu,
  Package,
  Calendar,
  AlertTriangle,
  Settings,
  FileText,
  Users,
  X,
} from "lucide-react";

const menu = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/dashboard/jobs", label: "Công việc", icon: Wrench },
  { href: "/dashboard/equipment", label: "Thiết bị", icon: Cpu },
  { href: "/dashboard/materials", label: "Vật tư", icon: Package },
  { href: "/dashboard/calendar", label: "Lịch (ngày/tuần)", icon: Calendar },
  { href: "/dashboard/alerts", label: "Cảnh báo", icon: AlertTriangle },
  { href: "/dashboard/work-orders", label: "Work Order", icon: FileText },
  { href: "/dashboard/users", label: "Người dùng", icon: Users },
  { href: "/dashboard/settings", label: "Cài đặt", icon: Settings },
];

export function AppSidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();

  const navContent = (
    <>
      <div className="p-4 border-b border-slate-700/80 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-lg tracking-tight" onClick={onClose}>
          Bảo dưỡng
        </Link>
        {onClose && (
          <button type="button" onClick={onClose} className="md:hidden p-2 -m-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10" aria-label="Đóng menu">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <nav className="p-2 flex-1 overflow-y-auto">
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all min-h-[44px] ${
                isActive ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25" : "text-slate-300 hover:bg-slate-700/80 hover:text-white active:scale-[0.98]"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}
      {/* Sidebar: drawer on mobile, fixed on desktop */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-72 max-w-[85vw] md:w-56
          bg-slate-800 text-white flex flex-col shrink-0
          shadow-2xl md:shadow-none
          transition-transform duration-300 ease-out md:transform-none
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {navContent}
      </aside>
    </>
  );
}
