"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus } from "lucide-react";

export interface Material {
  id: string;
  name: string;
  code?: string;
  unit: string;
  quantity: number;
  minQuantity?: number;
  createdAt: string;
  updatedAt: string;
}

export default function MaterialsPage() {
  const [list, setList] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "materials"), orderBy("updatedAt", "desc"));
    getDocs(q).then((snap) => {
      setList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Material)));
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Vật tư</h1>
        <Link
          href="/dashboard/materials/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          Thêm vật tư
        </Link>
      </div>
      {loading ? (
        <p className="text-slate-500">Đang tải...</p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-slate-700">Tên</th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-700">Mã</th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-700">Đơn vị</th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-700">Tồn kho</th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-700"></th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Chưa có vật tư.
                  </td>
                </tr>
              ) : (
                list.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                    <td className="px-4 py-3 text-slate-600">{m.code || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{m.unit}</td>
                    <td className="px-4 py-3">
                      <span className={m.minQuantity != null && m.quantity <= m.minQuantity ? "text-red-600 font-medium" : "text-slate-700"}>
                        {m.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/materials/${m.id}`} className="text-sm text-primary-600 hover:underline">
                        Chi tiết & lịch sử
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
