"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Material } from "../page";

type Transaction = {
  id: string;
  type: "in" | "out";
  quantity: number;
  note?: string;
  jobId?: string;
  jobTitle?: string;
  materialName?: string;
  unit?: string;
  createdAt: string;
};

type JobOption = { id: string; title: string };

export default function MaterialDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [material, setMaterial] = useState<Material | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [inQty, setInQty] = useState("");
  const [inNote, setInNote] = useState("");
  const [outQty, setOutQty] = useState("");
  const [outNote, setOutNote] = useState("");
  const [outJobId, setOutJobId] = useState("");
  const [saving, setSaving] = useState(false);

  function loadMaterial() {
    getDoc(doc(db, "materials", id)).then((snap) => {
      if (!snap.exists()) return;
      setMaterial({ id: snap.id, ...snap.data() } as Material);
      setLoading(false);
    });
  }

  useEffect(() => {
    loadMaterial();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "material_transactions"),
      where("materialId", "==", id),
      orderBy("createdAt", "desc")
    );
    getDocs(q).then((snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction)));
    });
  }, [id]);

  useEffect(() => {
    getDocs(collection(db, "jobs")).then((snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, title: (d.data() as { title: string }).title })));
    });
  }, []);

  async function handleIn(e: React.FormEvent) {
    e.preventDefault();
    if (!material) return;
    const qty = parseInt(inQty, 10);
    if (qty < 1) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "material_transactions"), {
        type: "in",
        materialId: id,
        materialName: material.name,
        unit: material.unit,
        quantity: qty,
        note: inNote || undefined,
        createdAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, "materials", id), {
        quantity: material.quantity + qty,
        updatedAt: new Date().toISOString(),
      });
      setMaterial((prev) => (prev ? { ...prev, quantity: prev.quantity + qty } : null));
      setTransactions((prev) => [
        { id: "", type: "in", quantity: qty, note: inNote, materialName: material.name, unit: material.unit, createdAt: new Date().toISOString() },
        ...prev,
      ]);
      setInQty("");
      setInNote("");
    } finally {
      setSaving(false);
    }
  }

  async function handleOut(e: React.FormEvent) {
    e.preventDefault();
    if (!material) return;
    const qty = parseInt(outQty, 10);
    if (qty < 1 || qty > material.quantity) return;
    const job = jobs.find((j) => j.id === outJobId);
    setSaving(true);
    try {
      await addDoc(collection(db, "material_transactions"), {
        type: "out",
        materialId: id,
        materialName: material.name,
        unit: material.unit,
        quantity: qty,
        note: outJobId ? undefined : (outNote || "Xuất khác"),
        jobId: outJobId || undefined,
        jobTitle: job?.title,
        createdAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, "materials", id), {
        quantity: material.quantity - qty,
        updatedAt: new Date().toISOString(),
      });
      setMaterial((prev) => (prev ? { ...prev, quantity: prev.quantity - qty } : null));
      setTransactions((prev) => [
        {
          id: "",
          type: "out",
          quantity: qty,
          note: outJobId ? undefined : outNote,
          jobId: outJobId,
          jobTitle: job?.title,
          materialName: material.name,
          unit: material.unit,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setOutQty("");
      setOutNote("");
      setOutJobId("");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !material) return <p className="text-slate-500">Đang tải...</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/dashboard/materials" className="text-slate-600 hover:text-slate-800">← Vật tư</Link>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-bold text-slate-800">{material.name}</h1>
        {material.code && <p className="text-slate-500">{material.code}</p>}
        <p className="mt-2 text-slate-700">Đơn vị: {material.unit} · Tồn kho: <strong>{material.quantity}</strong></p>
        {material.minQuantity != null && (
          <p className={`text-sm ${material.quantity <= material.minQuantity ? "text-red-600" : "text-slate-500"}`}>
            Tồn tối thiểu: {material.minQuantity}
          </p>
        )}

        <div className="mt-6 pt-4 border-t border-slate-200 grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg bg-green-50 p-4">
            <h3 className="font-medium text-green-800 mb-2">Nhập kho (mua/thêm)</h3>
            <form onSubmit={handleIn} className="space-y-2">
              <input type="number" min={1} value={inQty} onChange={(e) => setInQty(e.target.value)} placeholder="Số lượng" required className="w-full rounded border border-green-200 px-2 py-1.5 text-sm" />
              <input value={inNote} onChange={(e) => setInNote(e.target.value)} placeholder="Ghi chú (vd: nhập mua)" className="w-full rounded border border-green-200 px-2 py-1.5 text-sm" />
              <button type="submit" disabled={saving} className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50">Nhập</button>
            </form>
          </div>
          <div className="rounded-lg bg-amber-50 p-4">
            <h3 className="font-medium text-amber-800 mb-2">Xuất kho (bán / dùng cho công việc)</h3>
            <form onSubmit={handleOut} className="space-y-2">
              <input type="number" min={1} max={material.quantity} value={outQty} onChange={(e) => setOutQty(e.target.value)} placeholder="Số lượng" required className="w-full rounded border border-amber-200 px-2 py-1.5 text-sm" />
              <select value={outJobId} onChange={(e) => setOutJobId(e.target.value)} className="w-full rounded border border-amber-200 px-2 py-1.5 text-sm">
                <option value="">— Xuất khác (ghi chú bên dưới) —</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
              {!outJobId && <input value={outNote} onChange={(e) => setOutNote(e.target.value)} placeholder="Ghi chú xuất" className="w-full rounded border border-amber-200 px-2 py-1.5 text-sm" />}
              <button type="submit" disabled={saving || parseInt(outQty, 10) > material.quantity} className="rounded bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700 disabled:opacity-50">Xuất</button>
            </form>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-800 mb-3">Lịch sử nhập / xuất (mua bán & sử dụng)</h2>
        {transactions.length === 0 ? (
          <p className="text-slate-500 text-sm">Chưa có giao dịch.</p>
        ) : (
          <ul className="space-y-2">
            {transactions.map((t) => (
              <li key={t.id || t.createdAt} className="flex justify-between text-sm">
                <span>
                  {t.type === "in" ? "Nhập" : "Xuất"} {t.quantity} {material.unit}
                  {t.jobTitle && ` · Công việc: ${t.jobTitle}`}
                  {t.note && ` · ${t.note}`}
                </span>
                <span className="text-slate-500">{format(new Date(t.createdAt), "d/M/yyyy HH:mm", { locale: vi })}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
