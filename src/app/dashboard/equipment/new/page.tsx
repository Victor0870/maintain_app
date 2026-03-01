"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function NewEquipmentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState("");
  const [cycleDays, setCycleDays] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (code.trim()) payload.code = code.trim();
      if (location.trim()) payload.location = location.trim();
      if (nextMaintenanceDate) payload.nextMaintenanceDate = nextMaintenanceDate;
      if (cycleDays) payload.cycleDays = parseInt(cycleDays, 10);
      if (notes.trim()) payload.notes = notes.trim();
      await addDoc(collection(db, "equipment"), payload);
      router.push("/dashboard/equipment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể thêm thiết bị. Kiểm tra đăng nhập và quyền Firestore.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/equipment" className="text-slate-600 hover:text-slate-800">
          ← Thiết bị
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-800">Thêm thiết bị</h1>
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tên thiết bị *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mã</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Vị trí</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ngày bảo trì tiếp theo</label>
            <input
              type="date"
              value={nextMaintenanceDate}
              onChange={(e) => setNextMaintenanceDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Chu kỳ (ngày)</label>
            <input
              type="number"
              min={1}
              value={cycleDays}
              onChange={(e) => setCycleDays(e.target.value)}
              placeholder="VD: 30"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50">
            {saving ? "Đang lưu..." : "Thêm thiết bị"}
          </button>
          <Link href="/dashboard/equipment" className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">
            Hủy
          </Link>
        </div>
      </form>
    </div>
  );
}
