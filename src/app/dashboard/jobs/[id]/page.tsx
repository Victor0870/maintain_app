"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useRef } from "react";
import * as XLSX from "xlsx";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { Printer, Download, User, MapPin, Wrench, Package, ShieldCheck } from "lucide-react";
import type { Job } from "../page";
import type { WorkOrder } from "../../work-orders/page";

interface RiskItem {
  id: string;
  label: string;
}
interface MeasureItem {
  id: string;
  label: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const id = params.id as string;
  const [job, setJob] = useState<Job | null>(null);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [risksList, setRisksList] = useState<RiskItem[]>([]);
  const [measuresList, setMeasuresList] = useState<MeasureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [woLocation, setWoLocation] = useState("");
  const [woRisks, setWoRisks] = useState<string[]>([]);
  const [woMeasures, setWoMeasures] = useState<string[]>([]);
  const [woApproverName, setWoApproverName] = useState("");
  const [woApproverSignature, setWoApproverSignature] = useState("");
  const [riskSearch, setRiskSearch] = useState("");
  const [measureSearch, setMeasureSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [materialsUsed, setMaterialsUsed] = useState<{ materialId: string; materialName: string; quantity: number; unit: string }[]>([]);
  const [editJob, setEditJob] = useState(false);
  const [jobForm, setJobForm] = useState({ status: "pending" as Job["status"], assignee: "", location: "", plannedDate: "" });
  const [materialsList, setMaterialsList] = useState<{ id: string; name: string; unit: string; quantity: number }[]>([]);
  const [addMaterialId, setAddMaterialId] = useState("");
  const [addMaterialQty, setAddMaterialQty] = useState("");

  useEffect(() => {
    (async () => {
      const jobSnap = await getDoc(doc(db, "jobs", id));
      if (!jobSnap.exists()) {
        router.replace("/dashboard/jobs");
        return;
      }
      const jobData = { id: jobSnap.id, ...jobSnap.data() } as Job;
      setJob(jobData);
      setJobForm({
        status: jobData.status,
        assignee: jobData.assignee || "",
        location: jobData.location || "",
        plannedDate: jobData.plannedDate || "",
      });
      const woSnap = await getDocs(query(collection(db, "workOrders"), where("jobId", "==", id)));
      if (!woSnap.empty) {
        const wo = { id: woSnap.docs[0].id, ...woSnap.docs[0].data() } as WorkOrder;
        setWorkOrder(wo);
        setWoLocation(wo.location || "");
        setWoRisks(Array.isArray(wo.risks) ? wo.risks : []);
        setWoMeasures(Array.isArray(wo.measures) ? wo.measures : []);
        setWoApproverName(wo.approverName || "");
        setWoApproverSignature(wo.approverSignature || "");
      }
      const txSnap = await getDocs(query(collection(db, "material_transactions"), where("jobId", "==", id)));
      setMaterialsUsed(
        txSnap.docs
          .filter((d) => (d.data() as { type?: string }).type === "out")
          .map((d) => {
            const d2 = d.data() as { materialId: string; materialName: string; quantity: number; unit: string };
            return { materialId: d2.materialId, materialName: d2.materialName, quantity: d2.quantity, unit: d2.unit };
          })
      );
      setLoading(false);
    })();
  }, [id, router]);

  useEffect(() => {
    getDocs(collection(db, "materials")).then((s) =>
      setMaterialsList(s.docs.map((d) => ({ id: d.id, ...d.data() } as { id: string; name: string; unit: string; quantity: number })))
    );
  }, []);

  useEffect(() => {
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

  function addRisk(label: string) {
    if (!woRisks.includes(label)) setWoRisks((prev) => [...prev, label]);
    setRiskSearch("");
  }
  function removeRisk(label: string) {
    setWoRisks((prev) => prev.filter((x) => x !== label));
  }
  function addMeasure(label: string) {
    if (!woMeasures.includes(label)) setWoMeasures((prev) => [...prev, label]);
    setMeasureSearch("");
  }
  function removeMeasure(label: string) {
    setWoMeasures((prev) => prev.filter((x) => x !== label));
  }

  async function saveJobFields() {
    if (!job) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        status: jobForm.status,
        assignee: jobForm.assignee?.trim() || null,
        location: jobForm.location?.trim() || null,
        plannedDate: jobForm.plannedDate || null,
        updatedAt: new Date().toISOString(),
      };
      if (jobForm.status === "done") payload.completedAt = new Date().toISOString();
      await updateDoc(doc(db, "jobs", id), payload);
      setJob((prev) => (prev ? { ...prev, ...payload } : null));
      setEditJob(false);
    } finally {
      setSaving(false);
    }
  }

  async function addMaterialToJob() {
    if (!job || !addMaterialId || !addMaterialQty) return;
    const qty = parseInt(addMaterialQty, 10);
    if (qty < 1) return;
    const mat = materialsList.find((m) => m.id === addMaterialId);
    if (!mat || mat.quantity < qty) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "material_transactions"), {
        type: "out",
        materialId: addMaterialId,
        materialName: mat.name,
        unit: mat.unit,
        quantity: qty,
        jobId: id,
        jobTitle: job.title,
        createdAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, "materials", addMaterialId), {
        quantity: mat.quantity - qty,
        updatedAt: new Date().toISOString(),
      });
      setMaterialsUsed((prev) => [...prev, { materialId: mat.id, materialName: mat.name, quantity: qty, unit: mat.unit }]);
      setMaterialsList((prev) => prev.map((m) => (m.id === addMaterialId ? { ...m, quantity: m.quantity - qty } : m)));
      setAddMaterialId("");
      setAddMaterialQty("");
    } finally {
      setSaving(false);
    }
  }

  async function saveWorkOrder() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        jobId: id,
        jobTitle: job?.title ?? "",
        location: woLocation?.trim() || null,
        risks: woRisks,
        measures: woMeasures,
        approverName: woApproverName?.trim() || null,
        approverSignature: woApproverSignature?.trim() || null,
        updatedAt: new Date().toISOString(),
      };
      if (workOrder) {
        await updateDoc(doc(db, "workOrders", workOrder.id), payload);
        setWorkOrder((prev) => (prev ? { ...prev, ...payload } : null));
      } else {
        const ref = await addDoc(collection(db, "workOrders"), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
        setWorkOrder({ id: ref.id, ...payload, createdAt: "", updatedAt: "" });
      }
    } finally {
      setSaving(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function exportExcel() {
    const rows = [
      ["Phiếu Work Order"],
      ["Công việc", job?.title],
      ["Vị trí làm việc", woLocation],
      ["Rủi ro an toàn", woRisks.join("\n")],
      ["Biện pháp áp dụng", woMeasures.join("\n")],
      ["Người phê duyệt", woApproverName],
      ["Chữ ký / Ghi chú phê duyệt", woApproverSignature],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "WorkOrder");
    XLSX.writeFile(wb, `work-order-${id}.xlsx`);
  }

  async function exportWord() {
    const docxDoc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({ text: "Phiếu Work Order", heading: "Heading1" }),
            new Paragraph({ children: [new TextRun({ text: `Công việc: ${job?.title || ""}` })], spacing: { after: 200 } }),
            new Paragraph({ children: [new TextRun({ text: `Vị trí làm việc: ${woLocation}` })], spacing: { after: 200 } }),
            new Paragraph({ children: [new TextRun({ text: "Rủi ro an toàn:" })], spacing: { after: 100 } }),
            ...woRisks.map((r) => new Paragraph({ text: `• ${r}`, spacing: { after: 100 } })),
            new Paragraph({ children: [new TextRun({ text: "Biện pháp áp dụng:" })], spacing: { after: 100 } }),
            ...woMeasures.map((m) => new Paragraph({ text: `• ${m}`, spacing: { after: 100 } })),
            new Paragraph({ children: [new TextRun({ text: `Người phê duyệt: ${woApproverName}` })], spacing: { after: 200 } }),
            new Paragraph({ children: [new TextRun({ text: `Chữ ký / Ghi chú: ${woApproverSignature}` })], spacing: { after: 200 } }),
          ],
        },
      ],
    });
    const blob = await Packer.toBlob(docxDoc);
    saveAs(blob, `work-order-${id}.docx`);
  }

  if (loading || !job) return <p className="text-slate-500">Đang tải...</p>;

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/dashboard/jobs" className="text-slate-600 hover:text-slate-800">← Công việc</Link>

      {/* Print header - only when printing */}
      <div className="hidden print:flex justify-between items-center border-b-2 border-slate-800 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Maintenance Order</h1>
          <p className="text-sm text-slate-600">Phiếu yêu cầu bảo trì & sửa chữa</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-800">WO-{id.slice(0, 8)}</p>
          <p className="text-sm text-slate-600">Ngày: {job.plannedDate ? format(new Date(job.plannedDate), "d/M/yyyy", { locale: vi }) : "—"}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card" ref={printRef}>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <h1 className="text-xl font-bold text-slate-800">{job.title}</h1>
          <div className="flex gap-2 print:hidden">
            <button onClick={handlePrint} className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition">
              <Printer className="w-4 h-4" /> In phiếu
            </button>
            <button onClick={exportExcel} className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button onClick={exportWord} className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition">
              <Download className="w-4 h-4" /> Xuất Word
            </button>
          </div>
        </div>
        {job.description && <p className="text-slate-600 mt-1">{job.description}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {!editJob ? (
              <>
                <p><span className="text-slate-500">Trạng thái:</span> {job.status === "done" ? "Đã làm" : job.status === "in_progress" ? "Đang làm" : "Sắp làm"}</p>
                <p><span className="text-slate-500">Người làm:</span> {job.assignee || "—"}</p>
                <p><span className="text-slate-500">Vị trí:</span> {job.location || "—"}</p>
                <p><span className="text-slate-500">Thiết bị:</span> {job.equipmentName || "—"}</p>
                <p><span className="text-slate-500">Ngày dự kiến:</span> {job.plannedDate ? format(new Date(job.plannedDate), "d/M/yyyy", { locale: vi }) : "—"}</p>
              </>
            ) : (
              <>
                <div><label className="text-slate-500">Trạng thái</label>
                  <select value={jobForm.status} onChange={(e) => setJobForm((f) => ({ ...f, status: e.target.value as Job["status"] }))} className="ml-2 rounded border px-2 py-1">
                    <option value="pending">Sắp làm</option>
                    <option value="in_progress">Đang làm</option>
                    <option value="done">Đã làm</option>
                  </select>
                </div>
                <div><label className="text-slate-500">Người làm</label>
                  <input value={jobForm.assignee} onChange={(e) => setJobForm((f) => ({ ...f, assignee: e.target.value }))} className="ml-2 rounded border px-2 py-1 w-40" />
                </div>
                <div><label className="text-slate-500">Vị trí</label>
                  <input value={jobForm.location} onChange={(e) => setJobForm((f) => ({ ...f, location: e.target.value }))} className="ml-2 rounded border px-2 py-1 w-40" />
                </div>
                <div><label className="text-slate-500">Ngày dự kiến</label>
                  <input type="date" value={jobForm.plannedDate} onChange={(e) => setJobForm((f) => ({ ...f, plannedDate: e.target.value }))} className="ml-2 rounded border px-2 py-1" />
                </div>
              </>
            )}
          </div>
          {!editJob ? (
            <button type="button" onClick={() => setEditJob(true)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">Sửa</button>
          ) : (
            <div className="flex gap-2">
              <button type="button" onClick={saveJobFields} disabled={saving} className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 disabled:opacity-50">Lưu</button>
              <button type="button" onClick={() => setEditJob(false)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">Hủy</button>
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-slate-500">Thiết bị: {job.equipmentName || "—"} (chỉ xem)</p>

        {/* JSA / Work Order - display box (reference style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4" />
              <span className="text-xs font-bold text-slate-500 uppercase">Người thực hiện</span>
            </div>
            <p className="font-medium">{job.assignee || "—"}</p>
            <div className="flex items-center gap-2 text-slate-700">
              <Wrench className="w-4 h-4" />
              <span className="text-xs font-bold text-slate-500 uppercase">Thiết bị</span>
            </div>
            <p className="font-medium">{job.equipmentName || "—"}</p>
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="w-4 h-4" />
              <span className="text-xs font-bold text-slate-500 uppercase">Vị trí</span>
            </div>
            <p className="font-medium">{woLocation || job.location || "—"}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
            <h3 className="flex items-center gap-2 font-bold text-amber-800 mb-3">
              <ShieldCheck className="w-5 h-5" /> AN TOÀN LAO ĐỘNG (JSA)
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-amber-700 uppercase block mb-0.5">Các rủi ro tiềm ẩn</label>
                <p className="text-sm text-amber-900">{woRisks.length > 0 ? woRisks.join("; ") : "—"}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-amber-700 uppercase block mb-0.5">Biện pháp áp dụng</label>
                <p className="text-sm text-amber-900 font-medium">{woMeasures.length > 0 ? woMeasures.join("; ") : "—"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <h2 className="font-semibold text-slate-800 mb-3">Chỉnh sửa Work Order</h2>
          <div className="space-y-4 print:hidden">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vị trí làm việc</label>
              <input value={woLocation} onChange={(e) => setWoLocation(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Khu vực / tủ điện / ..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rủi ro an toàn (chọn từ danh sách hoặc gõ tìm)</label>
              <input value={riskSearch} onChange={(e) => setRiskSearch(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 mb-1" placeholder="Tìm kiếm..." />
              <div className="flex flex-wrap gap-1 mb-2">
                {woRisks.map((r) => (
                  <span key={r} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-sm text-amber-800">
                    {r} <button type="button" onClick={() => removeRisk(r)} className="text-amber-600 hover:text-amber-900">×</button>
                  </span>
                ))}
              </div>
              <ul className="border border-slate-200 rounded-xl max-h-40 overflow-y-auto">
                {filteredRisks.slice(0, 10).map((r) => (
                  <li key={r.id}>
                    <button type="button" onClick={() => addRisk(r.label)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100">
                      {r.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Biện pháp phòng ngừa (chọn từ danh sách)</label>
              <input value={measureSearch} onChange={(e) => setMeasureSearch(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 mb-1" placeholder="Tìm kiếm..." />
              <div className="flex flex-wrap gap-1 mb-2">
                {woMeasures.map((m) => (
                  <span key={m} className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-sm text-emerald-800">
                    {m} <button type="button" onClick={() => removeMeasure(m)} className="text-emerald-600 hover:text-emerald-900">×</button>
                  </span>
                ))}
              </div>
              <ul className="border border-slate-200 rounded-xl max-h-40 overflow-y-auto">
                {filteredMeasures.slice(0, 10).map((m) => (
                  <li key={m.id}>
                    <button type="button" onClick={() => addMeasure(m.label)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100">
                      {m.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Người phê duyệt</label>
              <input value={woApproverName} onChange={(e) => setWoApproverName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Họ tên người phê duyệt" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ô chữ ký / Ghi chú phê duyệt</label>
              <input value={woApproverSignature} onChange={(e) => setWoApproverSignature(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Đã ký, ngày ký hoặc ghi chú" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 print:hidden">
            <button onClick={saveWorkOrder} disabled={saving} className="rounded-xl bg-primary-600 px-4 py-2.5 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {saving ? "Đang lưu..." : "Lưu Work Order"}
            </button>
          </div>
        </div>

        {/* Vật tư đã sử dụng - table style */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5" /> Vật tư đã sử dụng
            </h3>
          </div>
          <table className="w-full text-sm border-collapse border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-3 text-left border-b border-slate-200 font-semibold text-slate-600">Tên vật tư</th>
                <th className="p-3 text-center border-b border-slate-200 font-semibold text-slate-600">Số lượng</th>
                <th className="p-3 text-center border-b border-slate-200 font-semibold text-slate-600">Đơn vị</th>
                <th className="p-3 text-right border-b border-slate-200 font-semibold text-slate-600">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {materialsUsed.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400 italic">Chưa ghi nhận sử dụng vật tư</td>
                </tr>
              ) : (
                materialsUsed.map((m, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="p-3 font-medium text-slate-800">{m.materialName}</td>
                    <td className="p-3 text-center font-semibold">{m.quantity}</td>
                    <td className="p-3 text-center text-slate-600">{m.unit}</td>
                    <td className="p-3 text-right text-slate-500">—</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="flex flex-wrap items-end gap-2 mt-4 print:hidden">
            <div>
              <label className="block text-xs text-slate-600 mb-0.5">Bổ sung vật tư</label>
              <select value={addMaterialId} onChange={(e) => setAddMaterialId(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-w-[180px]">
                <option value="">— Chọn vật tư —</option>
                {materialsList.filter((m) => m.quantity > 0).map((m) => (
                  <option key={m.id} value={m.id}>{m.name} (còn {m.quantity} {m.unit})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-0.5">Số lượng</label>
              <input type="number" min={1} value={addMaterialQty} onChange={(e) => setAddMaterialQty(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm w-24" placeholder="0" />
            </div>
            <button type="button" onClick={addMaterialToJob} disabled={saving || !addMaterialId || !addMaterialQty} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              + Cập nhật vật tư
            </button>
          </div>
        </div>

        {/* 3 chữ ký - style reference */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12 pt-8 border-t border-slate-200">
          <div className="text-center">
            <p className="text-xs font-bold text-slate-500 uppercase mb-6">Người phê duyệt</p>
            <div className="h-20 flex items-end justify-center border-b border-dashed border-slate-300 mx-auto w-3/4" />
            {woApproverName && <p className="text-sm mt-2 font-medium text-slate-700">{woApproverName}</p>}
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-slate-500 uppercase mb-6">Giám sát khu vực</p>
            <div className="h-20 flex items-end justify-center border-b border-dashed border-slate-300 mx-auto w-3/4" />
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-slate-500 uppercase mb-6">Người thực hiện</p>
            <div className="h-20 flex items-end justify-center border-b border-dashed border-slate-300 mx-auto w-3/4" />
            {job.assignee && <p className="text-sm mt-2 font-medium text-slate-700">{job.assignee}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
