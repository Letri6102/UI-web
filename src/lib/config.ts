function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function resolveBrowserOrigin() {
  if (typeof window === "undefined") {
    return "";
  }
  return trimTrailingSlash(window.location.origin);
}

function resolveBackendHttp() {
  const configured = process.env.NEXT_PUBLIC_BACKEND_HTTP?.trim();
  if (configured) {
    return trimTrailingSlash(configured);
  }
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:8000";
  }
  return resolveBrowserOrigin();
}

function resolveBackendWs() {
  const configured = process.env.NEXT_PUBLIC_BACKEND_WS?.trim();
  if (configured) {
    return trimTrailingSlash(configured);
  }

  const httpBase = resolveBackendHttp();
  if (!httpBase) {
    return "";
  }

  if (httpBase.startsWith("https://")) {
    return `${httpBase.replace(/^https:\/\//, "wss://")}/ws/events`;
  }
  if (httpBase.startsWith("http://")) {
    return `${httpBase.replace(/^http:\/\//, "ws://")}/ws/events`;
  }
  return `${httpBase}/ws/events`;
}

function resolveMediaMtxBase() {
  const configured = process.env.NEXT_PUBLIC_MEDIA_MTX_WEBRTC_BASE?.trim();
  if (configured) {
    return trimTrailingSlash(configured);
  }
  if (process.env.NODE_ENV !== "production") {
    return "http://127.0.0.1:8889";
  }
  return resolveBrowserOrigin();
}

export const BACKEND_HTTP = resolveBackendHttp();
export const BACKEND_WS = resolveBackendWs();
export const MEDIA_MTX_WEBRTC_BASE = resolveMediaMtxBase();
