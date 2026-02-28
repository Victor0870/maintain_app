"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Wrench, Clock, CheckCircle } from "lucide-react";

export type JobStatus = "pending" | "in_progress" | "done";

export interface Job {
  id: string;
  title: string;
  description?: string;
  status: JobStatus;
  equipmentId?: string;
  equipmentName?: string;
  assignee?: string;
  location?: string;
  plannedDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

const statusLabels: Record<JobStatus, string> = {
  pending: "Sắp làm",
  in_progress: "Đang làm",
  done: "Đã làm",
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<JobStatus | "all">("all");

  useEffect(() => {
    const q = query(
      collection(db, "jobs"),
      orderBy("updatedAt", "desc")
    );
    getDocs(q).then((snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Job)));
      setLoading(false);
    });
  }, []);

  const filtered = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);

  const StatusBadge = ({ j }: { j: Job }) => (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
      j.status === "done" ? "bg-green-100 text-green-800" :
      j.status === "in_progress" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
    }`}>
      {j.status === "done" && <CheckCircle className="w-3.5 h-3.5" />}
      {j.status === "in_progress" && <Clock className="w-3.5 h-3.5" />}
      {j.status === "pending" && <Wrench className="w-3.5 h-3.5" />}
      {statusLabels[j.status]}
    </span>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Công việc</h1>
        <Link
          href="/dashboard/jobs/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 active:scale-[0.98] min-h-[44px]"
        >
          <Plus className="w-5 h-5 shrink-0" />
          Thêm việc
        </Link>
      </div>
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "in_progress", "done"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium min-h-[44px] active:scale-[0.98] ${
              filter === s ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            {s === "all" ? "Tất cả" : statusLabels[s]}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="text-slate-500">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500 py-8 text-center rounded-2xl bg-white border border-slate-200">Chưa có công việc nào.</p>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((j) => (
              <Link
                key={j.id}
                href={`/dashboard/jobs/${j.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-card active:scale-[0.99] transition-transform"
              >
                <div className="flex justify-between items-start gap-2">
                  <p className="font-semibold text-slate-800 flex-1 min-w-0">{j.title}</p>
                  <StatusBadge j={j} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600">
                  {j.assignee && <span>{j.assignee}</span>}
                  {j.equipmentName && <span>· {j.equipmentName}</span>}
                  {j.plannedDate && <span>· {j.plannedDate}</span>}
                </div>
              </Link>
            ))}
          </div>
          {/* Desktop: table */}
          <div className="hidden md:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-card">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Công việc</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Trạng thái</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Người làm</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Thiết bị</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Ngày</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((j) => (
                  <tr key={j.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/jobs/${j.id}`} className="font-medium text-primary-600 hover:underline">
                        {j.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge j={j} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{j.assignee || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{j.equipmentName || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{j.plannedDate || "—"}</td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/jobs/${j.id}`} className="text-sm text-primary-600 hover:underline">
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
