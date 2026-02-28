"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Cpu } from "lucide-react";

export interface Equipment {
  id: string;
  name: string;
  code?: string;
  location?: string;
  nextMaintenanceDate?: string;
  cycleDays?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function EquipmentPage() {
  const [list, setList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "equipment"), orderBy("updatedAt", "desc"));
    getDocs(q).then((snap) => {
      setList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Equipment)));
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Thiết bị</h1>
        <Link
          href="/dashboard/equipment/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 active:scale-[0.98] min-h-[44px]"
        >
          <Plus className="w-5 h-5 shrink-0" />
          Thêm thiết bị
        </Link>
      </div>
      {loading ? (
        <p className="text-slate-500">Đang tải...</p>
      ) : list.length === 0 ? (
        <p className="text-slate-500 py-8 text-center rounded-2xl bg-white border border-slate-200">Chưa có thiết bị. Thêm thiết bị để quản lý lịch bảo trì.</p>
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((eq) => (
            <Link
              key={eq.id}
              href={`/dashboard/equipment/${eq.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card hover:border-primary-300 hover:shadow-card-hover active:scale-[0.99] transition-all min-h-[88px] flex items-center"
            >
              <div className="flex items-start gap-3 w-full">
                <div className="rounded-xl bg-primary-100 p-2.5 shrink-0">
                  <Cpu className="w-5 h-5 text-primary-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 truncate">{eq.name}</p>
                  {eq.code && <p className="text-sm text-slate-500">{eq.code}</p>}
                  {eq.location && <p className="text-sm text-slate-600 mt-0.5 truncate">{eq.location}</p>}
                  {eq.nextMaintenanceDate && (
                    <p className="text-xs text-amber-700 mt-1">
                      Bảo trì tiếp: {eq.nextMaintenanceDate}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
