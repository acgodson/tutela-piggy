import { useState, useRef, useCallback, useEffect } from "react";
import { Detection, Alert, HederaReceipt } from "@/types";

interface DetectionStats {
  fps: number;
  processing_time: number;
}

interface UseDetectionProps {
  expectedPigCount: number;
  captureFrame: () => string | null;
  getCanvasContext: () => CanvasRenderingContext2D | null | undefined;
  isStreaming: boolean;
}

export const useDetection = ({
  expectedPigCount,
  captureFrame,
  getCanvasContext,
  isStreaming,
}: UseDetectionProps) => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [hederaReceipts, setHederaReceipts] = useState<HederaReceipt[]>([]);
  const [stats, setStats] = useState<DetectionStats>({
    fps: 0,
    processing_time: 0,
  });
  const [hederaEnabled, setHederaEnabled] = useState(false);

  const frameIdRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const drawDetections = useCallback(
    (ctx: CanvasRenderingContext2D, dets: Detection[]) => {
      dets.forEach((det) => {
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 3;
        ctx.strokeRect(det.x, det.y, det.width, det.height);

        const label = `#${det.track_id || "?"}`;
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(det.x, det.y - 24, 50, 24);
        ctx.fillStyle = "#000";
        ctx.font = "bold 14px system-ui";
        ctx.fillText(label, det.x + 6, det.y - 7);
      });
    },
    []
  );

  const processFrame = useCallback(async () => {
    const imageData = captureFrame();
    const ctx = getCanvasContext();

    if (!imageData || !ctx) return;

    try {
      const response = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageData,
          frame_id: frameIdRef.current++,
          timestamp: Date.now() / 1000,
          expected_pig_count: expectedPigCount,
        }),
      });

      const data = await response.json();

      setDetections(data.detections || []);
      setStats({
        fps: data.fps || 0,
        processing_time: data.processing_time || 0,
      });

      if (data.alerts && data.alerts.length > 0) {
        setAlerts((prev) => [...data.alerts, ...prev].slice(0, 50));
      }

      if (data.hedera_receipts) {
        setHederaReceipts((prev) =>
          [...data.hedera_receipts, ...prev].slice(0, 50)
        );
      }

      if (data.hedera_enabled) {
        setHederaEnabled(true);
      }

      drawDetections(ctx, data.detections || []);
    } catch (error) {
      console.error("Detection error:", error);
    }
  }, [captureFrame, getCanvasContext, expectedPigCount, drawDetections]);

  const startDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(processFrame, 1000);
  }, [processFrame]);

  const stopDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isStreaming) {
      startDetection();
    } else {
      stopDetection();
    }

    return () => {
      stopDetection();
    };
  }, [isStreaming, startDetection, stopDetection]);

  return {
    detections,
    alerts,
    hederaReceipts,
    stats,
    hederaEnabled,
    startDetection,
    stopDetection,
  };
};
