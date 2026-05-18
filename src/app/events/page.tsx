"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import EventCaptureCard from "@/components/EventCaptureCard";
import StatCard from "@/components/StatCard";
import { CAMERAS, mergeBackendCameras } from "@/lib/cameras";
import { getErrorMessage } from "@/lib/errors";
import type {
  BackendCameraItem,
  BackendEventItem,
  BackendEventsResponse,
  CameraConfig,
  EventCapture,
  EventReviewStatus,
  ReviewAuthConfigResponse,
  ReviewAuthLoginResponse,
} from "@/lib/types";

const PAGE_SIZE = 24;

function mapEvent(item: BackendEventItem): EventCapture {
  const rawType = String(item.event_type || "manual").toUpperCase();

  return {
    id: item.id,
    cameraId: item.camera_id,
    cameraName: item.camera_name || item.camera_id,
    type: rawType === "CARRYING" ? "CARRY" : rawType === "PHONE" ? "PHONE" : "MANUAL",
    ts: Number((item.ts || Date.now()) * 1000),
    fileName: item.filename || `${item.camera_id}_${Date.now()}.jpg`,
    imageUrl: `/api/events/${item.id}/image`,
    note:
      item.note ||
      `${item.source === "auto" ? "Tự động" : "Thủ công"} • ${item.event_type || "manual"}`,
    confidence: typeof item.score === "number" ? item.score : undefined,
    source: item.source,
    clipUrl: item.clip_path ? `/api/events/${item.id}/clip` : undefined,
    clipFileName: item.clip_filename || undefined,
    reviewStatus: item.review_status,
    reviewNote: item.review_note,
    reviewedBy: item.reviewed_by,
    reviewAuth: item.review_auth,
    reviewedAt: item.reviewed_at ?? null,
  };
}

export default function EventsPage() {
  const [cameras, setCameras] = useState<CameraConfig[]>(CAMERAS);
  const [events, setEvents] = useState<EventCapture[]>([]);
  const [cameraId, setCameraId] = useState<string>("all");
  const [eventType, setEventType] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [reviewStatus, setReviewStatus] = useState<string>("all");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [summary, setSummary] = useState<BackendEventsResponse["summary"]>();
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [operatorName, setOperatorName] = useState<string>(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem("warehouse-review-operator") || ""
  );
  const [authToken, setAuthToken] = useState<string>(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem("warehouse-review-token") || ""
  );
  const [authMode, setAuthMode] = useState<string>(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem("warehouse-review-auth-mode") || ""
  );
  const [pin, setPin] = useState("");
  const refreshRequestIdRef = useRef(0);

  const deferredQuery = useDeferredValue(searchText.trim());
  const reviewFilterMatches = useCallback(
    (status: string) => reviewStatus === "all" || reviewStatus === status,
    [reviewStatus]
  );

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      const requestId = refreshRequestIdRef.current + 1;
      refreshRequestIdRef.current = requestId;

      if (!options?.silent) {
        setLoading(true);
      }
      setErrorText("");

      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(page * PAGE_SIZE),
        });

        if (cameraId !== "all") params.set("camera_id", cameraId);
        if (eventType !== "all") params.set("event_type", eventType);
        if (source !== "all") params.set("source", source);
        if (reviewStatus !== "all") params.set("review_status", reviewStatus);
        if (deferredQuery) params.set("q", deferredQuery);

        const res = await fetch(`/api/events?${params.toString()}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = (await res.json()) as BackendEventsResponse;
        if (refreshRequestIdRef.current !== requestId) return;
        setSummary(data?.summary);
        setEvents((data?.items || []).map(mapEvent));
      } catch (error: unknown) {
        if (refreshRequestIdRef.current !== requestId) return;
        setEvents([]);
        setSummary(undefined);
        setErrorText(getErrorMessage(error));
      } finally {
        if (refreshRequestIdRef.current !== requestId) return;
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [cameraId, deferredQuery, eventType, page, reviewStatus, source]
  );

  const handleReviewChange = useCallback(
    async (eventId: string, nextStatus: EventReviewStatus, note: string) => {
      if (!operatorName.trim()) {
        setErrorText("Vui lòng nhập tên người xác minh trước khi chốt cảnh báo.");
        return;
      }
      setReviewingId(eventId);
      setErrorText("");
      try {
        const res = await fetch(`/api/events/${eventId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            review_status: nextStatus,
            review_note: note,
            reviewed_by: operatorName,
            review_auth_token: authToken || undefined,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as { item?: BackendEventItem; detail?: string };
        if (!res.ok || !data.item) {
          throw new Error(data.detail || `HTTP ${res.status}`);
        }

        const updated = mapEvent(data.item);
        setEvents((prev) => {
          if (!reviewFilterMatches(nextStatus)) {
            return prev.filter((event) => event.id !== eventId);
          }
          return prev.map((event) => (event.id === eventId ? updated : event));
        });
        await refresh({ silent: true });
      } catch (error: unknown) {
        setErrorText(getErrorMessage(error));
      } finally {
        setReviewingId(null);
      }
    },
    [authToken, operatorName, refresh, reviewFilterMatches]
  );

  const handleDelete = useCallback(
    async (eventId: string) => {
      setDeletingId(eventId);
      setErrorText("");
      try {
        const res = await fetch(`/api/events/${eventId}`, {
          method: "DELETE",
        });
        const data = (await res.json().catch(() => ({}))) as { detail?: string };
        if (!res.ok) {
          throw new Error(data.detail || `HTTP ${res.status}`);
        }

        setEvents((prev) => prev.filter((event) => event.id !== eventId));
        void refresh({ silent: true });
      } catch (error: unknown) {
        setErrorText(getErrorMessage(error));
      } finally {
        setDeletingId(null);
      }
    },
    [refresh]
  );

  const handleLogin = useCallback(async () => {
    setErrorText("");
    try {
      const res = await fetch("/api/review-auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operator_name: operatorName,
          pin,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<ReviewAuthLoginResponse> & { detail?: string };
      if (!res.ok || !data.token || !data.operator_name) {
        throw new Error(data.detail || `HTTP ${res.status}`);
      }
      setOperatorName(data.operator_name);
      setAuthToken(data.token);
      setAuthMode(data.auth_mode || "local");
      setPin("");
      if (typeof window !== "undefined") {
        window.localStorage.setItem("warehouse-review-token", data.token);
        window.localStorage.setItem("warehouse-review-operator", data.operator_name);
        window.localStorage.setItem("warehouse-review-auth-mode", data.auth_mode || "local");
      }
    } catch (error: unknown) {
      setErrorText(getErrorMessage(error));
    }
  }, [operatorName, pin]);

  const handleLogout = useCallback(() => {
    setAuthToken("");
    setAuthMode("");
    setPin("");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("warehouse-review-token");
      window.localStorage.removeItem("warehouse-review-operator");
      window.localStorage.removeItem("warehouse-review-auth-mode");
    }
  }, []);

  useEffect(() => {
    fetch("/api/cameras", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setCameras(mergeBackendCameras((data?.items || []) as BackendCameraItem[])))
      .catch(() => setCameras(CAMERAS));
  }, []);

  useEffect(() => {
    fetch("/api/review-auth/config", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: ReviewAuthConfigResponse) => setAuthRequired(Boolean(data?.auth_required)))
      .catch(() => setAuthRequired(false));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const total = summary?.total ?? 0;
  const pending = summary?.by_review_status?.pending ?? 0;
  const confirmed = summary?.by_review_status?.confirmed ?? 0;
  const falsePositive = summary?.by_review_status?.false_positive ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 0;
  const hasNext = (page + 1) * PAGE_SIZE < total;

  const emptyLabel = useMemo(() => {
    if (loading) return "Đang tải dữ liệu event từ backend...";
    if (errorText) return `Không tải được event: ${errorText}`;
    return "Chưa có event nào khớp bộ lọc hiện tại.";
  }, [loading, errorText]);

  return (
    <AppShell
      title="Xử lý cảnh báo"
      subtitle="Xác minh ảnh và clip do hệ thống lưu lại, ghi chú nhận định và chốt kết quả trước khi chuyển tiếp cho bảo vệ hoặc quản lý kho."
      right={
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 max-sm:w-full">
            {operatorName ? `Người xác minh: ${operatorName}${authMode ? ` (${authMode})` : ""}` : "Chưa đăng nhập người xác minh"}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 max-sm:w-full">
            Trang {page + 1}/{pageCount}
          </div>
          <button
            onClick={() => void refresh()}
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 hover:bg-white/5 max-sm:w-full"
          >
            Tải lại
          </button>
        </div>
      }
    >
      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Theo bộ lọc hiện tại" value={total} hint="Tổng số cảnh báo khớp với bộ lọc đang chọn." />
        <StatCard label="Chờ xác minh" value={pending} hint="Những cảnh báo nên được xử lý trước trong ca trực." />
        <StatCard label="Đã xác nhận" value={confirmed} hint="Cảnh báo đã được chốt là hợp lệ hoặc cần theo dõi tiếp." />
        <StatCard label="Báo nhầm" value={falsePositive} hint="Dữ liệu hữu ích để tinh chỉnh lại ngưỡng và rule." />
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-950/72 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.18)] sm:p-5">
        <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
          <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Người xác minh</div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1.1fr_0.9fr_auto_auto]">
              <input
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Tên người xác minh"
                className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder={authRequired ? "PIN bắt buộc" : "PIN nếu có"}
                type="password"
                className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <button
                onClick={() => void handleLogin()}
                className="rounded-2xl border border-sky-300/30 bg-sky-300/12 px-4 py-3 text-sm text-sky-100 hover:bg-sky-300/18"
              >
                Đăng nhập
              </button>
              <button
                onClick={handleLogout}
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-100 hover:bg-white/5"
              >
                Xóa phiên
              </button>
            </div>
            <div className="mt-3 text-sm text-slate-300">
              {authRequired
                ? "Hệ thống đang yêu cầu xác thực trước khi chốt kết quả cảnh báo."
                : "Nếu chưa bật PIN ở backend, hệ thống vẫn lưu tên người xác minh theo phiên hiện tại."}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/8 bg-white/5 px-4 py-4 text-sm text-slate-300">
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Cách xử lý</div>
            <div className="mt-3 leading-6">
              Mỗi cảnh báo có thể kèm ảnh, clip trước và sau thời điểm phát hiện. Hãy xử lý các mục chờ xác minh trước, ghi chú ngắn gọn lý do và đánh dấu báo nhầm nếu hệ thống nhận sai.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <label className="space-y-2">
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Camera</div>
            <select
              value={cameraId}
              onChange={(e) => {
                setCameraId(e.target.value);
                setPage(0);
              }}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
            >
              <option value="all">Tất cả camera</option>
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Loại cảnh báo</div>
            <select
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
                setPage(0);
              }}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
            >
              <option value="all">Tất cả loại</option>
              <option value="carrying">Nghi mang vật</option>
              <option value="phone">Dùng điện thoại</option>
              <option value="manual">Lưu thủ công</option>
            </select>
          </label>

          <label className="space-y-2">
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Nguồn lưu</div>
            <select
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setPage(0);
              }}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
            >
              <option value="all">Tất cả nguồn</option>
              <option value="auto">Tự động</option>
              <option value="manual">Thủ công</option>
            </select>
          </label>

          <label className="space-y-2">
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Kết quả xử lý</div>
            <select
              value={reviewStatus}
              onChange={(e) => {
                setReviewStatus(e.target.value);
                setPage(0);
              }}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác minh</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="false_positive">Báo nhầm</option>
              <option value="needs_review">Cần xem lại</option>
            </select>
          </label>

          <label className="space-y-2">
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Tìm nhanh</div>
            <input
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(0);
              }}
              placeholder="Tên camera, tên file, ghi chú..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-[1.5rem] border border-white/8 bg-white/5 px-4 py-4 text-sm text-slate-300 lg:flex-row lg:items-center lg:justify-between">
          <div className="leading-6">
            Người trực có thể xác nhận, đánh dấu báo nhầm hoặc để cần xem lại ngay trên từng cảnh báo để tạo dữ liệu phản hồi cho lần tinh chỉnh tiếp theo.
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <button
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              disabled={!hasPrev}
              className="rounded-2xl border border-white/10 px-3 py-3 text-sm text-slate-100 hover:bg-white/5 disabled:opacity-40"
            >
              Trang trước
            </button>
            <button
              onClick={() => setPage((value) => value + 1)}
              disabled={!hasNext}
              className="rounded-2xl border border-white/10 px-3 py-3 text-sm text-slate-100 hover:bg-white/5 disabled:opacity-40"
            >
              Trang sau
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {events.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-white/10 bg-slate-950/60 p-8 text-sm text-slate-400">
            {emptyLabel}
          </div>
        ) : (
          events.map((event) => (
            <EventCaptureCard
              key={`${event.id}:${event.reviewStatus || "pending"}:${event.reviewedAt || 0}:${event.reviewNote || ""}`}
              event={event}
              reviewBusy={reviewingId === event.id}
              deleteBusy={deletingId === event.id}
              onReviewChange={(status, note) => handleReviewChange(event.id, status, note)}
              onDelete={() => handleDelete(event.id)}
            />
          ))
        )}
      </section>
    </AppShell>
  );
}
