"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function NewMaterialPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [unit, setUnit] = useState("cái");
  const [quantity, setQuantity] = useState("0");
  const [minQuantity, setMinQuantity] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, "materials"), {
        name,
        code: code || undefined,
        unit,
        quantity: parseInt(quantity, 10) || 0,
        minQuantity: minQuantity ? parseInt(minQuantity, 10) : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      router.push("/dashboard/materials");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/dashboard/materials" className="text-slate-600 hover:text-slate-800">← Vật tư</Link>
      <h1 className="text-2xl font-bold text-slate-800">Thêm vật tư</h1>
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tên vật tư *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mã</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị *</label>
          <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="cái">cái</option>
            <option value="kg">kg</option>
            <option value="m">m</option>
            <option value="lít">lít</option>
            <option value="hộp">hộp</option>
            <option value="bao">bao</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng tồn ban đầu</label>
          <input type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tồn tối thiểu (cảnh báo)</label>
          <input type="number" min={0} value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Để trống nếu không dùng" />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50">
            {saving ? "Đang lưu..." : "Thêm vật tư"}
          </button>
          <Link href="/dashboard/materials" className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">Hủy</Link>
        </div>
      </form>
    </div>
  );
}
