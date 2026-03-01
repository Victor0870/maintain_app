"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Equipment } from "../page";
import type { Job } from "../../jobs/page";

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [pastJobs, setPastJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingFull, setEditingFull] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    location: "",
    nextMaintenanceDate: "",
    cycleDays: "",
    notes: "",
  });

  useEffect(() => {
    getDoc(doc(db, "equipment", id)).then((snap) => {
      if (!snap.exists()) {
        router.replace("/dashboard/equipment");
        return;
      }
      const data = { id: snap.id, ...snap.data() } as Equipment;
      setEquipment(data);
      setForm({
        name: data.name,
        code: data.code || "",
        location: data.location || "",
        nextMaintenanceDate: data.nextMaintenanceDate || "",
        cycleDays: data.cycleDays?.toString() || "",
        notes: data.notes || "",
      });
      setLoading(false);
    });
  }, [id, router]);

  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "jobs"),
      where("equipmentId", "==", id),
      orderBy("updatedAt", "desc")
    );
    getDocs(q).then((snap) => {
      setPastJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Job)));
    });
  }, [id]);

  async function saveSchedule() {
    if (!equipment) return;
    const payload: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (form.nextMaintenanceDate) payload.nextMaintenanceDate = form.nextMaintenanceDate;
    else payload.nextMaintenanceDate = null;
    if (form.cycleDays) payload.cycleDays = parseInt(form.cycleDays, 10);
    else payload.cycleDays = null;
    await updateDoc(doc(db, "equipment", id), payload);
    setEquipment((prev) => prev ? { ...prev, nextMaintenanceDate: form.nextMaintenanceDate, cycleDays: form.cycleDays ? parseInt(form.cycleDays, 10) : undefined } : null);
    setEditing(false);
  }

  async function saveFull() {
    if (!equipment) return;
    await updateDoc(doc(db, "equipment", id), {
      name: form.name,
      code: form.code.trim() || null,
      location: form.location.trim() || null,
      nextMaintenanceDate: form.nextMaintenanceDate || null,
      cycleDays: form.cycleDays ? parseInt(form.cycleDays, 10) : null,
      notes: form.notes.trim() || null,
      updatedAt: new Date().toISOString(),
    });
    setEquipment((prev) => prev ? { ...prev, ...form, cycleDays: form.cycleDays ? parseInt(form.cycleDays, 10) : undefined } : null);
    setEditingFull(false);
  }

  async function handleDelete() {
    if (!confirm("Bạn có chắc muốn xóa thiết bị này? Công việc liên quan sẽ không bị xóa.")) return;
    await deleteDoc(doc(db, "equipment", id));
    router.push("/dashboard/equipment");
  }

  if (loading || !equipment) return <p className="text-slate-500">Đang tải...</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/equipment" className="text-slate-600 hover:text-slate-800">← Thiết bị</Link>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            {!editingFull ? (
              <>
                <h1 className="text-xl font-bold text-slate-800">{equipment.name}</h1>
                {equipment.code && <p className="text-slate-500">{equipment.code}</p>}
                {equipment.location && <p className="text-slate-600 mt-1">Vị trí: {equipment.location}</p>}
                {equipment.notes && <p className="text-slate-600 mt-2 text-sm">{equipment.notes}</p>}
              </>
            ) : (
              <div className="space-y-3 max-w-md">
                <div>
                  <label className="block text-sm text-slate-600 mb-0.5">Tên thiết bị</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-0.5">Mã</label>
                  <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-0.5">Vị trí</label>
                  <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-0.5">Ngày bảo trì tiếp theo</label>
                  <input type="date" value={form.nextMaintenanceDate} onChange={(e) => setForm((f) => ({ ...f, nextMaintenanceDate: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-0.5">Chu kỳ (ngày)</label>
                  <input type="number" min={1} value={form.cycleDays} onChange={(e) => setForm((f) => ({ ...f, cycleDays: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-0.5">Ghi chú</label>
                  <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </div>
                <div className="flex gap-2">
                  <button onClick={saveFull} className="rounded-lg bg-primary-600 px-3 py-2 text-white text-sm hover:bg-primary-700">Lưu</button>
                  <button onClick={() => setEditingFull(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Hủy</button>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {!editingFull && (
              <button onClick={() => setEditingFull(true)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">Sửa thông tin</button>
            )}
            <button onClick={handleDelete} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">Xóa thiết bị</button>
          </div>
        </div>

        {!editingFull && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <h2 className="font-semibold text-slate-800 mb-2">Lịch bảo trì</h2>
          {editing ? (
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Ngày bảo trì tiếp theo</label>
                <input
                  type="date"
                  value={form.nextMaintenanceDate}
                  onChange={(e) => setForm((f) => ({ ...f, nextMaintenanceDate: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Chu kỳ (ngày)</label>
                <input
                  type="number"
                  min={1}
                  value={form.cycleDays}
                  onChange={(e) => setForm((f) => ({ ...f, cycleDays: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 w-24"
                />
              </div>
              <button onClick={saveSchedule} className="rounded-lg bg-primary-600 px-3 py-2 text-white text-sm hover:bg-primary-700">Lưu</button>
              <button onClick={() => setEditing(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Hủy</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-slate-700">
                Tiếp theo: {equipment.nextMaintenanceDate ? format(new Date(equipment.nextMaintenanceDate), "d/M/yyyy", { locale: vi }) : "—"}
                {equipment.cycleDays && ` (chu kỳ ${equipment.cycleDays} ngày)`}
              </p>
              <button onClick={() => setEditing(true)} className="text-sm text-primary-600 hover:underline">Sửa</button>
            </div>
          )}
        </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-800 mb-3">Công việc bảo trì đã thực hiện</h2>
        {pastJobs.length === 0 ? (
          <p className="text-slate-500 text-sm">Chưa có công việc nào.</p>
        ) : (
          <ul className="space-y-2">
            {pastJobs.map((j) => (
              <li key={j.id}>
                <Link href={`/dashboard/jobs/${j.id}`} className="text-primary-600 hover:underline">
                  {j.title}
                </Link>
                <span className="text-slate-500 text-sm ml-2">
                  {j.completedAt ? format(new Date(j.completedAt), "d/M/yyyy", { locale: vi }) : j.updatedAt ? format(new Date(j.updatedAt), "d/M/yyyy", { locale: vi }) : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
