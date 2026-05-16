import { BACKEND_HTTP } from "./config";
import type { BackendCameraItem, CameraConfig } from "./types";

const FALLBACK_LOCATIONS: Record<string, string> = {
  "cam-01": "Warehouse Gate",
  "cam-02": "Packing Area",
  "cam-03": "Loading Bay",
};

export const CAMERAS: CameraConfig[] = [
  {
    id: "cam-01",
    name: "Camera 01",
    location: FALLBACK_LOCATIONS["cam-01"],
    streamPath: buildAiVideoPath("cam-01"),
    statusPath: "/api/status?camera_id=cam-01",
    snapshotPath: "/api/snapshot?camera_id=cam-01",
    wsChannel: "cam-01",
    mediaPath: "cam-01",
    mediaViewer: "hls",
  },
  {
    id: "cam-02",
    name: "Camera 02",
    location: FALLBACK_LOCATIONS["cam-02"],
    streamPath: buildAiVideoPath("cam-02"),
    statusPath: "/api/status?camera_id=cam-02",
    snapshotPath: "/api/snapshot?camera_id=cam-02",
    wsChannel: "cam-02",
    mediaPath: "cam-02",
    mediaViewer: "hls",
  },
  {
    id: "cam-03",
    name: "Camera 03",
    location: FALLBACK_LOCATIONS["cam-03"],
    streamPath: buildAiVideoPath("cam-03"),
    statusPath: "/api/status?camera_id=cam-03",
    snapshotPath: "/api/snapshot?camera_id=cam-03",
    wsChannel: "cam-03",
    mediaPath: "cam-03",
    mediaViewer: "hls",
  },
];

function buildAiVideoPath(cameraId: string) {
  if (BACKEND_HTTP) {
    return `${BACKEND_HTTP.replace(/\/$/, "")}/video?camera_id=${encodeURIComponent(cameraId)}`;
  }
  return `/api/video?camera_id=${encodeURIComponent(cameraId)}`;
}

export function getCameraById(cameraId: string) {
  return CAMERAS.find((camera) => camera.id === cameraId);
}

export function toCameraConfig(item: BackendCameraItem): CameraConfig {
  return {
    id: item.camera_id,
    name: item.name,
    location: item.location || FALLBACK_LOCATIONS[item.camera_id] || item.name,
    streamPath: buildAiVideoPath(item.camera_id),
    statusPath: `/api/status?camera_id=${encodeURIComponent(item.camera_id)}`,
    snapshotPath: `/api/snapshot?camera_id=${encodeURIComponent(item.camera_id)}`,
    wsChannel: item.camera_id,
    mediaPath: item.media_path || item.camera_id,
    mediaViewer: item.media_viewer === "mjpeg" ? "mjpeg" : "hls",
    aiActive: Boolean(item.ai_active),
    aiAutoStart: Boolean(item.ai_auto_start),
  };
}

export function mergeBackendCameras(items?: BackendCameraItem[] | null): CameraConfig[] {
  if (!items || items.length === 0) return CAMERAS;
  return items.map(toCameraConfig);
}
