"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

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

  function exportToExcel() {
    const headers = ["STT", "Mã", "Tên vật tư", "Đơn vị", "Tồn kho (sổ)", "Tồn tối thiểu", "Thực tế kiểm kê", "Ghi chú"];
    const rows = list.map((m, i) => [
      i + 1,
      m.code || "",
      m.name,
      m.unit,
      m.quantity,
      m.minQuantity ?? "",
      "", // Thực tế kiểm kê - để trống cho người dùng điền
      "", // Ghi chú
    ]);
    const data = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const colWidths = [{ wch: 5 }, { wch: 12 }, { wch: 25 }, { wch: 8 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 20 }];
    ws["!cols"] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sách vật tư");
    const fileName = `danh-sach-vat-tu-kiem-ke-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Vật tư</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportToExcel}
            disabled={loading || list.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-600 px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none min-h-[44px]"
          >
            <FileSpreadsheet className="w-5 h-5 shrink-0" />
            Xuất Excel (kiểm kê)
          </button>
          <Link
            href="/dashboard/materials/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 active:scale-[0.98] min-h-[44px]"
          >
            <Plus className="w-5 h-5 shrink-0" />
            Thêm vật tư
          </Link>
        </div>
      </div>
      {loading ? (
        <p className="text-slate-500">Đang tải...</p>
      ) : list.length === 0 ? (
        <p className="text-slate-500 py-8 text-center rounded-2xl bg-white border border-slate-200">Chưa có vật tư.</p>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {list.map((m) => (
              <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card active:scale-[0.99] transition-transform">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">{m.name}</p>
                    {m.code && <p className="text-sm text-slate-500">{m.code}</p>}
                  </div>
                  <span className={`text-lg font-bold tabular-nums ${m.minQuantity != null && m.quantity <= m.minQuantity ? "text-red-600" : "text-primary-600"}`}>
                    {m.quantity} {m.unit}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/dashboard/materials/${m.id}`} className="flex-1 min-w-[120px] inline-flex justify-center items-center rounded-xl py-2.5 text-sm font-medium bg-primary-100 text-primary-700 hover:bg-primary-200">
                    Chi tiết
                  </Link>
                  <Link href={`/dashboard/materials/${m.id}#nhap`} className="flex-1 min-w-[120px] inline-flex justify-center items-center rounded-xl py-2.5 text-sm font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                    Mua thêm
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop: table */}
          <div className="hidden md:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-card">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Tên</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Mã</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Đơn vị</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Tồn kho</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((m) => (
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
                      <span className="flex flex-wrap items-center gap-2">
                        <Link href={`/dashboard/materials/${m.id}`} className="text-sm text-primary-600 hover:underline">
                          Chi tiết & lịch sử
                        </Link>
                        <span className="text-slate-300">|</span>
                        <Link href={`/dashboard/materials/${m.id}#nhap`} className="text-sm text-green-600 hover:underline font-medium">
                          Mua thêm
                        </Link>
                      </span>
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
