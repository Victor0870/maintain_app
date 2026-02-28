import Link from "next/link";
import { Wrench, Cpu, Package, AlertTriangle, Calendar } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Tổng quan</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/dashboard/jobs"
          className="rounded-2xl bg-white p-4 sm:p-5 shadow-card border border-slate-200 hover:border-primary-300 hover:shadow-card-hover active:scale-[0.99] transition-all flex items-center gap-4 min-h-[88px]"
        >
          <div className="rounded-xl bg-primary-100 p-3">
            <Wrench className="w-6 h-6 text-primary-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Công việc</p>
            <p className="text-base sm:text-lg font-semibold text-slate-800">Xem & quản lý</p>
          </div>
        </Link>
        <Link
          href="/dashboard/equipment"
          className="rounded-2xl bg-white p-4 sm:p-5 shadow-card border border-slate-200 hover:border-primary-300 hover:shadow-card-hover active:scale-[0.99] transition-all flex items-center gap-4 min-h-[88px]"
        >
          <div className="rounded-xl bg-emerald-100 p-3">
            <Cpu className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Thiết bị</p>
            <p className="text-base sm:text-lg font-semibold text-slate-800">Danh sách & lịch</p>
          </div>
        </Link>
        <Link
          href="/dashboard/materials"
          className="rounded-2xl bg-white p-4 sm:p-5 shadow-card border border-slate-200 hover:border-primary-300 hover:shadow-card-hover active:scale-[0.99] transition-all flex items-center gap-4 min-h-[88px]"
        >
          <div className="rounded-xl bg-amber-100 p-3">
            <Package className="w-6 h-6 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Vật tư</p>
            <p className="text-base sm:text-lg font-semibold text-slate-800">Tồn kho & lịch sử</p>
          </div>
        </Link>
        <Link
          href="/dashboard/alerts"
          className="rounded-2xl bg-white p-4 sm:p-5 shadow-card border border-slate-200 hover:border-red-200 hover:shadow-card-hover active:scale-[0.99] transition-all flex items-center gap-4 min-h-[88px]"
        >
          <div className="rounded-xl bg-red-100 p-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Cảnh báo</p>
            <p className="text-base sm:text-lg font-semibold text-slate-800">Sắp đến hạn</p>
          </div>
        </Link>
      </div>
      <div>
        <Link
          href="/dashboard/calendar"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-3 min-h-[44px] text-white hover:bg-primary-700 active:scale-[0.98] font-medium"
        >
          <Calendar className="w-5 h-5 shrink-0" />
          Xem lịch theo ngày / tuần
        </Link>
      </div>
    </div>
  );
}
