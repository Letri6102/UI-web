export function fmtDateTime(ts?: number) {
  if (!ts) return "--";
  return new Date(ts).toLocaleString("vi-VN");
}

export function fmtRelativeTime(ts?: number) {
  if (!ts) return "--";
  const diffMs = Date.now() - ts;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin <= 0) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.round(diffHour / 24);
  return `${diffDay} ngày trước`;
}

export function formatPercent(score?: number | null) {
  if (typeof score !== "number" || Number.isNaN(score)) return "--";
  return `${Math.round(score * 100)}%`;
}

export function eventLabel(type?: string) {
  const value = String(type || "").trim().toLowerCase();
  if (value === "carrying" || value === "carry") return "Nghi mang vật";
  if (value === "phone") return "Dùng điện thoại";
  if (value === "manual") return "Lưu thủ công";
  return value ? value[0].toUpperCase() + value.slice(1) : "Sự kiện";
}

export function eventTone(type?: string) {
  const value = String(type || "").trim().toLowerCase();
  if (value === "carrying" || value === "carry") return "border-red-500/30 bg-red-500/12 text-red-200";
  if (value === "phone") return "border-amber-400/30 bg-amber-400/12 text-amber-100";
  return "border-sky-400/30 bg-sky-400/12 text-sky-100";
}

export function reviewStatusLabel(status?: string) {
  const value = String(status || "pending").trim().toLowerCase();
  if (value === "confirmed") return "Đã xác nhận";
  if (value === "false_positive") return "Báo nhầm";
  if (value === "needs_review") return "Cần xem lại";
  return "Chờ xác minh";
}

export function reviewStatusTone(status?: string) {
  const value = String(status || "pending").trim().toLowerCase();
  if (value === "confirmed") return "border-emerald-400/30 bg-emerald-400/12 text-emerald-100";
  if (value === "false_positive") return "border-rose-400/30 bg-rose-400/12 text-rose-100";
  if (value === "needs_review") return "border-amber-400/30 bg-amber-400/12 text-amber-100";
  return "border-sky-400/30 bg-sky-400/12 text-sky-100";
}

export function statusTone(ok?: boolean, error?: string) {
  if (error) return "text-red-400";
  if (ok) return "text-emerald-400";
  return "text-amber-400";
}
