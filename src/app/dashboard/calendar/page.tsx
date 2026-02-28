"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import type { Job } from "../jobs/page";

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const end = addDays(weekStart, 6);
    const startStr = format(weekStart, "yyyy-MM-dd");
    const endStr = format(end, "yyyy-MM-dd");
    const q = query(
      collection(db, "jobs"),
      where("plannedDate", ">=", startStr),
      where("plannedDate", "<=", endStr)
    );
    getDocs(q).then((snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Job)));
      setLoading(false);
    });
  }, [weekStart]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Lịch công việc (tuần)</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(subWeeks(weekStart, 1))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Tuần trước
          </button>
          <span className="text-slate-700 font-medium">
            {format(weekStart, "d/M", { locale: vi })} – {format(addDays(weekStart, 6), "d/M/yyyy", { locale: vi })}
          </span>
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Tuần sau
          </button>
        </div>
      </div>
      {loading ? (
        <p className="text-slate-500">Đang tải...</p>
      ) : (
        <div className="grid grid-cols-7 gap-2 rounded-xl border border-slate-200 bg-white p-4">
          {days.map((day) => {
            const dayJobs = jobs.filter((j) => j.plannedDate && isSameDay(day, new Date(j.plannedDate)));
            return (
              <div key={day.toISOString()} className="rounded-lg border border-slate-200 bg-slate-50/50 p-2 min-h-[120px]">
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  {format(day, "EEE d/M", { locale: vi })}
                </p>
                <div className="space-y-1">
                  {dayJobs.length === 0 ? (
                    <p className="text-xs text-slate-400">Không có</p>
                  ) : (
                    dayJobs.map((j) => (
                      <Link
                        key={j.id}
                        href={`/dashboard/jobs/${j.id}`}
                        className="block text-xs rounded px-1.5 py-0.5 bg-primary-100 text-primary-800 truncate hover:bg-primary-200"
                      >
                        {j.title}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-sm text-slate-500">
        Công việc hiển thị theo ngày dự kiến (plannedDate). Tạo công việc từ &quot;Thêm việc&quot; hoặc từ lịch bảo trì thiết bị.
      </p>
    </div>
  );
}
