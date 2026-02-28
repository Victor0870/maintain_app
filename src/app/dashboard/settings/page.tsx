"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Settings, Shield, Heart } from "lucide-react";

export interface RiskItem {
  id: string;
  label: string;
  order?: number;
}

export interface MeasureItem {
  id: string;
  label: string;
  order?: number;
}

export default function SettingsPage() {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [measures, setMeasures] = useState<MeasureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRisk, setNewRisk] = useState("");
  const [newMeasure, setNewMeasure] = useState("");

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, "settings_risks")),
      getDocs(collection(db, "settings_measures")),
    ]).then(([rSnap, mSnap]) => {
      setRisks(rSnap.docs.map((d) => ({ id: d.id, ...d.data() } as RiskItem)));
      setMeasures(mSnap.docs.map((d) => ({ id: d.id, ...d.data() } as MeasureItem)));
      setLoading(false);
    });
  }, []);

  async function addRisk(e: React.FormEvent) {
    e.preventDefault();
    if (!newRisk.trim()) return;
    await addDoc(collection(db, "settings_risks"), { label: newRisk.trim(), order: risks.length });
    setRisks((prev) => [...prev, { id: "", label: newRisk.trim(), order: prev.length }]);
    setNewRisk("");
    const snap = await getDocs(collection(db, "settings_risks"));
    setRisks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RiskItem)));
  }

  async function addMeasure(e: React.FormEvent) {
    e.preventDefault();
    if (!newMeasure.trim()) return;
    await addDoc(collection(db, "settings_measures"), { label: newMeasure.trim(), order: measures.length });
    setMeasures((prev) => [...prev, { id: "", label: newMeasure.trim(), order: prev.length }]);
    setNewMeasure("");
    const snap = await getDocs(collection(db, "settings_measures"));
    setMeasures(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MeasureItem)));
  }

  async function removeRisk(id: string) {
    await deleteDoc(doc(db, "settings_risks", id));
    setRisks((prev) => prev.filter((x) => x.id !== id));
  }

  async function removeMeasure(id: string) {
    await deleteDoc(doc(db, "settings_measures", id));
    setMeasures((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Settings className="w-7 h-7" />
        Cài đặt
      </h1>
      <p className="text-slate-600">
        Danh sách sẵn dùng khi tạo Work Order: chọn rủi ro và biện pháp thay vì gõ lại (có tìm kiếm gợi ý).
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-amber-600" />
            Rủi ro an toàn
          </h2>
          <form onSubmit={addRisk} className="flex gap-2 mb-4">
            <input
              value={newRisk}
              onChange={(e) => setNewRisk(e.target.value)}
              placeholder="Thêm rủi ro..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-lg bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700">
              Thêm
            </button>
          </form>
          {loading ? (
            <p className="text-slate-500 text-sm">Đang tải...</p>
          ) : (
            <ul className="space-y-1">
              {risks.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded px-2 py-1 hover:bg-slate-50">
                  <span className="text-slate-700">{r.label}</span>
                  <button
                    type="button"
                    onClick={() => removeRisk(r.id)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Xóa
                  </button>
                </li>
              ))}
              {risks.length === 0 && <p className="text-slate-500 text-sm">Chưa có mục nào.</p>}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-emerald-600" />
            Biện pháp phòng ngừa
          </h2>
          <form onSubmit={addMeasure} className="flex gap-2 mb-4">
            <input
              value={newMeasure}
              onChange={(e) => setNewMeasure(e.target.value)}
              placeholder="Thêm biện pháp..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-lg bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700">
              Thêm
            </button>
          </form>
          {loading ? (
            <p className="text-slate-500 text-sm">Đang tải...</p>
          ) : (
            <ul className="space-y-1">
              {measures.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded px-2 py-1 hover:bg-slate-50">
                  <span className="text-slate-700">{m.label}</span>
                  <button
                    type="button"
                    onClick={() => removeMeasure(m.id)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Xóa
                  </button>
                </li>
              ))}
              {measures.length === 0 && <p className="text-slate-500 text-sm">Chưa có mục nào.</p>}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
