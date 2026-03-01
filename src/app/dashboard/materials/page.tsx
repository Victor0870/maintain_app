"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, FileSpreadsheet, Package, ShoppingCart, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";

interface MaterialTransaction {
  id: string;
  type: string;
  materialName: string;
  quantity: number;
  unit: string;
  jobId?: string;
  jobTitle?: string;
  createdAt: string;
}

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
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "materials"), orderBy("updatedAt", "desc"));
    const txQ = query(
      collection(db, "material_transactions"),
      orderBy("createdAt", "desc"),
      limit(30)
    );
    Promise.all([
      getDocs(q).then((snap) => setList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Material)))),
      getDocs(txQ).then((snap) =>
        setTransactions(
          snap.docs.map((d) => {
            const data = d.data() as MaterialTransaction & { jobTitle?: string };
            return { id: d.id, ...data };
          })
        )
      ),
    ]).finally(() => setLoading(false));
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
          <Link
            href="/dashboard/materials#cards"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-[0.98] min-h-[44px]"
          >
            <ShoppingCart className="w-5 h-5 shrink-0" />
            Nhập mua
          </Link>
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
            Thêm mã vật tư
          </Link>
        </div>
      </div>
      {loading ? (
        <p className="text-slate-500">Đang tải...</p>
      ) : list.length === 0 ? (
        <p className="text-slate-500 py-8 text-center rounded-2xl bg-white border border-slate-200">Chưa có vật tư.</p>
      ) : (
        <>
          {/* Card grid (mobile + desktop) */}
          <div id="cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {list.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card hover:shadow-card-hover transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <Package className="w-6 h-6 text-primary-500 shrink-0" />
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      m.minQuantity != null && m.quantity <= m.minQuantity ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    }`}
                  >
                    {m.minQuantity != null && m.quantity <= m.minQuantity ? "Cần nhập" : "Sẵn sàng"}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 truncate">{m.name}</h4>
                <p className="text-2xl font-black mt-2 text-slate-800">
                  {m.quantity} <span className="text-sm font-normal text-slate-500">{m.unit}</span>
                </p>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 text-[10px] text-slate-500 uppercase font-bold tracking-tight">
                  <span>Tồn tối thiểu: {m.minQuantity ?? "—"}</span>
                  <Link
                    href={`/dashboard/materials/${m.id}`}
                    className="text-primary-600 flex items-center gap-1 hover:underline"
                  >
                    Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Lịch sử xuất nhập & Sử dụng */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-card">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Lịch sử xuất nhập & Sử dụng</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[500px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-bold text-slate-600">Thời gian</th>
                    <th className="p-4 font-bold text-slate-600">Vật tư</th>
                    <th className="p-4 font-bold text-slate-600">Loại GD</th>
                    <th className="p-4 font-bold text-slate-600">Số lượng</th>
                    <th className="p-4 font-bold text-slate-600">Liên kết</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        Chưa có giao dịch nào.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4 text-slate-600">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleString("vi-VN") : "—"}
                        </td>
                        <td className="p-4 font-medium text-slate-800">{tx.materialName || "—"}</td>
                        <td className="p-4">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              tx.type === "in" ? "bg-green-100 text-green-700" : "bg-primary-100 text-primary-700"
                            }`}
                          >
                            {tx.type === "in" ? "Nhập kho" : "Xuất sử dụng"}
                          </span>
                        </td>
                        <td className={`p-4 font-semibold ${tx.type === "in" ? "text-green-600" : "text-red-600"}`}>
                          {tx.type === "in" ? "+" : "-"}
                          {tx.quantity} {tx.unit}
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-600">
                          {tx.jobId ? (
                            <Link href={`/dashboard/jobs/${tx.jobId}`} className="text-primary-600 hover:underline">
                              {tx.jobTitle || tx.jobId}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
