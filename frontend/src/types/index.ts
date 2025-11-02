"use client";

interface Detection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class_name: string;
  track_id?: number;
}

interface Alert {
  alert_type: "count_mismatch" | "inactivity_alert";
  severity: "high" | "medium";
  timestamp: string;
  pig_id?: number;
  expected_count?: number;
  detected_count?: number;
  risk: string;
  action: string;
}

interface HederaReceipt {
  success: boolean;
  topic_id?: string;
  sequence?: number;
  error?: string;
}

type TabType = "live" | "upload";
type VideoSource = "camera" | "file";


export type {Detection, Alert, HederaReceipt, TabType, VideoSource}