"use client";

import { useMemo, useState } from "react";
import { EventCapture, EventReviewStatus } from "@/lib/types";
import {
  eventLabel,
  eventTone,
  fmtDateTime,
  fmtRelativeTime,
  formatPercent,
  reviewStatusLabel,
  reviewStatusTone,
} from "@/lib/format";

type Props = {
  event: EventCapture;
  reviewBusy?: boolean;
  deleteBusy?: boolean;
  onReviewChange?: (status: EventReviewStatus, note: string) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
};

const REVIEW_ACTIONS: Array<{ status: EventReviewStatus; label: string }> = [
  { status: "confirmed", label: "Xác nhận" },
  { status: "false_positive", label: "Báo nhầm" },
  { status: "needs_review", label: "Xem lại" },
];

export default function EventCaptureCard({
  event,
  reviewBusy = false,
  deleteBusy = false,
  onReviewChange,
  onDelete,
}: Props) {
  const [noteDraft, setNoteDraft] = useState(() => event.reviewNote || "");
  const [showClip, setShowClip] = useState(false);

  const currentReviewStatus = (event.reviewStatus || "pending") as EventReviewStatus;
  const noteDirty = noteDraft.trim() !== String(event.reviewNote || "").trim();
  const reviewedText = useMemo(() => {
    if (!event.reviewedAt) return "Chưa có lượt review nào";
    return fmtDateTime(event.reviewedAt * 1000);
  }, [event.reviewedAt]);

  return (
    <article className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-slate-950/70 shadow-[0_20px_55px_rgba(0,0,0,0.2)]">
      <div className="aspect-video bg-black">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.fileName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Chưa có ảnh snapshot từ backend
          </div>
        )}
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-base font-semibold text-white">{event.cameraName}</div>
            <div className="text-xs text-slate-500">{event.fileName}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${eventTone(event.type)}`}>
              {eventLabel(event.type)}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${reviewStatusTone(currentReviewStatus)}`}>
              {reviewStatusLabel(currentReviewStatus)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <div>{fmtDateTime(event.ts)}</div>
          <div className="text-slate-500">{fmtRelativeTime(event.ts)}</div>
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Mức tin cậy</div>
            <div className="mt-2 text-white">{formatPercent(event.confidence)}</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Nguồn lưu</div>
            <div className="mt-2 text-white">{event.source === "manual" ? "Thủ công" : event.source === "auto" ? "Tự động" : "--"}</div>
          </div>
        </div>

        {event.note ? <div className="text-sm leading-6 text-slate-300">{event.note}</div> : null}

        <div className="rounded-[1.4rem] border border-white/8 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Kết quả xử lý</div>
            <div className="text-xs text-slate-400">{reviewedText}</div>
          </div>
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            rows={3}
            placeholder="Ghi chú nhanh cho event này..."
            className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
          />
          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {REVIEW_ACTIONS.map((action) => (
              <button
                key={action.status}
                onClick={() => onReviewChange?.(action.status, noteDraft)}
                disabled={!onReviewChange || reviewBusy}
                className="rounded-2xl border border-white/10 px-3 py-3 text-sm text-slate-100 hover:bg-white/5 disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
            <button
              onClick={() => onReviewChange?.("pending", noteDraft)}
              disabled={!onReviewChange || reviewBusy}
              className="rounded-2xl border border-sky-300/25 bg-sky-300/12 px-3 py-3 text-sm text-sky-100 hover:bg-sky-300/18 disabled:opacity-50"
            >
              Đặt lại
            </button>
            {noteDirty ? (
              <button
                onClick={() => onReviewChange?.(currentReviewStatus, noteDraft)}
                disabled={!onReviewChange || reviewBusy}
                className="col-span-2 rounded-2xl border border-emerald-400/25 bg-emerald-400/12 px-3 py-3 text-sm text-emerald-100 hover:bg-emerald-400/18 disabled:opacity-50 sm:col-auto"
              >
                Lưu ghi chú
              </button>
            ) : null}
          </div>
          {event.reviewNote ? (
            <div className="mt-3 text-sm leading-6 text-slate-300">
              Ghi chú hiện tại: <span className="text-white">{event.reviewNote}</span>
            </div>
          ) : null}
          {event.reviewedBy ? (
            <div className="mt-2 text-sm leading-6 text-slate-300">
              Người xác minh: <span className="text-white">{event.reviewedBy}</span>
              {event.reviewAuth ? <span className="text-slate-500"> • xác thực: {event.reviewAuth}</span> : null}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
          {event.imageUrl ? (
            <a
              href={event.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-3 py-3 text-sm text-slate-100 hover:bg-white/5"
            >
              Mở ảnh
            </a>
          ) : null}
          {event.imageUrl ? (
            <a
              href={event.imageUrl}
              download={event.fileName}
              className="inline-flex items-center justify-center rounded-2xl border border-sky-300/25 bg-sky-300/12 px-3 py-3 text-sm text-sky-100 hover:bg-sky-300/18"
            >
              Tải ảnh
            </a>
          ) : null}
          {event.clipUrl ? (
            <button
              type="button"
              onClick={() => setShowClip((value) => !value)}
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/12 px-3 py-3 text-sm text-emerald-100 hover:bg-emerald-400/18"
            >
              {showClip ? "Ẩn clip" : "Xem clip"}
            </button>
          ) : null}
          {event.clipUrl ? (
            <a
              href={event.clipUrl}
              download={event.clipFileName || `${event.id}.mp4`}
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-400/20 px-3 py-3 text-sm text-emerald-100 hover:bg-emerald-400/10"
            >
              Tải clip
            </a>
          ) : null}
          <button
            onClick={() => {
              if (!onDelete) return;
              if (typeof window !== "undefined") {
                const accepted = window.confirm("Xoá ảnh và clip của cảnh báo này khỏi kho lưu trữ?");
                if (!accepted) return;
              }
              void onDelete();
            }}
            disabled={!onDelete || deleteBusy}
            className="col-span-2 inline-flex items-center justify-center rounded-2xl border border-red-400/25 bg-red-500/10 px-3 py-3 text-sm text-red-100 hover:bg-red-500/16 disabled:opacity-50 sm:col-auto"
          >
            {deleteBusy ? "Đang xoá..." : "Xoá khỏi kho"}
          </button>
        </div>
        {event.clipUrl && showClip ? (
          <div className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-black">
            <video
              controls
              preload="metadata"
              playsInline
              className="block aspect-video w-full"
              src={event.clipUrl}
            >
              Trình duyệt không phát được clip này.
            </video>
          </div>
        ) : null}
      </div>
    </article>
  );
}
