"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import { getErrorMessage } from "@/lib/errors";
import type { BackendCameraConfigsResponse, CameraTuningConfig } from "@/lib/types";

function num(value?: number) {
  return typeof value === "number" ? String(value) : "";
}

function toNumber(value: string, fallback?: number) {
  if (!value.trim()) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function SettingsPage() {
  const [configs, setConfigs] = useState<CameraTuningConfig[]>([]);
  const [serverTimezone, setServerTimezone] = useState("Asia/Ho_Chi_Minh");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setErrorText("");
    try {
      const res = await fetch("/api/camera-configs", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as BackendCameraConfigsResponse;
      setServerTimezone(data.server_timezone || "Asia/Ho_Chi_Minh");
      setConfigs(Array.isArray(data.items) ? data.items : []);
    } catch (error: unknown) {
      setConfigs([]);
      setErrorText(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const updateConfig = useCallback((cameraId: string, updater: (item: CameraTuningConfig) => CameraTuningConfig) => {
    setConfigs((prev) => prev.map((item) => (item.id === cameraId ? updater(item) : item)));
  }, []);

  const saveConfig = useCallback(
    async (cameraId: string) => {
      const target = configs.find((item) => item.id === cameraId);
      if (!target) return;
      setSavingId(cameraId);
      setErrorText("");
      try {
        const res = await fetch(`/api/camera-configs/${cameraId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ config: target }),
        });
        const data = (await res.json().catch(() => ({}))) as { item?: CameraTuningConfig; detail?: string };
        if (!res.ok || !data.item) {
          throw new Error(data.detail || `HTTP ${res.status}`);
        }
        setConfigs((prev) => prev.map((item) => (item.id === cameraId ? data.item! : item)));
      } catch (error: unknown) {
        setErrorText(getErrorMessage(error));
      } finally {
        setSavingId(null);
      }
    },
    [configs]
  );

  const onlineCount = useMemo(
    () => configs.filter((item) => item.runtime_status?.online).length,
    [configs]
  );
  const clipEnabledCount = useMemo(
    () => configs.filter((item) => item.archive?.clip_enabled).length,
    [configs]
  );
  const groupSnapshots = useMemo(() => {
    const grouped = new Map<string, NonNullable<CameraTuningConfig["runtime_status"]>["group_status"]>();
    for (const item of configs) {
      const groupName = item.runtime_status?.inference_group || item.inference_group || "default";
      const groupStatus = item.runtime_status?.group_status;
      if (groupName && groupStatus && !grouped.has(groupName)) {
        grouped.set(groupName, groupStatus);
      }
    }
    return Array.from(grouped.entries()).map(([name, status]) => ({ name, status }));
  }, [configs]);
  const healthyGroups = useMemo(
    () => groupSnapshots.filter((item) => item.status?.alive && item.status?.ready).length,
    [groupSnapshots]
  );

  return (
    <AppShell
      title="Thiết lập camera"
      subtitle="Chỉnh tên camera, vùng giám sát, ngưỡng cảnh báo và cấu hình lưu clip ngay trên giao diện. Sau khi lưu, hệ thống sẽ nạp lại cấu hình của camera đó."
      right={
        <button
          onClick={() => void refresh()}
          className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 hover:bg-white/5 max-sm:w-full"
        >
          Tải lại
        </button>
      }
    >
      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Hồ sơ camera" value={configs.length} hint="Tổng số camera trong cấu hình, gồm cả camera đang tắt." />
        <StatCard label="Camera đang chạy" value={onlineCount} hint="Camera đang bật và dịch vụ xử lý đang hoạt động." />
        <StatCard label="Có lưu clip" value={clipEnabledCount} hint="Camera đang bật lưu clip trước và sau cảnh báo." />
        <StatCard
          label="Nhóm inference ổn"
          value={loading ? "Đang đồng bộ..." : `${healthyGroups}/${groupSnapshots.length || 0}`}
          hint={errorText || "Theo dõi trực tiếp sức khỏe từng worker xử lý để phát hiện nghẽn nhóm camera."}
        />
      </section>

      <section className="rounded-[1.7rem] border border-sky-300/20 bg-sky-300/8 px-5 py-4 text-sm text-sky-50">
        Lịch bật AI đang chạy theo giờ server <span className="font-semibold">{serverTimezone}</span>. Nếu camera có đặt khung giờ,
        hệ thống sẽ tự bật hoặc tắt AI theo lịch này và sẽ ghi đè trạng thái bật tay sau vài giây đồng bộ.
      </section>

      {groupSnapshots.length > 0 ? (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {groupSnapshots.map(({ name, status }) => {
            const healthy = Boolean(status?.alive && status?.ready);
            return (
              <div
                key={name}
                className="rounded-[1.6rem] border border-white/10 bg-slate-950/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.16)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Nhóm inference</div>
                    <div className="mt-2 text-lg font-semibold text-white">{name}</div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${healthy ? "border-emerald-400/30 bg-emerald-400/12 text-emerald-100" : "border-amber-400/30 bg-amber-400/12 text-amber-100"}`}>
                    {healthy ? "Sẵn sàng" : "Cần kiểm tra"}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
                  <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">PID</div>
                    <div className="mt-1 text-base text-white">{status?.pid ?? "--"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Độ trễ EMA</div>
                    <div className="mt-1 text-base text-white">{status?.latency_ema_ms ? `${status.latency_ema_ms} ms` : "--"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Bị bỏ qua</div>
                    <div className="mt-1 text-base text-white">{status?.requests_dropped ?? 0}</div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Đang chờ</div>
                    <div className="mt-1 text-base text-white">
                      {status?.inflight_requests ?? 0}/{status?.queue_limit ?? 0}
                    </div>
                  </div>
                </div>
                {status?.last_error ? (
                  <div className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                    Lỗi gần nhất: {status.last_error}
                  </div>
                ) : null}
              </div>
            );
          })}
        </section>
      ) : null}

      <section className="space-y-5">
        {configs.map((camera) => {
          const runtimeTone = camera.runtime_status?.online
            ? "border-emerald-400/30 bg-emerald-400/12 text-emerald-100"
            : "border-red-500/30 bg-red-500/12 text-red-200";

          return (
            <article
              key={camera.id}
              className="rounded-[2rem] border border-white/10 bg-slate-950/72 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.18)] sm:p-5"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.3em] text-slate-500">{camera.id}</div>
                  <div className="mt-2 text-xl font-semibold text-white sm:text-2xl">{camera.name}</div>
                  <div className="mt-2 text-sm text-slate-300">
                    Biến RTSP: <span className="text-white">{camera.rtsp_env || "--"}</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-300">
                    Nhóm xử lý: <span className="text-white">{camera.runtime_status?.inference_group || camera.inference_group || "default"}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${runtimeTone}`}>
                    {camera.runtime_status?.online ? "Đang hoạt động" : "Đang tắt hoặc mất kết nối"}
                  </span>
                  <button
                    onClick={() => void saveConfig(camera.id)}
                    disabled={savingId === camera.id}
                    className="rounded-2xl border border-sky-300/30 bg-sky-300/12 px-4 py-3 text-sm text-sky-100 hover:bg-sky-300/18 disabled:opacity-50 max-sm:w-full"
                  >
                    {savingId === camera.id ? "Đang lưu..." : "Lưu và nạp lại"}
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-4">
                <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Thông tin chung</div>
                  <div className="mt-3 grid grid-cols-1 gap-3">
                    <label className="space-y-2 text-sm text-slate-300">
                      <div>Tên camera</div>
                      <input
                        value={camera.name || ""}
                        onChange={(e) =>
                          updateConfig(camera.id, (item) => ({ ...item, name: e.target.value }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-300">
                      <div>Nhóm inference</div>
                      <input
                        value={camera.inference_group || "default"}
                        onChange={(e) =>
                          updateConfig(camera.id, (item) => ({
                            ...item,
                            inference_group: e.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                      />
                    </label>
                    <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(camera.enabled)}
                        onChange={(e) =>
                          updateConfig(camera.id, (item) => ({ ...item, enabled: e.target.checked }))
                        }
                      />
                      <span>Bật xử lý cho camera này</span>
                    </label>
                    <label className="space-y-2 text-sm text-slate-300">
                      <div>FPS nhận luồng</div>
                      <input
                        value={num(camera.target_fps)}
                        onChange={(e) =>
                          updateConfig(camera.id, (item) => ({
                            ...item,
                            target_fps: toNumber(e.target.value, item.target_fps),
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-300">
                      <div>FPS xử lý</div>
                      <input
                        value={num(camera.process_fps)}
                        onChange={(e) =>
                          updateConfig(camera.id, (item) => ({
                            ...item,
                            process_fps: toNumber(e.target.value, item.process_fps),
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Sức khỏe xử lý</div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-300">
                    <div className="rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Độ trễ</div>
                      <div className="mt-1 text-base text-white">{camera.runtime_status?.latency_ms ? `${camera.runtime_status.latency_ms} ms` : "--"}</div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Frame bỏ qua</div>
                      <div className="mt-1 text-base text-white">{camera.runtime_status?.skipped_frames ?? 0}</div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Quá tải nhóm</div>
                      <div className="mt-1 text-base text-white">{camera.runtime_status?.busy_skips ?? 0}</div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Hàng đợi nhóm</div>
                      <div className="mt-1 text-base text-white">
                        {camera.runtime_status?.group_status?.inflight_requests ?? 0}/{camera.runtime_status?.group_status?.queue_limit ?? 0}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Lịch bật AI</div>
                  <div className="mt-3 grid grid-cols-1 gap-3">
                    <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(camera.ai_schedule?.enabled)}
                        onChange={(e) =>
                          updateConfig(camera.id, (item) => ({
                            ...item,
                            ai_schedule: {
                              enabled: e.target.checked,
                              start: item.ai_schedule?.start || "08:00",
                              end: item.ai_schedule?.end || "17:00",
                            },
                          }))
                        }
                      />
                      <span>Tự bật AI theo khung giờ</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="space-y-2 text-sm text-slate-300">
                        <div>Giờ bắt đầu</div>
                        <input
                          type="time"
                          value={camera.ai_schedule?.start || ""}
                          onChange={(e) =>
                            updateConfig(camera.id, (item) => ({
                              ...item,
                              ai_schedule: {
                                enabled: Boolean(item.ai_schedule?.enabled),
                                start: e.target.value,
                                end: item.ai_schedule?.end || "",
                              },
                            }))
                          }
                          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                        />
                      </label>
                      <label className="space-y-2 text-sm text-slate-300">
                        <div>Giờ kết thúc</div>
                        <input
                          type="time"
                          value={camera.ai_schedule?.end || ""}
                          onChange={(e) =>
                            updateConfig(camera.id, (item) => ({
                              ...item,
                              ai_schedule: {
                                enabled: Boolean(item.ai_schedule?.enabled),
                                start: item.ai_schedule?.start || "",
                                end: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                        />
                      </label>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-sm text-slate-400">
                      Ví dụ đặt `12:00` đến `13:00` thì AI của camera này chỉ detect trong khung giờ đó theo giờ server.
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Phát hiện mang vật</div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {[
                      ["checkpoint_cx_norm", "Tâm vùng X"],
                      ["checkpoint_cy_norm", "Tâm vùng Y"],
                      ["checkpoint_w_norm", "Rộng vùng"],
                      ["checkpoint_h_norm", "Cao vùng"],
                      ["carry_score_threshold", "Ngưỡng cảnh báo"],
                      ["min_baseline_frames", "Frame nền"],
                      ["bbox_width_gain", "Độ nở khung"],
                      ["fg_ratio_gain", "Độ thay đổi nền"],
                    ].map(([key, label]) => (
                      <label key={key} className="space-y-2 text-sm text-slate-300">
                        <div>{label}</div>
                        <input
                          value={num(camera.carry_guard?.[key as keyof NonNullable<CameraTuningConfig["carry_guard"]>] as number | undefined)}
                          onChange={(e) =>
                            updateConfig(camera.id, (item) => ({
                              ...item,
                              carry_guard: {
                                ...(item.carry_guard || {}),
                                [key]: toNumber(
                                  e.target.value,
                                  item.carry_guard?.[key as keyof NonNullable<CameraTuningConfig["carry_guard"]>] as number | undefined
                                ),
                              },
                            }))
                          }
                          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                        />
                      </label>
                    ))}
                    <label className="space-y-2 text-sm text-slate-300">
                      <div>Hướng đi vào</div>
                      <select
                        value={camera.carry_guard?.checkpoint_entry_side || ""}
                        onChange={(e) =>
                          updateConfig(camera.id, (item) => ({
                            ...item,
                            carry_guard: {
                              ...(item.carry_guard || {}),
                              checkpoint_entry_side: e.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                      >
                        <option value="">Tự động</option>
                        <option value="left">Trái</option>
                        <option value="right">Phải</option>
                        <option value="top">Trên</option>
                        <option value="bottom">Dưới</option>
                      </select>
                    </label>
                    <label className="space-y-2 text-sm text-slate-300">
                      <div>Hướng đi ra</div>
                      <select
                        value={camera.carry_guard?.checkpoint_exit_side || "right"}
                        onChange={(e) =>
                          updateConfig(camera.id, (item) => ({
                            ...item,
                            carry_guard: {
                              ...(item.carry_guard || {}),
                              checkpoint_exit_side: e.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                      >
                        <option value="left">Trái</option>
                        <option value="right">Phải</option>
                        <option value="top">Trên</option>
                        <option value="bottom">Dưới</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Điện thoại và lưu bằng chứng</div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {[
                      ["min_phone_conf", "Ngưỡng điện thoại"],
                      ["confirm_frames", "Frame xác nhận"],
                      ["release_misses", "Frame bỏ qua"],
                      ["event_cooldown_sec", "Thời gian nghỉ"],
                    ].map(([key, label]) => (
                      <label key={key} className="space-y-2 text-sm text-slate-300">
                        <div>{label}</div>
                        <input
                          value={num(camera.phone_detector?.[key as keyof NonNullable<CameraTuningConfig["phone_detector"]>] as number | undefined)}
                          onChange={(e) =>
                            updateConfig(camera.id, (item) => ({
                              ...item,
                              phone_detector: {
                                ...(item.phone_detector || {}),
                                [key]: toNumber(
                                  e.target.value,
                                  item.phone_detector?.[key as keyof NonNullable<CameraTuningConfig["phone_detector"]>] as number | undefined
                                ),
                              },
                            }))
                          }
                          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                        />
                      </label>
                    ))}
                    <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(camera.archive?.clip_enabled)}
                        onChange={(e) =>
                          updateConfig(camera.id, (item) => ({
                            ...item,
                            archive: {
                              ...(item.archive || {}),
                              clip_enabled: e.target.checked,
                            },
                          }))
                        }
                      />
                      <span>Bật clip event</span>
                    </label>
                    <label className="space-y-2 text-sm text-slate-300">
                      <div>Số giây trước cảnh báo</div>
                      <input
                        value={num(camera.archive?.clip_pre_seconds)}
                        onChange={(e) =>
                          updateConfig(camera.id, (item) => ({
                            ...item,
                            archive: {
                              ...(item.archive || {}),
                              clip_pre_seconds: toNumber(e.target.value, item.archive?.clip_pre_seconds),
                            },
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-300">
                      <div>Số giây sau cảnh báo</div>
                      <input
                        value={num(camera.archive?.clip_post_seconds)}
                        onChange={(e) =>
                          updateConfig(camera.id, (item) => ({
                            ...item,
                            archive: {
                              ...(item.archive || {}),
                              clip_post_seconds: toNumber(e.target.value, item.archive?.clip_post_seconds),
                            },
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-300">
                      <div>Định dạng clip</div>
                      <input
                        value={camera.archive?.clip_codec || "mp4v"}
                        onChange={(e) =>
                          updateConfig(camera.id, (item) => ({
                            ...item,
                            archive: {
                              ...(item.archive || {}),
                              clip_codec: e.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Xem trực tiếp trên web</div>
                  <div className="mt-3 grid grid-cols-1 gap-3">
                    <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(camera.media?.enabled)}
                        onChange={(e) =>
                          updateConfig(camera.id, (item) => ({
                            ...item,
                            media: {
                              ...(item.media || {}),
                              enabled: e.target.checked,
                            },
                          }))
                        }
                      />
                      <span>Bật WebRTC qua MediaMTX</span>
                    </label>
                    <label className="space-y-2 text-sm text-slate-300">
                      <div>Đường dẫn media</div>
                      <input
                        value={camera.media?.path || camera.id}
                        onChange={(e) =>
                          updateConfig(camera.id, (item) => ({
                            ...item,
                            media: {
                              ...(item.media || {}),
                              path: e.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-300">
                      <div>Chế độ xem</div>
                      <select
                        value={camera.media?.viewer || "hls"}
                        onChange={(e) =>
                          updateConfig(camera.id, (item) => ({
                            ...item,
                            media: {
                              ...(item.media || {}),
                              viewer: e.target.value as "hls" | "webrtc" | "mjpeg",
                            },
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                      >
                        <option value="hls">HLS</option>
                        <option value="mjpeg">MJPEG fallback</option>
                      </select>
                    </label>
                    <div className="rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-sm text-slate-400">
                      Mỗi camera sẽ map sang `http://MEDIA_MTX_HOST:8888/{camera.media?.path || camera.id}/index.m3u8` theo HLS của MediaMTX.
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </AppShell>
  );
}
