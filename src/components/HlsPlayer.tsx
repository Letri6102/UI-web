"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  className?: string;
};

export default function HlsPlayer({ src, className }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) {
      return;
    }

    let disposed = false;
    let hlsInstance: { destroy: () => void } | null = null;

    async function setup() {
      const currentVideo = videoRef.current;
      if (!currentVideo) {
        return;
      }

      if (currentVideo.canPlayType("application/vnd.apple.mpegurl")) {
        currentVideo.src = src;
        void currentVideo.play().catch(() => {
          // Ignore autoplay failures.
        });
        return;
      }

      const mod = await import("hls.js");
      if (disposed) {
        return;
      }

      const HlsCtor = mod.default;
      if (!HlsCtor.isSupported()) {
        return;
      }

      const hls = new HlsCtor({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(src);
      hls.attachMedia(currentVideo);
      hls.on(HlsCtor.Events.MANIFEST_PARSED, () => {
        void currentVideo.play().catch(() => {
          // Ignore autoplay failures.
        });
      });
      hlsInstance = hls;
    }

    void setup();

    return () => {
      disposed = true;
      if (hlsInstance) {
        hlsInstance.destroy();
      }
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [src]);

  return <video ref={videoRef} className={className} controls muted playsInline autoPlay />;
}
