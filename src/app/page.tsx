"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import NavCard from "@/components/NavCard";
import StatCard from "@/components/StatCard";
import { CAMERAS, mergeBackendCameras } from "@/lib/cameras";
import {
  eventLabel,
  eventTone,
  fmtDateTime,
  fmtRelativeTime,
  formatPercent,
  reviewStatusLabel,
  reviewStatusTone,
} from "@/lib/format";
import type {
  BackendCameraItem,
  BackendEventItem,
  BackendEventsResponse,
  CameraConfig,
  CameraStatus,
} from "@/lib/types";

type StatusMap = Record<string, CameraStatus>;

export default function DashboardPage() {
  const [cameras, setCameras] = useState<CameraConfig[]>(CAMERAS);
  const [statusMap, setStatusMap] = useState<StatusMap>({});
  const [recentEvents, setRecentEvents] = useState<BackendEventItem[]>([]);
  const [eventSummary, setEventSummary] = useState<BackendEventsResponse["summary"]>();

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const [cameraRes, statusRes, eventsRes] = await Promise.all([
          fetch("/api/cameras", { cache: "no-store" }),
          fetch("/api/status-all", { cache: "no-store" }),
          fetch("/api/events?limit=6", { cache: "no-store" }),
        ]);

        const cameraData = (await cameraRes.json().catch(() => ({ items: [] }))) as { items?: BackendCameraItem[] };
        const statusData = (await statusRes.json().catch(() => ({ items: [] }))) as { items?: CameraStatus[] };
        const eventsData = (await eventsRes.json().catch(() => ({ items: [] }))) as BackendEventsResponse;

        if (!alive) return;

        setCameras(mergeBackendCameras((cameraData.items || []) as BackendCameraItem[]));

        const nextMap: StatusMap = {};
        for (const item of statusData.items || []) {
          if (item?.camera_id) nextMap[item.camera_id] = item;
        }
        setStatusMap(nextMap);
        setRecentEvents(Array.isArray(eventsData.items) ? eventsData.items : []);
        setEventSummary(eventsData.summary);
      } catch {
        if (!alive) return;
        setCameras(CAMERAS);
      }
    }

    load();
    const timer = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const onlineCount = useMemo(
    () => cameras.filter((camera) => statusMap[camera.id]?.stream_ready && !statusMap[camera.id]?.stream_error).length,
    [cameras, statusMap]
  );
  const alertCount = useMemo(
    () => cameras.filter((camera) => statusMap[camera.id]?.alarm).length,
    [cameras, statusMap]
  );
  const offlineCount = Math.max(0, cameras.length - onlineCount);
  const totalArchived = eventSummary?.total ?? 0;
  const autoCount = eventSummary?.by_source?.auto ?? 0;
  const carryCount = eventSummary?.by_type?.carrying ?? 0;
  const phoneCount = eventSummary?.by_type?.phone ?? 0;
  const pendingReview = eventSummary?.by_review_status?.pending ?? 0;

  return (
    <AppShell
      title="Tổng quan ca trực"
      subtitle="Theo dõi nhanh camera đang hoạt động, cảnh báo vừa phát sinh và các việc cần xử lý ngay trong ca. Mục tiêu của màn này là giúp người trực biết nên mở camera nào, xác minh sự kiện nào và khi nào cần chuyển tiếp cho bảo vệ."
      right={<div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">{onlineCount}/{cameras.length} camera sẵn sàng</div>}
    >
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Camera hoạt động" value={`${onlineCount}/${cameras.length}`} hint={`${offlineCount} camera đang mất kết nối hoặc lỗi luồng.`} />
        <StatCard label="Camera cần chú ý" value={alertCount} hint="Số camera đang có cảnh báo ở nhịp xử lý gần nhất." />
        <StatCard label="Bằng chứng đã lưu" value={totalArchived} hint={`${autoCount} ảnh hoặc clip đã lưu, gồm ${carryCount} nghi mang vật và ${phoneCount} dùng điện thoại.`} />
        <StatCard label="Chờ xác minh" value={pendingReview} hint="Các cảnh báo đang chờ người trực mở ảnh hoặc clip để chốt kết quả." />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/72 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
          <div className="text-[11px] uppercase tracking-[0.34em] text-slate-500">Bắt đầu nhanh</div>
          <div className="mt-3 text-2xl font-semibold text-white">Việc cần làm trong ca</div>
          <div className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Mở màn hình camera để kiểm tra khu vực đang có cảnh báo hoặc mất kết nối. Sau đó chuyển sang màn xử lý cảnh báo để xem ảnh, clip và ghi chú xác minh. Phần công cụ hỗ trợ chỉ dùng khi cần kiểm tra mô hình hoặc xử lý lỗi.
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <NavCard href="/webcam" title="Mở màn hình camera" desc="Theo dõi trực tiếp luồng hình, tình trạng camera, ảnh gần nhất và cảnh báo theo từng khu vực." meta="Ưu tiên" />
            <NavCard href="/events" title="Xử lý cảnh báo" desc="Mở ảnh hoặc clip, xác minh sự kiện và lưu ghi chú cho ca sau hoặc bảo vệ." meta="Xác minh" />
            <NavCard href="/settings" title="Thiết lập camera" desc="Chỉnh vùng giám sát, ngưỡng cảnh báo và cấu hình clip ngay trên giao diện." meta="Thiết lập" />
            <NavCard href="/upload" title="Kiểm tra nhanh ảnh mẫu" desc="Tải ảnh lên để xem thử phản hồi từ AI khi cần đối chiếu hoặc tinh chỉnh." meta="Hỗ trợ" />
            <NavCard href="/logs" title="Xem nhật ký hệ thống" desc="Dành cho lúc cần kiểm tra lỗi kết nối, proxy hoặc hành vi bất thường của giao diện." meta="Kỹ thuật" />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/72 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
          <div className="text-[11px] uppercase tracking-[0.34em] text-slate-500">Tình trạng camera</div>
          <div className="mt-3 text-2xl font-semibold text-white">Khu vực cần kiểm tra</div>
          <div className="mt-5 space-y-3">
            {cameras.map((camera) => {
              const status = statusMap[camera.id];
              const online = status?.stream_ready && !status?.stream_error;
              return (
                <div key={camera.id} className="rounded-[1.5rem] border border-white/8 bg-white/5 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-white">{camera.name}</div>
                      <div className="mt-1 text-sm text-slate-400">{camera.location}</div>
                    </div>
                    <div className={`rounded-full border px-3 py-1 text-xs font-medium ${online ? "border-emerald-400/30 bg-emerald-400/12 text-emerald-100" : "border-red-500/30 bg-red-500/12 text-red-200"}`}>
                      {online ? "Đang hoạt động" : "Mất kết nối"}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-2xl border border-white/8 bg-slate-950/65 px-3 py-3">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Người</div>
                      <div className="mt-2 text-white">{status?.count ?? 0}</div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-950/65 px-3 py-3">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Cảnh báo</div>
                      <div className="mt-2 text-white">{(status?.carry_events ?? 0) + (status?.phone_events ?? 0)}</div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-950/65 px-3 py-3">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Độ trễ</div>
                      <div className="mt-2 text-white">{status?.latency_ms ?? 0} ms</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-950/72 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.34em] text-slate-500">Cảnh báo mới</div>
            <div className="mt-3 text-2xl font-semibold text-white">Sự kiện cần xem sớm</div>
            <div className="mt-2 text-sm leading-6 text-slate-300">
              Đây là các cảnh báo vừa được lưu vào kho bằng chứng. Người trực nên xác minh sớm để quyết định có cần chuyển cho bảo vệ hoặc quản lý kho hay không.
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
          {recentEvents.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/5 px-5 py-8 text-sm text-slate-400">
              Chưa có event nào trong archive backend.
            </div>
          ) : (
            recentEvents.map((event) => (
              <div key={event.id} className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-white">{event.camera_name || event.camera_id}</div>
                    <div className="mt-1 text-sm text-slate-500">{event.filename}</div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${eventTone(event.event_type)}`}>
                    {eventLabel(event.event_type)}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                  <div>{fmtDateTime((event.ts || 0) * 1000)}</div>
                  <div className="text-slate-500">{fmtRelativeTime((event.ts || 0) * 1000)}</div>
                </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/8 bg-slate-950/65 px-3 py-3 text-sm">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Mức tin cậy</div>
                    <div className="mt-2 text-white">{formatPercent(event.score)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-slate-950/65 px-3 py-3 text-sm">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Trạng thái</div>
                    <div className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${reviewStatusTone(event.review_status)}`}>
                      {reviewStatusLabel(event.review_status)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
