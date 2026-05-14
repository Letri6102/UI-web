"use client";

import { useEffect, useState } from "react";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

function sanitizePartialTime(raw: string) {
  const cleaned = raw.replace(/[^\d:]/g, "");
  const firstColon = cleaned.indexOf(":");
  if (firstColon === -1) {
    return cleaned.slice(0, 4);
  }
  const hours = cleaned.slice(0, firstColon).slice(0, 2);
  const minutes = cleaned
    .slice(firstColon + 1)
    .replace(/:/g, "")
    .slice(0, 2);
  return `${hours}:${minutes}`;
}

function normalizeTime(raw: string) {
  const compact = raw.trim();
  if (!compact) return "";

  const match = /^(\d{1,2})(?::?(\d{1,2}))?$/.exec(compact);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function splitTime(raw: string | undefined) {
  const normalized = normalizeTime(raw || "") || "00:00";
  const [hour, minute] = normalized.split(":");
  return { hour, minute };
}

type ScheduleTimeFieldProps = {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function ScheduleTimeField({
  label,
  value,
  onChange,
  disabled = false,
}: ScheduleTimeFieldProps) {
  const [draft, setDraft] = useState(value || "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  const { hour, minute } = splitTime(draft || value || "");

  function applyTime(nextHour: string, nextMinute: string) {
    const nextValue = `${nextHour}:${nextMinute}`;
    setDraft(nextValue);
    onChange(nextValue);
  }

  function handleBlur() {
    if (!draft.trim()) {
      setDraft("");
      onChange("");
      return;
    }
    const normalized = normalizeTime(draft);
    if (!normalized) {
      setDraft(value || "");
      return;
    }
    setDraft(normalized);
    onChange(normalized);
  }

  return (
    <div className={`rounded-[1.35rem] border border-white/8 bg-slate-950/55 p-3 ${disabled ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-slate-200">{label}</div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-full border border-sky-300/18 bg-sky-300/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-sky-100 transition hover:bg-sky-300/18 disabled:cursor-not-allowed"
        >
          {open ? "Ẩn list" : "Chọn nhanh"}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={draft}
          disabled={disabled}
          inputMode="numeric"
          placeholder="HH:MM"
          onChange={(e) => setDraft(sanitizePartialTime(e.target.value))}
          onBlur={handleBlur}
          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-base tracking-[0.2em] text-white outline-none placeholder:text-slate-500 focus:border-sky-300/40"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => applyTime("00", "00")}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed"
        >
          00:00
        </button>
      </div>

      {open ? (
        <div className="mt-3 rounded-[1.25rem] border border-white/8 bg-slate-950/80 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Giờ</div>
              <div className="mt-2 grid max-h-40 grid-cols-4 gap-2 overflow-y-auto pr-1 scroll-smooth">
                {HOUR_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={disabled}
                    onClick={() => applyTime(option, minute)}
                    className={`rounded-xl border px-3 py-2 text-sm transition ${
                      hour === option
                        ? "border-sky-300/40 bg-sky-300/18 text-sky-50"
                        : "border-white/8 bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Phút</div>
              <div className="mt-2 grid max-h-40 grid-cols-4 gap-2 overflow-y-auto pr-1 scroll-smooth">
                {MINUTE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={disabled}
                    onClick={() => applyTime(hour, option)}
                    className={`rounded-xl border px-3 py-2 text-sm transition ${
                      minute === option
                        ? "border-sky-300/40 bg-sky-300/18 text-sky-50"
                        : "border-white/8 bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs leading-5 text-slate-400">
            Bạn có thể gõ trực tiếp theo định dạng <span className="font-medium text-slate-300">HH:MM</span> hoặc chọn nhanh từ danh sách.
          </div>
        </div>
      ) : null}
    </div>
  );
}
