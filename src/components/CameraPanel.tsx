"use client";

import { useMemo, useState } from "react";
import HlsPlayer from "@/components/HlsPlayer";
import { MEDIA_MTX_HLS_BASE } from "@/lib/config";
import { CameraConfig, CameraStatus } from "@/lib/types";
import { getErrorMessage } from "@/lib/errors";
import { eventLabel, eventTone, fmtDateTime, formatPercent } from "@/lib/format";

type Props = {
  camera: CameraConfig;
  status?: CameraStatus | null;
  onSaved?: () => void;
};

const ERROR_LABELS: Record<string, string> = {
  RTSP_URL_EMPTY: "Chưa cấu hình RTSP URL.",
  RTSP_OPEN_FAILED: "Không mở được luồng RTSP.",
  NO_FRESH_FRAME: "Không lấy được frame mới.",
  UNSUPPORTED_SOURCE_TYPE: "Nguồn camera chưa được hỗ trợ.",
  STREAM_ERROR: "Lỗi luồng camera.",
};

function formatError(code?: string) {
  if (!code) return "Không có";
  return ERROR_LABELS[code] || code;
}

export default function CameraPanel({ camera, status, onSaved }: Props) {
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [snapshotKey, setSnapshotKey] = useState(0);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [viewMode, setViewMode] = useState<"hls" | "mjpeg">(
    camera.mediaViewer === "mjpeg" ? "mjpeg" : "hls"
  );
  const aiActive = Boolean(status?.ai_active ?? camera.aiActive);

  const isOffline = aiActive && (!status?.stream_ready || !!status?.stream_error);
  const badge = useMemo(() => {
    if (!aiActive) return { text: "Xem camera thường", className: "text-slate-100 bg-white/8 border-white/12" };
    if (isOffline) return { text: "Mất kết nối", className: "text-red-200 bg-red-500/12 border-red-500/30" };
    if (status?.alarm) return { text: "Cần chú ý", className: "text-amber-100 bg-amber-400/12 border-amber-400/30" };
    return { text: "AI đang chạy", className: "text-emerald-100 bg-emerald-400/12 border-emerald-400/30" };
  }, [aiActive, isOffline, status?.alarm]);

  const videoSrc = `${camera.streamPath}${camera.streamPath.includes("?") ? "&" : "?"}v=${reloadKey}`;
  const hlsSrc = camera.mediaPath
    ? `${MEDIA_MTX_HLS_BASE.replace(/\/$/, "")}/${encodeURIComponent(camera.mediaPath)}/index.m3u8`
    : "";
  const snapshotSrc = camera.snapshotPath
    ? `${camera.snapshotPath}${camera.snapshotPath.includes("?") ? "&" : "?"}v=${snapshotKey}`
    : undefined;
  const latestEvents = (Array.isArray(status?.last_events) ? status.last_events.slice(0, 3) : []).map((event) => ({
    type: typeof event.type === "string" ? event.type : undefined,
    score: typeof event.score === "number" ? event.score : undefined,
    trackId:
      typeof event.track_id === "string" || typeof event.track_id === "number"
        ? String(event.track_id)
        : "--",
  }));

  const saveEvent = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/events/save?camera_id=${encodeURIComponent(camera.id)}`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail || data?.message || `HTTP ${res.status}`);
      }
      setSnapshotKey((v) => v + 1);
      onSaved?.();
    } catch (error: unknown) {
      setSaveError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const setAiRuntime = async (active: boolean) => {
    setAiBusy(true);
    setAiError("");
    try {
      const res = await fetch(`/api/cameras/${encodeURIComponent(camera.id)}/ai-runtime`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail || data?.message || `HTTP ${res.status}`);
      }
      if (active) {
        setViewMode("mjpeg");
      } else {
        setViewMode("hls");
      }
      onSaved?.();
    } catch (error: unknown) {
      setAiError(getErrorMessage(error));
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/72 shadow-[0_25px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 border-b border-white/8 px-4 py-4 md:flex-row md:items-start md:justify-between md:px-6 md:py-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.3em] text-slate-500">{camera.id}</div>
          <div className="mt-2 text-xl font-semibold text-white sm:text-2xl">{camera.name}</div>
          <div className="mt-2 text-sm leading-6 text-slate-300">{camera.location}</div>
        </div>
        <div className={`w-fit rounded-full border px-4 py-2 text-sm font-semibold ${badge.className}`}>{badge.text}</div>
      </div>

      <div className="grid grid-cols-1 gap-0 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="border-b border-white/8 xl:border-b-0 xl:border-r">
          <div className="relative min-h-[220px] bg-black sm:min-h-[280px] xl:min-h-[320px]">
            {viewMode === "hls" && hlsSrc ? (
              <HlsPlayer
                src={`${hlsSrc}${hlsSrc.includes("?") ? "&" : "?"}v=${reloadKey}`}
                className="block h-full min-h-[220px] w-full object-cover sm:min-h-[280px] xl:min-h-[320px]"
              />
            ) : viewMode === "mjpeg" && aiActive ? (
              <img
                src={videoSrc}
                alt={camera.id}
                className="block h-full min-h-[220px] w-full object-cover sm:min-h-[280px] xl:min-h-[320px]"
                onError={() => setReloadKey((v) => v + 1)}
              />
            ) : viewMode === "mjpeg" ? (
              <div className="flex min-h-[220px] flex-col justify-center px-5 py-8 text-left sm:min-h-[280px] sm:px-8 sm:py-10 xl:min-h-[320px]">
                <div className="mb-4 text-2xl font-semibold text-sky-100 sm:text-3xl">AI đang tắt</div>
                <div className="mb-3 text-lg font-medium text-white sm:text-xl">Camera vẫn xem bình thường qua luồng camera</div>
                <div className="mb-5 text-base leading-7 text-slate-300">
                  Chỉ khi bật AI thì backend mới mở RTSP và chạy phát hiện để giảm tải server.
                </div>
                <div>
                  <button
                    onClick={() => void setAiRuntime(true)}
                    disabled={aiBusy}
                    className="rounded-2xl border border-sky-300/30 bg-sky-300/12 px-4 py-3 text-sm font-medium text-sky-100 hover:bg-sky-300/18 disabled:opacity-50"
                  >
                    {aiBusy ? "Đang bật AI..." : "Bật AI cho camera này"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[220px] flex-col justify-center px-5 py-8 text-left sm:min-h-[280px] sm:px-8 sm:py-10 xl:min-h-[320px]">
                <div className="mb-4 text-2xl font-semibold text-red-300 sm:text-3xl">Camera {camera.id}</div>
                <div className="mb-3 text-lg font-medium text-red-200 sm:text-xl">Không thể hiển thị luồng camera</div>
                <div className="mb-4 text-base leading-7 text-red-100/90">
                  {camera.name}: {formatError(status?.stream_error)}
                </div>
                <div className="text-sm text-slate-300">Hệ thống đang tự động thử reconnect.</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-white/8 px-4 py-4 sm:px-5 md:grid-cols-4 md:px-6 md:py-5">
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Trạng thái</div>
              <div className="mt-2 text-xl font-semibold text-white">{isOffline ? "Mất kết nối" : "Đang hoạt động"}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Số người</div>
              <div className="mt-2 text-xl font-semibold text-white">{status?.count ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Điện thoại</div>
              <div className="mt-2 text-xl font-semibold text-white">{status?.phone_events ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Mang vật</div>
              <div className="mt-2 text-xl font-semibold text-white">{status?.carry_events ?? 0}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-white/8 px-4 py-4 sm:grid-cols-2 sm:px-5 md:flex md:flex-wrap md:px-6 md:py-5">
            {camera.mediaPath ? (
              <>
                <button
                  onClick={() => setViewMode("hls")}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                    viewMode === "hls"
                      ? "border-sky-300/30 bg-sky-300/12 text-sky-100"
                      : "border-white/10 text-slate-100 hover:bg-white/5"
                  }`}
                >
                  Xem camera
                </button>
                <button
                  onClick={() => {
                    if (!aiActive) {
                      void setAiRuntime(true);
                      return;
                    }
                    setViewMode("mjpeg");
                  }}
                  disabled={aiBusy}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                    viewMode === "mjpeg"
                      ? "border-sky-300/30 bg-sky-300/12 text-sky-100"
                      : "border-white/10 text-slate-100 hover:bg-white/5"
                  }`}
                >
                  {!aiActive ? (aiBusy ? "Đang bật AI..." : "Bật AI") : "Xem AI"}
                </button>
                {aiActive ? (
                  <button
                    onClick={() => void setAiRuntime(false)}
                    disabled={aiBusy}
                    className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-100 hover:bg-white/5 disabled:opacity-50"
                  >
                    {aiBusy ? "Đang tắt..." : "Tắt AI"}
                  </button>
                ) : null}
              </>
            ) : null}
            <button
              onClick={() => setReloadKey((v) => v + 1)}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-100 hover:bg-white/5"
            >
              Tải lại luồng
            </button>
            <button
              onClick={saveEvent}
              disabled={saving}
              className="rounded-2xl border border-sky-300/30 bg-sky-300/12 px-4 py-3 text-sm font-medium text-sky-100 hover:bg-sky-300/18 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu bằng chứng"}
            </button>
            {!!saveError && <div className="text-sm text-amber-300 sm:col-span-2 md:basis-full md:self-center">{saveError}</div>}
            {!!aiError && <div className="text-sm text-amber-300 sm:col-span-2 md:basis-full md:self-center">{aiError}</div>}
          </div>
        </div>

        <aside className="space-y-4 px-4 py-4 sm:px-5 md:px-6 md:py-5">
          <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Thông tin xử lý</div>
            {!aiActive ? (
              <div className="mt-3 text-sm leading-6 text-slate-300">
                AI đang tắt. Camera này chỉ phát luồng xem thường. Bật AI khi cần phát hiện và lưu sự kiện.
              </div>
            ) : (
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <div>Độ trễ: <span className="text-white">{status?.latency_ms ?? 0} ms</span></div>
                <div>Cập nhật frame: <span className="text-white">{status?.stream_last_frame_ts ? fmtDateTime(status.stream_last_frame_ts * 1000) : "--"}</span></div>
                <div>Frame đã xử lý: <span className="text-white">{status?.processed_frames ?? 0}</span></div>
                <div>Frame bỏ qua: <span className="text-white">{status?.skipped_frames ?? 0}</span></div>
                {!!status?.stream_error && <div className="pt-1 text-red-200">Lỗi: {formatError(status.stream_error)}</div>}
              </div>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Ảnh bằng chứng gần nhất</div>
              {status?.has_snapshot && snapshotSrc ? (
                <button
                  onClick={() => setSnapshotKey((v) => v + 1)}
                  className="text-xs text-sky-100 hover:text-white"
                >
                  Tải lại
                </button>
              ) : null}
            </div>
            <div className="mt-3 overflow-hidden rounded-[1.2rem] border border-white/8 bg-black">
              {status?.has_snapshot && snapshotSrc ? (
                <img src={snapshotSrc} alt={`${camera.id} snapshot`} className="h-44 w-full object-cover sm:h-48" />
              ) : (
                <div className="flex h-44 items-center justify-center px-4 text-center text-sm text-slate-500 sm:h-48">
                  Chưa có snapshot lưu gần đây cho camera này.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Cảnh báo mới tại camera này</div>
            <div className="mt-3 space-y-3">
              {latestEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-500">
                  Chưa có cảnh báo mới trong bộ nhớ tạm của hệ thống.
                </div>
              ) : (
                latestEvents.map((event, index) => (
                  <div key={`${camera.id}-${index}`} className="rounded-2xl border border-white/8 bg-slate-950/65 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${eventTone(event.type)}`}>
                        {eventLabel(event.type)}
                      </span>
                      <div className="text-sm text-slate-300">{formatPercent(event.score)}</div>
                    </div>
                    <div className="mt-3 text-sm leading-6 text-slate-300">
                      Theo dõi: <span className="text-white">{event.trackId}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
