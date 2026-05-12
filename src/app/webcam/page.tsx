"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import CameraPanel from "@/components/CameraPanel";
import StatCard from "@/components/StatCard";
import { CAMERAS, mergeBackendCameras } from "@/lib/cameras";
import { eventLabel, eventTone, fmtDateTime, formatPercent } from "@/lib/format";
import type {
  BackendCameraItem,
  BackendEventItem,
  BackendEventsResponse,
  CameraConfig,
  CameraStatus,
} from "@/lib/types";

type StatusMap = Record<string, CameraStatus>;

export default function WebcamPage() {
  const [cameras, setCameras] = useState<CameraConfig[]>(CAMERAS);
  const [statusMap, setStatusMap] = useState<StatusMap>({});
  const [recentEvents, setRecentEvents] = useState<BackendEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCameras = useCallback(async () => {
    try {
      const res = await fetch("/api/cameras", { cache: "no-store" });
      const data = await res.json();
      setCameras(mergeBackendCameras((data?.items || []) as BackendCameraItem[]));
    } catch {
      setCameras(CAMERAS);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [statusRes, eventsRes] = await Promise.all([
        fetch("/api/status-all", { cache: "no-store" }),
        fetch("/api/events?limit=5&source=auto", { cache: "no-store" }),
      ]);

      const statusData = (await statusRes.json().catch(() => ({ items: [] }))) as { items?: CameraStatus[] };
      const eventsData = (await eventsRes.json().catch(() => ({ items: [] }))) as BackendEventsResponse;

      const nextMap: StatusMap = {};
      for (const item of statusData?.items || []) {
        if (item?.camera_id) nextMap[item.camera_id] = item;
      }
      setStatusMap(nextMap);
      setRecentEvents(Array.isArray(eventsData.items) ? eventsData.items : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const kickoffTimer = window.setTimeout(() => {
      void loadCameras();
      void refresh();
    }, 0);
    const refreshTimer = window.setInterval(refresh, 2500);
    return () => {
      window.clearTimeout(kickoffTimer);
      window.clearInterval(refreshTimer);
    };
  }, [loadCameras, refresh]);

  const onlineCount = useMemo(
    () => cameras.filter((camera) => statusMap[camera.id]?.ai_active).length,
    [cameras, statusMap]
  );
  const alertCount = useMemo(
    () => cameras.filter((camera) => statusMap[camera.id]?.alarm).length,
    [cameras, statusMap]
  );
  const avgLatency = useMemo(() => {
    const values = cameras
      .map((camera) => statusMap[camera.id]?.latency_ms)
      .filter((value): value is number => typeof value === "number");
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [cameras, statusMap]);

  return (
    <AppShell
      title="Màn hình camera"
      subtitle="Xem camera thường qua WebRTC. Chỉ bật AI ở camera cần phân tích để giảm tải server."
      right={
        <div className="rounded-full border border-sky-300/25 bg-sky-300/12 px-4 py-2 text-sm text-sky-100">
          {onlineCount}/{cameras.length} camera đang bật AI
        </div>
      }
    >
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="AI đang chạy" value={`${onlineCount}/${cameras.length}`} hint={loading ? "Đang tải trạng thái..." : "Chỉ các camera đã bật AI mới dùng backend detect."} />
        <StatCard label="Camera có cảnh báo" value={alertCount} hint="Ưu tiên mở các camera đang bật AI và có sự kiện." />
        <StatCard label="Độ trễ AI" value={`${avgLatency} ms`} hint="Chỉ tính trên các camera đang bật AI." />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {cameras.map((camera) => (
            <CameraPanel key={camera.id} camera={camera} status={statusMap[camera.id] ?? null} onSaved={refresh} />
          ))}
        </div>

        <aside className="order-first rounded-[2rem] border border-white/10 bg-slate-950/72 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl xl:order-last">
          <div className="text-[11px] uppercase tracking-[0.34em] text-slate-500">Cần xem ngay</div>
          <div className="mt-3 text-2xl font-semibold text-white">Cảnh báo vừa phát sinh</div>
          <div className="mt-2 text-sm leading-6 text-slate-300">
            Cột này chỉ có dữ liệu khi một camera đã bật AI và vừa phát hiện sự kiện.
          </div>

          <div className="mt-5 space-y-3">
            {recentEvents.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-white/10 px-4 py-5 text-sm text-slate-500">
                Chưa có event tự động mới.
              </div>
            ) : (
              recentEvents.map((event) => (
                <div key={event.id} className="rounded-[1.4rem] border border-white/8 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">{event.camera_name || event.camera_id}</div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${eventTone(event.event_type)}`}>
                      {eventLabel(event.event_type)}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-slate-300">{fmtDateTime((event.ts || 0) * 1000)}</div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-300">
                    <span>{event.source === "manual" ? "Lưu thủ công" : "Tự động"}</span>
                    <span>{formatPercent(event.score)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
