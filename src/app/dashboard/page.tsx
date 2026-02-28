import Link from "next/link";
import { Wrench, Cpu, Package, AlertTriangle, Calendar } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Tổng quan</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/dashboard/jobs"
          className="rounded-xl bg-white p-5 shadow border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="rounded-lg bg-primary-100 p-3">
            <Wrench className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Công việc</p>
            <p className="text-lg font-semibold text-slate-800">Xem & quản lý</p>
          </div>
        </Link>
        <Link
          href="/dashboard/equipment"
          className="rounded-xl bg-white p-5 shadow border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="rounded-lg bg-emerald-100 p-3">
            <Cpu className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Thiết bị</p>
            <p className="text-lg font-semibold text-slate-800">Danh sách & lịch</p>
          </div>
        </Link>
        <Link
          href="/dashboard/materials"
          className="rounded-xl bg-white p-5 shadow border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="rounded-lg bg-amber-100 p-3">
            <Package className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Vật tư</p>
            <p className="text-lg font-semibold text-slate-800">Tồn kho & lịch sử</p>
          </div>
        </Link>
        <Link
          href="/dashboard/alerts"
          className="rounded-xl bg-white p-5 shadow border border-slate-200 hover:border-red-200 hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="rounded-lg bg-red-100 p-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Cảnh báo</p>
            <p className="text-lg font-semibold text-slate-800">Sắp đến hạn</p>
          </div>
        </Link>
      </div>
      <div>
        <Link
          href="/dashboard/calendar"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
        >
          <Calendar className="w-5 h-5" />
          Xem lịch theo ngày / tuần
        </Link>
      </div>
    </div>
  );
}
