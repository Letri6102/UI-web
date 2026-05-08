export type LogLevel = "INFO" | "WARN" | "ERROR";
export type EventReviewStatus = "pending" | "confirmed" | "false_positive" | "needs_review";

export type LogEntry = {
  id: string;
  ts: number;
  level: LogLevel;
  source: "camera" | "upload" | "system" | "events";
  message: string;
  data?: Record<string, unknown>;
};

export type CameraConfig = {
  id: string;
  name: string;
  location: string;
  streamPath: string;
  statusPath: string;
  snapshotPath?: string;
  wsChannel?: string;
  mediaPath?: string;
  mediaViewer?: "webrtc" | "mjpeg";
};

export type BackendCameraItem = {
  camera_id: string;
  name: string;
  location?: string;
  media_path?: string;
  media_viewer?: "webrtc" | "mjpeg" | string;
};

export type RuntimeStatusSummary = {
  online: boolean;
  stream_error?: string;
  latency_ms?: number;
  has_snapshot?: boolean;
  inference_group?: string;
  skipped_frames?: number;
  busy_skips?: number;
  group_status?: InferenceGroupStatusSummary | null;
};

export type InferenceGroupStatusSummary = {
  group_name?: string;
  alive?: boolean;
  ready?: boolean;
  pid?: number | null;
  requests_submitted?: number;
  requests_completed?: number;
  requests_failed?: number;
  requests_timed_out?: number;
  requests_dropped?: number;
  busy_rejections?: number;
  inflight_requests?: number;
  queue_limit?: number;
  latency_ema_ms?: number;
  last_latency_ms?: number;
  last_error?: string;
};

export type CameraArchiveConfig = {
  clip_enabled?: boolean;
  clip_pre_seconds?: number;
  clip_post_seconds?: number;
  clip_codec?: string;
};

export type CameraMediaConfig = {
  enabled?: boolean;
  path?: string;
  viewer?: "webrtc" | "mjpeg";
};

export type CameraCarryGuardConfig = {
  checkpoint_cx_norm?: number;
  checkpoint_cy_norm?: number;
  checkpoint_w_norm?: number;
  checkpoint_h_norm?: number;
  checkpoint_entry_side?: string;
  checkpoint_exit_side?: string;
  min_baseline_frames?: number;
  min_suspicious_frames?: number;
  carry_score_threshold?: number;
  bbox_width_gain?: number;
  fg_ratio_gain?: number;
  exit_overlap_ratio?: number;
};

export type CameraPhoneDetectorConfig = {
  min_phone_conf?: number;
  confirm_frames?: number;
  release_misses?: number;
  event_cooldown_sec?: number;
};

export type CameraTuningConfig = {
  id: string;
  name: string;
  enabled?: boolean;
  inference_group?: string;
  source_type?: string;
  rtsp_env?: string;
  rtsp_transport?: string;
  target_fps?: number;
  process_fps?: number;
  carry_guard?: CameraCarryGuardConfig;
  phone_detector?: CameraPhoneDetectorConfig;
  archive?: CameraArchiveConfig;
  media?: CameraMediaConfig;
  runtime_status?: RuntimeStatusSummary | null;
};

export type CameraStatus = {
  ok?: boolean;
  camera_id?: string;
  name?: string;
  alarm?: boolean;
  count?: number;
  carry_events?: number;
  phone_events?: number;
  latency_ms?: number;
  stream_ready?: boolean;
  stream_error?: string;
  stream_source?: string;
  stream_frames?: number;
  stream_last_frame_ts?: number;
  processed_frames?: number;
  processed_last_ts?: number;
  skipped_frames?: number;
  busy_skips?: number;
  inference_group?: string;
  has_snapshot?: boolean;
  last_events?: Array<Record<string, unknown>>;
  group_status?: InferenceGroupStatusSummary | null;
  updated_at?: number;
};

export type MonitorEventType = "PHONE" | "CARRY" | "COUNT" | "SYSTEM";

export type MonitorEvent = {
  id?: string;
  ts?: number;
  camera_id: string;
  camera_name?: string;
  type: MonitorEventType;
  confidence?: number;
  delta?: number;
  message?: string;
  snapshot_url?: string;
  snapshot_b64?: string;
  file_name?: string;
};

export type BackendEventItem = {
  id: string;
  camera_id: string;
  camera_name?: string;
  event_type?: string;
  ts?: number;
  filename?: string;
  image_path?: string;
  image_url?: string;
  clip_filename?: string;
  clip_path?: string;
  source?: string;
  score?: number;
  note?: string;
  review_status?: EventReviewStatus | string;
  review_note?: string;
  reviewed_by?: string;
  review_auth?: string;
  reviewed_at?: number | null;
  extra?: Record<string, unknown>;
};

export type BackendEventSummary = {
  total: number;
  by_type: Record<string, number>;
  by_source: Record<string, number>;
  by_review_status?: Record<string, number>;
};

export type BackendEventsResponse = {
  status: string;
  filters?: {
    camera_id?: string | null;
    event_type?: string | null;
    source?: string | null;
    review_status?: string | null;
    q?: string | null;
    limit?: number;
    offset?: number;
  };
  summary?: BackendEventSummary;
  items: BackendEventItem[];
};

export type BackendCameraConfigsResponse = {
  ok: boolean;
  items: CameraTuningConfig[];
};

export type ReviewAuthConfigResponse = {
  ok: boolean;
  auth_required: boolean;
};

export type ReviewAuthLoginResponse = {
  ok: boolean;
  operator_name: string;
  auth_mode: string;
  token: string;
  auth_required: boolean;
};

export type EventCapture = {
  id: string;
  cameraId: string;
  cameraName: string;
  type: "PHONE" | "CARRY" | "MANUAL";
  ts: number;
  fileName: string;
  imageUrl?: string;
  note?: string;
  confidence?: number;
  source?: string;
  clipUrl?: string;
  clipFileName?: string;
  reviewStatus?: EventReviewStatus | string;
  reviewNote?: string;
  reviewedBy?: string;
  reviewAuth?: string;
  reviewedAt?: number | null;
};
