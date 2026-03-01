"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Wrench,
  Cpu,
  Package,
  AlertTriangle,
  Calendar,
  ClipboardList,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { Equipment } from "./equipment/page";

interface Job {
  id: string;
  title: string;
  status: string;
  assignee?: string;
  plannedDate?: string;
  equipmentId?: string;
}

const WARN_DAYS = 7;

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDocs(query(collection(db, "jobs"), orderBy("updatedAt", "desc"))).then((snap) =>
        setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Job)))
      ),
      getDocs(collection(db, "equipment")).then((snap) =>
        setEquipment(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Equipment)))
      ),
    ]).finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const limitWarn = new Date();
  limitWarn.setDate(limitWarn.getDate() + WARN_DAYS);
  const limitWarnStr = limitWarn.toISOString().slice(0, 10);

  const upcomingMaintenance = useMemo(() => {
    return equipment.filter((eq) => {
      const next = eq.nextMaintenanceDate;
      if (!next) return false;
      return next >= today && next <= limitWarnStr;
    });
  }, [equipment, today, limitWarnStr]);

  const overdueMaintenance = useMemo(() => {
    return equipment.filter((eq) => {
      const next = eq.nextMaintenanceDate;
      return next && next < today;
    });
  }, [equipment, today]);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const completedThisMonth = useMemo(() => {
    return jobs.filter((j) => j.status === "done" && (j as { updatedAt?: string }).updatedAt?.slice(0, 7) === thisMonth).length;
  }, [jobs, thisMonth]);

  const { start: weekStart, end: weekEnd } = getWeekRange();
  const jobsThisWeek = useMemo(() => {
    return jobs.filter((j) => {
      if (j.status === "done") return false;
      const d = j.plannedDate;
      return d && d >= weekStart && d <= weekEnd;
    });
  }, [jobs, weekStart, weekEnd]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Tổng quan</h1>
        <p className="text-slate-500">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Tổng quan</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/jobs"
          className="rounded-2xl bg-white p-4 sm:p-5 shadow-card border border-slate-200 hover:border-primary-200 hover:shadow-card-hover transition-all flex items-center gap-4 bg-primary-50/50 border-primary-100"
        >
          <div className="rounded-xl bg-primary-500 p-3 text-white">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-primary-600 font-medium">Tổng công việc</p>
            <p className="text-2xl font-bold text-slate-800">{jobs.length}</p>
          </div>
        </Link>
        <Link
          href="/dashboard/alerts"
          className="rounded-2xl bg-white p-4 sm:p-5 shadow-card border border-slate-200 hover:border-amber-200 hover:shadow-card-hover transition-all flex items-center gap-4 bg-amber-50/50 border-amber-100"
        >
          <div className="rounded-xl bg-amber-500 p-3 text-white">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-amber-600 font-medium">Sắp đến hạn bảo trì</p>
            <p className="text-2xl font-bold text-slate-800">{upcomingMaintenance.length + overdueMaintenance.length}</p>
          </div>
        </Link>
        <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-card border border-slate-200 flex items-center gap-4 bg-green-50/50 border-green-100">
          <div className="rounded-xl bg-green-500 p-3 text-white">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-green-600 font-medium">Hoàn thành tháng này</p>
            <p className="text-2xl font-bold text-slate-800">{completedThisMonth}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cảnh báo bảo trì thiết bị */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-card">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
            <AlertTriangle className="text-amber-500 w-5 h-5" />
            Cảnh báo bảo trì thiết bị
          </h3>
          <div className="space-y-3">
            {overdueMaintenance.length === 0 && upcomingMaintenance.length === 0 ? (
              <p className="text-slate-500 text-sm">Không có cảnh báo trong thời gian tới.</p>
            ) : (
              <>
                {[...overdueMaintenance, ...upcomingMaintenance].slice(0, 8).map((eq) => (
                  <div
                    key={eq.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{eq.name}</p>
                      <p className="text-xs text-slate-500">
                        Vị trí: {eq.location || "—"} | Hạn: {eq.nextMaintenanceDate || "—"}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/jobs/new?equipmentId=${eq.id}`}
                      className="shrink-0 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      Tạo Work Order
                    </Link>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Công việc trong tuần */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-card">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
            <Clock className="text-primary-500 w-5 h-5" />
            Công việc trong tuần
          </h3>
          <div className="space-y-3">
            {jobsThisWeek.length === 0 ? (
              <p className="text-slate-500 text-sm">Không có công việc nào trong tuần.</p>
            ) : (
              jobsThisWeek.slice(0, 6).map((task) => (
                <Link
                  key={task.id}
                  href={`/dashboard/jobs/${task.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border-b border-slate-100 last:border-0 hover:bg-slate-50 transition"
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      task.status === "in_progress" ? "bg-primary-500" : "bg-slate-300"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                    <p className="text-xs text-slate-500">
                      {task.plannedDate} — {task.assignee || "—"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      task.status === "in_progress" ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {task.status === "in_progress" ? "Đang làm" : "Sắp làm"}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/jobs"
          className="rounded-2xl bg-white p-4 shadow-card border border-slate-200 hover:border-primary-300 hover:shadow-card-hover active:scale-[0.99] transition-all flex items-center gap-4 min-h-[72px]"
        >
          <div className="rounded-xl bg-primary-100 p-3">
            <Wrench className="w-6 h-6 text-primary-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Công việc</p>
            <p className="text-base font-semibold text-slate-800">Xem & quản lý</p>
          </div>
        </Link>
        <Link
          href="/dashboard/equipment"
          className="rounded-2xl bg-white p-4 shadow-card border border-slate-200 hover:border-emerald-300 hover:shadow-card-hover active:scale-[0.99] transition-all flex items-center gap-4 min-h-[72px]"
        >
          <div className="rounded-xl bg-emerald-100 p-3">
            <Cpu className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Thiết bị</p>
            <p className="text-base font-semibold text-slate-800">Danh sách & lịch</p>
          </div>
        </Link>
        <Link
          href="/dashboard/materials"
          className="rounded-2xl bg-white p-4 shadow-card border border-slate-200 hover:border-amber-300 hover:shadow-card-hover active:scale-[0.99] transition-all flex items-center gap-4 min-h-[72px]"
        >
          <div className="rounded-xl bg-amber-100 p-3">
            <Package className="w-6 h-6 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Vật tư</p>
            <p className="text-base font-semibold text-slate-800">Tồn kho & lịch sử</p>
          </div>
        </Link>
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
