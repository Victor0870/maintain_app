"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";
import type { JobStatus } from "../page";

type RiskItem = { id: string; label: string };
type MeasureItem = { id: string; label: string };

export default function NewJobPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [equipmentList, setEquipmentList] = useState<{ id: string; name: string }[]>([]);
  const [risksList, setRisksList] = useState<RiskItem[]>([]);
  const [measuresList, setMeasuresList] = useState<MeasureItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<JobStatus>("pending");
  const [equipmentId, setEquipmentId] = useState("");
  const [assignee, setAssignee] = useState("");
  const [location, setLocation] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [woRisks, setWoRisks] = useState<string[]>([]);
  const [woMeasures, setWoMeasures] = useState<string[]>([]);
  const [woApproverName, setWoApproverName] = useState("");
  const [woApproverSignature, setWoApproverSignature] = useState("");
  const [riskSearch, setRiskSearch] = useState("");
  const [measureSearch, setMeasureSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getDocs(collection(db, "equipment")).then((snap) => {
      setEquipmentList(snap.docs.map((d) => ({ id: d.id, name: (d.data() as { name: string }).name })));
    });
    getDocs(collection(db, "settings_risks")).then((s) =>
      setRisksList(s.docs.map((d) => ({ id: d.id, label: (d.data() as { label: string }).label })))
    );
    getDocs(collection(db, "settings_measures")).then((s) =>
      setMeasuresList(s.docs.map((d) => ({ id: d.id, label: (d.data() as { label: string }).label })))
    );
  }, []);

  const filteredRisks = useMemo(() => {
    if (!riskSearch.trim()) return risksList;
    const q = riskSearch.toLowerCase();
    return risksList.filter((r) => r.label.toLowerCase().includes(q));
  }, [risksList, riskSearch]);

  const filteredMeasures = useMemo(() => {
    if (!measureSearch.trim()) return measuresList;
    const q = measureSearch.toLowerCase();
    return measuresList.filter((m) => m.label.toLowerCase().includes(q));
  }, [measuresList, measureSearch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const eq = equipmentList.find((x) => x.id === equipmentId);
    setSaving(true);
    try {
      const jobRef = await addDoc(collection(db, "jobs"), {
        title,
        description: description || undefined,
        status,
        equipmentId: equipmentId || undefined,
        equipmentName: eq?.name,
        assignee: assignee || undefined,
        location: location || undefined,
        plannedDate: plannedDate || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.uid ?? "",
      });
      if (woRisks.length > 0 || woMeasures.length > 0 || woApproverName || woApproverSignature || location) {
        await addDoc(collection(db, "workOrders"), {
          jobId: jobRef.id,
          jobTitle: title,
          location: location || undefined,
          risks: woRisks,
          measures: woMeasures,
          approverName: woApproverName || undefined,
          approverSignature: woApproverSignature || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      router.push("/dashboard/jobs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo công việc. Kiểm tra đăng nhập và quyền Firestore.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/dashboard/jobs" className="text-slate-600 hover:text-slate-800">← Công việc</Link>
      <h1 className="text-2xl font-bold text-slate-800">Thêm việc</h1>
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tên công việc *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as JobStatus)} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="pending">Sắp làm</option>
            <option value="in_progress">Đang làm</option>
            <option value="done">Đã làm</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Thiết bị</label>
          <select value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="">— Chọn —</option>
            {equipmentList.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Người làm</label>
          <input value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Họ tên" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Vị trí làm việc</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ngày dự kiến</label>
          <input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>

        <div className="border-t border-slate-200 pt-4 mt-4">
          <h3 className="font-medium text-slate-800 mb-3">Work Order (tùy chọn)</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rủi ro an toàn (chọn từ danh sách)</label>
              <input value={riskSearch} onChange={(e) => setRiskSearch(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 mb-1" placeholder="Tìm kiếm..." />
              <div className="flex flex-wrap gap-1 mb-2">
                {woRisks.map((r) => (
                  <span key={r} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-sm text-amber-800">
                    {r} <button type="button" onClick={() => setWoRisks((prev) => prev.filter((x) => x !== r))} className="text-amber-600 hover:text-amber-900">×</button>
                  </span>
                ))}
              </div>
              <ul className="border border-slate-200 rounded-lg max-h-32 overflow-y-auto">
                {filteredRisks.slice(0, 8).map((r) => (
                  <li key={r.id}>
                    <button type="button" onClick={() => !woRisks.includes(r.label) && setWoRisks((prev) => [...prev, r.label])} className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100">
                      {r.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Biện pháp phòng ngừa (chọn từ danh sách)</label>
              <input value={measureSearch} onChange={(e) => setMeasureSearch(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 mb-1" placeholder="Tìm kiếm..." />
              <div className="flex flex-wrap gap-1 mb-2">
                {woMeasures.map((m) => (
                  <span key={m} className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-sm text-emerald-800">
                    {m} <button type="button" onClick={() => setWoMeasures((prev) => prev.filter((x) => x !== m))} className="text-emerald-600 hover:text-emerald-900">×</button>
                  </span>
                ))}
              </div>
              <ul className="border border-slate-200 rounded-lg max-h-32 overflow-y-auto">
                {filteredMeasures.slice(0, 8).map((m) => (
                  <li key={m.id}>
                    <button type="button" onClick={() => !woMeasures.includes(m.label) && setWoMeasures((prev) => [...prev, m.label])} className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100">
                      {m.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Người phê duyệt</label>
              <input value={woApproverName} onChange={(e) => setWoApproverName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Họ tên người phê duyệt" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ô chữ ký / Ghi chú phê duyệt</label>
              <input value={woApproverSignature} onChange={(e) => setWoApproverSignature(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Đã ký, ngày ký hoặc ghi chú" />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50">
            {saving ? "Đang lưu..." : "Tạo công việc"}
          </button>
          <Link href="/dashboard/jobs" className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">Hủy</Link>
        </div>
      </form>
    </div>
  );
}
