"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface WorkOrder {
  id: string;
  jobId: string;
  jobTitle?: string;
  location?: string;
  risks: string[];
  measures: string[];
  approverName?: string;
  approverSignature?: string;
  createdAt: string;
  updatedAt: string;
}

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "workOrders"), orderBy("updatedAt", "desc"));
    getDocs(q).then((snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkOrder)));
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Work Order</h1>
      <p className="text-slate-600">
        Phiếu công việc kèm rủi ro an toàn, biện pháp áp dụng, vị trí làm việc và người phê duyệt. Tạo từ trang chi tiết công việc.
      </p>
      {loading ? (
        <p className="text-slate-500">Đang tải...</p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-slate-700">Công việc</th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-700">Vị trí</th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-700">Người phê duyệt</th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-700"></th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Chưa có work order. Mở một công việc và tạo phiếu.
                  </td>
                </tr>
              ) : (
                orders.map((wo) => (
                  <tr key={wo.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{wo.jobTitle || wo.jobId}</td>
                    <td className="px-4 py-3 text-slate-600">{wo.location || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{wo.approverName || "—"}</td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/jobs/${wo.jobId}`} className="text-sm text-primary-600 hover:underline">
                        Xem công việc
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
