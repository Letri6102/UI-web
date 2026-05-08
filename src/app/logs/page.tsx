"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { addLog, clearLogs, exportLogsJson, readLogs } from "@/lib/logStore";
import { LogEntry } from "@/lib/types";

function fmt(ts: number) {
  return new Date(ts).toLocaleString("vi-VN");
}

function levelBadge(level: string) {
  if (level === "ERROR") return "bg-red-500/15 text-red-300 border-red-500/30";
  if (level === "WARN") return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  return "bg-cyan-500/15 text-cyan-200 border-cyan-500/30";
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>(() => readLogs());
  const [q, setQ] = useState("");

  const refresh = () => setLogs(readLogs());

  useEffect(() => {
    addLog("INFO", "system", "Opened Logs page");
    const kickoffTimer = window.setTimeout(refresh, 0);
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("zena_monitor_logs_v1")) refresh();
    };
    window.addEventListener("storage", onStorage);
    const timer = setInterval(refresh, 1000);
    return () => {
      window.clearTimeout(kickoffTimer);
      window.removeEventListener("storage", onStorage);
      clearInterval(timer);
    };
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter((l) => [l.level, l.source, l.message, JSON.stringify(l.data || {})].join(" ").toLowerCase().includes(query));
  }, [logs, q]);

  return (
    <AppShell
      title="Nhật ký hệ thống"
      subtitle="Lưu các thao tác và lỗi tạm thời ở trình duyệt, hữu ích khi cần kiểm tra kết nối giao diện hoặc gửi thông tin cho đội kỹ thuật."
      right={
        <div className="flex gap-2">
          <button
            onClick={() => {
              const blob = new Blob([exportLogsJson()], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "logs.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-neutral-200 hover:bg-white/5"
          >
            Tải JSON
          </button>
          <button
            onClick={() => {
              clearLogs();
              refresh();
            }}
            className="rounded-2xl border border-red-500/30 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
          >
            Xóa nhật ký
          </button>
        </div>
      }
    >
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo nội dung, mức độ hoặc nguồn..."
          className="w-full rounded-2xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none"
        />

        <div className="mt-4 space-y-3 max-h-[70vh] overflow-auto pr-1">
          {filtered.length === 0 ? (
            <div className="text-sm text-neutral-500">Chưa có nhật ký nào.</div>
          ) : (
            filtered.map((l) => (
              <div key={l.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${levelBadge(l.level)}`}>
                      {l.level}
                    </span>
                    <span className="text-xs text-neutral-500">{l.source}</span>
                  </div>
                  <div className="text-xs text-neutral-500">{fmt(l.ts)}</div>
                </div>
                <div className="mt-2 text-sm text-neutral-200">{l.message}</div>
                {l.data ? (
                  <pre className="mt-3 max-h-48 overflow-auto rounded-2xl bg-neutral-950 p-3 text-xs text-neutral-300">
                    {JSON.stringify(l.data, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
