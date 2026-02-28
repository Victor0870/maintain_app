"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, addDays, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";
import type { Equipment } from "../equipment/page";

const WARN_DAYS = 7;

export default function AlertsPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, "equipment")).then((snap) => {
      setEquipment(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Equipment)));
      setLoading(false);
    });
  }, []);

  const today = format(new Date(), "yyyy-MM-dd");
  const limit = format(addDays(new Date(), WARN_DAYS), "yyyy-MM-dd");
  const upcoming = equipment.filter((eq) => {
    const next = eq.nextMaintenanceDate;
    if (!next) return false;
    return next >= today && next <= limit;
  });
  const overdue = equipment.filter((eq) => {
    const next = eq.nextMaintenanceDate;
    if (!next) return false;
    return next < today;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Cảnh báo sắp đến hạn bảo trì</h1>
      {loading ? (
        <p className="text-slate-500">Đang tải...</p>
      ) : (
        <>
          {overdue.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <h2 className="font-semibold text-red-800 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                Quá hạn bảo trì
              </h2>
              <ul className="space-y-1">
                {overdue.map((eq) => (
                  <li key={eq.id}>
                    <Link href={`/dashboard/equipment/${eq.id}`} className="text-red-700 hover:underline">
                      {eq.name}
                      {eq.nextMaintenanceDate && (
                        <span className="text-red-600 ml-2">
                          (Hạn: {format(parseISO(eq.nextMaintenanceDate), "d/M/yyyy", { locale: vi })})
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {upcoming.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h2 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                Sắp đến hạn (trong {WARN_DAYS} ngày)
              </h2>
              <ul className="space-y-1">
                {upcoming.map((eq) => (
                  <li key={eq.id}>
                    <Link href={`/dashboard/equipment/${eq.id}`} className="text-amber-800 hover:underline">
                      {eq.name}
                      {eq.nextMaintenanceDate && (
                        <span className="text-amber-700 ml-2">
                          ({format(parseISO(eq.nextMaintenanceDate), "d/M/yyyy", { locale: vi })})
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {overdue.length === 0 && upcoming.length === 0 && (
            <p className="text-slate-500">Không có cảnh báo nào trong thời gian tới.</p>
          )}
        </>
      )}
    </div>
  );
}
