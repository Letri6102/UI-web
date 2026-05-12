"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import { getErrorMessage } from "@/lib/errors";
import { addLog } from "@/lib/logStore";

const REVIEW_URL = "/api/infer";

type ReviewResult = {
  ok?: boolean;
  alarm?: boolean;
  count?: number;
  latency_ms?: number;
  carry_events?: Array<{ score?: number }>;
  phone_events?: Array<{ score?: number }>;
  annotated_b64?: string | null;
};

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState("");

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  const annotatedUrl = useMemo(() => {
    const value = result?.annotated_b64;
    if (!value) return "";
    return value.startsWith("data:") ? value : `data:image/jpeg;base64,${value}`;
  }, [result]);

  const onUpload = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    setResult(null);
    addLog("INFO", "upload", "Quick review started", { name: file.name, size: file.size, type: file.type });

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(REVIEW_URL, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || data?.detail || `HTTP ${res.status}`);
      }

      setResult(data);
      addLog("INFO", "upload", "Quick review finished", {
        alarm: data?.alarm,
        count: data?.count,
        latency_ms: data?.latency_ms,
      });
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setError(message);
      addLog("ERROR", "upload", "Quick review failed", { error: message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell
      title="Kiểm tra nhanh ảnh mẫu"
      subtitle="Dùng một ảnh để kiểm tra nhanh phản hồi của hệ thống AI, đối chiếu vùng phát hiện và xem độ trễ trước khi tinh chỉnh."
      right={<div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">Endpoint: {REVIEW_URL}</div>}
    >
      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Có cảnh báo" value={result?.alarm ? "Có" : "Không"} hint="Kết quả tổng hợp từ lần xử lý ảnh hiện tại." />
        <StatCard label="Số người" value={result?.count ?? 0} hint="Số người hệ thống nhận ra trong ảnh thử nghiệm." />
        <StatCard label="Nghi mang vật" value={result?.carry_events?.length ?? 0} hint="Số cảnh báo mang vật xuất hiện trong ảnh." />
        <StatCard label="Độ trễ" value={`${result?.latency_ms ?? 0} ms`} hint="Thời gian backend AI xử lý một ảnh." />
      </section>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-4">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/72 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
            <div className="text-[11px] uppercase tracking-[0.34em] text-slate-500">Ảnh đầu vào</div>
            <div className="mt-3 text-xl font-semibold text-white">Chọn ảnh cần kiểm tra</div>
            <div className="mt-3 text-sm leading-6 text-slate-300">
              Hỗ trợ ảnh `.jpg`, `.jpeg`, `.png`, phù hợp để kiểm tra snapshot mẫu, frame trích từ RTSP hoặc ảnh event lưu trong archive.
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-5 block w-full text-sm text-slate-300"
            />

            <div className="mt-5 flex gap-3">
              <button
                disabled={!file || busy}
                onClick={onUpload}
                className="rounded-2xl border border-sky-300/30 bg-sky-300/12 px-4 py-3 text-sm font-medium text-sky-100 hover:bg-sky-300/18 disabled:opacity-50"
              >
                {busy ? "Đang xử lý..." : "Chạy kiểm tra"}
              </button>
              <button
                disabled={busy}
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setError("");
                }}
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
              >
                Xóa
              </button>
            </div>

            {file ? (
              <div className="mt-5 rounded-[1.4rem] border border-white/8 bg-white/5 px-4 py-4 text-sm text-slate-300">
                <div className="text-white">{file.name}</div>
                <div className="mt-2">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                <div className="mt-1">{file.type || "không rõ định dạng"}</div>
              </div>
            ) : null}

            {error ? <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}
          </div>
        </section>

        <section className="col-span-12 lg:col-span-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/72 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
              <div className="text-[11px] uppercase tracking-[0.34em] text-slate-500">Ảnh gốc</div>
              <div className="mt-3 overflow-hidden rounded-[1.5rem] border border-white/8 bg-black">
                {file ? (
                  <img src={previewUrl} alt="original upload" className="h-[420px] w-full object-contain" />
                ) : (
                  <div className="flex h-[420px] items-center justify-center text-sm text-slate-500">Chưa chọn ảnh.</div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-950/72 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
              <div className="text-[11px] uppercase tracking-[0.34em] text-slate-500">Ảnh có đánh dấu</div>
              <div className="mt-3 overflow-hidden rounded-[1.5rem] border border-white/8 bg-black">
                {annotatedUrl ? (
                  <img src={annotatedUrl} alt="annotated output" className="h-[420px] w-full object-contain" />
                ) : (
                  <div className="flex h-[420px] items-center justify-center text-sm text-slate-500">Chưa có output annotation.</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] border border-white/10 bg-slate-950/72 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
              <div className="text-[11px] uppercase tracking-[0.34em] text-slate-500">Kết quả chi tiết</div>
            <div className="mt-3 text-sm leading-6 text-slate-300">
              Dùng kết quả này để đối chiếu xem rule carry/phone có đang nhạy quá mức hay bỏ sót tình huống mẫu không.
            </div>
            <pre className="mt-4 max-h-[360px] overflow-auto rounded-[1.5rem] border border-white/8 bg-slate-950 p-4 text-xs text-slate-200">
              {JSON.stringify(result || { message: "Chưa có kết quả." }, null, 2)}
            </pre>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
