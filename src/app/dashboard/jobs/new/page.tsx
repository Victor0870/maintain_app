"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";
import type { JobStatus } from "../page";

export default function NewJobPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [equipmentList, setEquipmentList] = useState<{ id: string; name: string }[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<JobStatus>("pending");
  const [equipmentId, setEquipmentId] = useState("");
  const [assignee, setAssignee] = useState("");
  const [location, setLocation] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDocs(collection(db, "equipment")).then((snap) => {
      setEquipmentList(snap.docs.map((d) => ({ id: d.id, name: (d.data() as { name: string }).name })));
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const eq = equipmentList.find((x) => x.id === equipmentId);
    setSaving(true);
    try {
      await addDoc(collection(db, "jobs"), {
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
        createdBy: user.uid,
      });
      router.push("/dashboard/jobs");
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
