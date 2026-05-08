"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addEventCapture } from "@/lib/eventStore";
import { getCameraById } from "@/lib/cameras";
import { MonitorEvent } from "@/lib/types";
import { BACKEND_WS } from "@/lib/config";

type Options = {
  maxEvents?: number;
  persistCaptures?: boolean;
};

export function useEventStream(opts: Options = {}) {
  const maxEvents = opts.maxEvents ?? 200;
  const persistCaptures = opts.persistCaptures ?? true;
  const [events, setEvents] = useState<MonitorEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const pushEvent = useCallback(
    (ev: MonitorEvent) => {
      const enriched = {
        ...ev,
        id: ev.id || `${ev.camera_id}-${ev.type}-${ev.ts || Date.now()}`,
        ts: ev.ts || Date.now(),
      };

      setEvents((prev) => [enriched, ...prev].slice(0, maxEvents));

      if (persistCaptures && (enriched.type === "PHONE" || enriched.type === "CARRY")) {
        const camera = getCameraById(enriched.camera_id);
        addEventCapture({
          cameraId: enriched.camera_id,
          cameraName: camera?.name || enriched.camera_name || enriched.camera_id,
          type: enriched.type,
          ts: enriched.ts,
          imageUrl:
            enriched.snapshot_url ||
            (enriched.snapshot_b64
              ? enriched.snapshot_b64.startsWith("data:")
                ? enriched.snapshot_b64
                : `data:image/jpeg;base64,${enriched.snapshot_b64}`
              : undefined),
          confidence: enriched.confidence,
          note: enriched.message,
        });
      }
    },
    [maxEvents, persistCaptures]
  );

  useEffect(() => {
    let isMounted = true;
    try {
      const ws = new WebSocket(BACKEND_WS);
      wsRef.current = ws;
      ws.onopen = () => isMounted && setConnected(true);
      ws.onclose = () => isMounted && setConnected(false);
      ws.onerror = () => isMounted && setConnected(false);
      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (Array.isArray(data)) data.forEach(pushEvent);
          else pushEvent(data);
        } catch {}
      };
      return () => {
        isMounted = false;
        ws.close();
      };
    } catch {}
  }, [pushEvent]);

  const countByCamera = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of events) {
      if (e.type === "COUNT") map[e.camera_id] = (map[e.camera_id] ?? 0) + (e.delta ?? 0);
    }
    return map;
  }, [events]);

  return { events, connected, countByCamera };
}
