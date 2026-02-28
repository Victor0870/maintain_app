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

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-slate-800 text-white flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-700">
        <Link href="/dashboard" className="font-semibold text-lg">
          Bảo dưỡng
        </Link>
      </div>
      <nav className="p-2 flex-1 overflow-y-auto">
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive ? "bg-primary-600 text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
