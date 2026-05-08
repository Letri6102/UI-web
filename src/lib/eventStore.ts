"use client";

import { EventCapture } from "./types";

const KEY = "warehouse_monitor_event_captures_v1";

function uid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function safeParse(s: string | null): EventCapture[] {
  if (!s) return [];
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function readEventCaptures(): EventCapture[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(KEY)).sort((a, b) => b.ts - a.ts);
}

export function writeEventCaptures(events: EventCapture[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(events.slice(0, 1000)));
  localStorage.setItem(`${KEY}_ping`, String(Date.now()));
}

export function buildEventFileName(cameraId: string, ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  const formatted = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `${cameraId}_${formatted}.jpg`;
}

export function addEventCapture(input: Omit<EventCapture, "id" | "fileName"> & { fileName?: string }) {
  const item: EventCapture = {
    ...input,
    id: uid(),
    fileName: input.fileName || buildEventFileName(input.cameraId, input.ts),
  };

  const current = readEventCaptures();
  current.unshift(item);
  writeEventCaptures(current);
  return item;
}

export function clearEventCaptures() {
  writeEventCaptures([]);
}
