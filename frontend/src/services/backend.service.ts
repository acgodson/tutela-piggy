
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:8002";

export interface DetectionRequest {
  image: string;
  frame_id: number;
  timestamp: number;
}

export interface DetectionResponse {
  detections: any[];
  fps?: number;
  processing_time?: number;
  [key: string]: any;
}

export interface Detection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class_name: string;
  track_id: number;
  has_mask: boolean;
  mask_area?: number;
  pig_color_id?: string;
  marker_colors: string[];
  pig_number?: number;
  number_confidence?: number;
}

export interface AnnotatedDetectionResponse {
  annotated_image: string;
  detections: Detection[];
  processing_time: number;
  fps: number;
  pig_count: number;
}

export interface PigTrackingSummary {
  batch_id: string;
  total_frames: number;
  identified_pigs: Record<string, {
    appearances: number;
    avg_confidence: number;
  }>;
}

export interface VideoProcessingResult {
  batch_id: string;
  total_frames: number;
  processed_frames: number;
  target_fps: number;
  status: string;
  results: FrameData[];
  total_processing_time: number;
  pig_tracking_summary: PigTrackingSummary;
  message: string;
}

export interface FrameData {
  frame_id: number;
  timestamp: number;
  detections: Detection[];
  annotated_image: string;
  processing_time: number;
}

export interface PigColorLegend {
  colors: Record<number, { rgb: number[]; hex: string }>;
  neutral: { rgb: number[]; hex: string };
  description: string;
}

export interface HealthResponse {
  status: string;
  model_loaded?: boolean;
  active_tracks?: number;
  timestamp?: string;
  [key: string]: any;
}

export interface ModelInfo {
  model_type: string;
  task: string;
  accuracy: {
    mAP50: number;
    mAP50_95: number;
    training_epochs: number;
  };
  classes: Record<string, string>;
  input_size: number;
  improvements: Record<string, any>;
}

export class BackendService {
  private endpoint: string;

  constructor(endpoint?: string) {
    this.endpoint = endpoint || API_ENDPOINT;
  }

  async detectFrame(request: DetectionRequest): Promise<DetectionResponse> {
    const response = await fetch(`${this.endpoint}/detect/frame`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Backend processing failed: ${response.status}`);
    }

    return response.json();
  }

  async detectImageFile(file: File): Promise<DetectionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.endpoint}/detect/image`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Image detection failed: ${response.status}`);
    }

    return response.json();
  }

  async detectImageAnnotated(file: File): Promise<AnnotatedDetectionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.endpoint}/detect/image/annotated`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Annotated detection failed: ${response.status}`);
    }

    return response.json();
  }

  async detectImageFromBase64(imageBase64: string): Promise<AnnotatedDetectionResponse> {
    const response = await fetch(imageBase64);
    const blob = await response.blob();
    const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
    
    return this.detectImageAnnotated(file);
  }

  async checkHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.endpoint}/health`);

    if (!response.ok) {
      throw new Error("Cannot connect to backend");
    }

    return response.json();
  }

  async getModelInfo(): Promise<ModelInfo> {
    const response = await fetch(`${this.endpoint}/model/info`);

    if (!response.ok) {
      throw new Error("Cannot get model info");
    }

    return response.json();
  }

  createWebSocket(): WebSocket {
    const wsUrl = this.endpoint.replace('http://', 'ws://').replace('https://', 'wss://');
    return new WebSocket(`${wsUrl}/ws/detect`);
  }

  getEndpoint(): string {
    return this.endpoint;
  }

  // Process video via Next.js API (secure proxy to EC2)
  async processVideo(file: File, targetFps: number = 2): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_fps', targetFps.toString());

    const response = await fetch('/api/video/process', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Video processing failed: ${response.status}`);
    }

    return response.json();
  }

  // Process video synchronously (immediate results)
  async processVideoSync(file: File, targetFps: number = 2): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_fps', targetFps.toString());

    const response = await fetch('/api/video/process', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Video processing failed: ${response.status}`);
    }

    return response.json();
  }

  // Get video processing status
  async getVideoStatus(connectionId: string): Promise<any> {
    const response = await fetch(`/api/video/status/${connectionId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get video status: ${response.status}`);
    }

    return response.json();
  }

  // Enhanced detection using Next.js API (includes pig identification and database storage)
  async detectImageEnhanced(file: File, camera_id?: string, include_annotated: boolean = false): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (camera_id) formData.append('camera_id', camera_id);
    if (include_annotated) formData.append('include_annotated', 'true');

    const response = await fetch('/api/detect', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Enhanced detection failed: ${response.status}`);
    }

    return response.json();
  }

  // Get pig registry
  async getPigRegistry(): Promise<any> {
    const response = await fetch('/api/pigs');
    
    if (!response.ok) {
      throw new Error(`Failed to get pig registry: ${response.status}`);
    }

    return response.json();
  }

  // Register a new pig
  async registerPig(pigData: any): Promise<any> {
    const response = await fetch('/api/pigs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pigData),
    });

    if (!response.ok) {
      throw new Error(`Failed to register pig: ${response.status}`);
    }

    return response.json();
  }

  // Get alerts
  async getAlerts(): Promise<any> {
    const response = await fetch('/api/alerts');
    
    if (!response.ok) {
      throw new Error(`Failed to get alerts: ${response.status}`);
    }

    return response.json();
  }

  // Get video sessions
  async getVideoSessions(): Promise<any> {
    const response = await fetch('/api/video/sessions');

    if (!response.ok) {
      throw new Error(`Failed to get video sessions: ${response.status}`);
    }

    return response.json();
  }

  // Get pig color legend for UI display
  async getPigColorLegend(): Promise<PigColorLegend> {
    const response = await fetch(`${this.endpoint}/pig/colors`);

    if (!response.ok) {
      throw new Error(`Failed to get pig colors: ${response.status}`);
    }

    return response.json();
  }

  // Get pig tracking summary for a video batch
  async getPigTracking(batchId: string): Promise<any> {
    const response = await fetch(`${this.endpoint}/video/tracking/${batchId}`);

    if (!response.ok) {
      throw new Error(`Failed to get pig tracking: ${response.status}`);
    }

    return response.json();
  }

  // Process video with pig number tracking (direct to EC2)
  async processVideoWithTracking(file: File, targetFps: number = 2): Promise<VideoProcessingResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_fps', targetFps.toString());

    const response = await fetch(`${this.endpoint}/process/video/sync`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Video processing failed: ${response.status}`);
    }

    return response.json();
  }

  // Create WebSocket for live stream with consistent batch_id
  createLiveStreamWebSocket(batchId: string): WebSocket {
    const wsUrl = this.endpoint.replace('http://', 'ws://').replace('https://', 'wss://');
    return new WebSocket(`${wsUrl}/ws/video/${batchId}`);
  }

  // Process single frame for live stream (maintains batch_id context) - HTTP fallback
  async processLiveFrame(imageBlob: Blob, batchId: string): Promise<AnnotatedDetectionResponse> {
    const formData = new FormData();
    formData.append('file', new File([imageBlob], 'frame.jpg', { type: 'image/jpeg' }));
    formData.append('batch_id', batchId);

    const response = await fetch(`${this.endpoint}/detect/image/annotated`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Frame processing failed: ${response.status}`);
    }

    return response.json();
  }

  // WebSocket URL for live streaming
  getLiveStreamWebSocketUrl(batchId: string): string {
    const wsUrl = this.endpoint.replace('http://', 'ws://').replace('https://', 'wss://');
    return `${wsUrl}/ws/live/${batchId}`;
  }

  // WebSocket URL for progressive video streaming
  getVideoStreamWebSocketUrl(batchId: string): string {
    const wsUrl = this.endpoint.replace('http://', 'ws://').replace('https://', 'wss://');
    return `${wsUrl}/ws/stream/${batchId}`;
  }

  // Upload video and get batch info (doesn't wait for processing)
  async uploadVideoForStreaming(file: File, targetFps: number = 2): Promise<{
    batch_id: string;
    total_frames: number;
    websocket_url: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_fps', targetFps.toString());

    const response = await fetch(`${this.endpoint}/process/video`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Video upload failed: ${response.status}`);
    }

    return response.json();
  }
}

// WebSocket Live Stream Manager
export interface LiveStreamResult {
  frame_id: number;
  timestamp: number;
  pig_count: number;
  detections: Detection[];
  annotated_image: string | null;
  processing_time: number;
  fps: number;
  session_summary?: PigTrackingSummary;
  error?: string;
}

export type LiveStreamCallback = (result: LiveStreamResult) => void;
export type LiveStreamErrorCallback = (error: Error) => void;
export type LiveStreamStatusCallback = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;

export class LiveStreamManager {
  private ws: WebSocket | null = null;
  private batchId: string;
  private endpoint: string;
  private onResult: LiveStreamCallback | null = null;
  private onError: LiveStreamErrorCallback | null = null;
  private onStatus: LiveStreamStatusCallback | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isIntentionallyClosed = false;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(batchId: string, endpoint?: string) {
    this.batchId = batchId;
    this.endpoint = endpoint || backendService.getEndpoint();
  }

  connect(
    onResult: LiveStreamCallback,
    onError?: LiveStreamErrorCallback,
    onStatus?: LiveStreamStatusCallback
  ): void {
    this.onResult = onResult;
    this.onError = onError || null;
    this.onStatus = onStatus || null;
    this.isIntentionallyClosed = false;
    this.reconnectAttempts = 0;

    this._connect();
  }

  private _connect(): void {
    this.onStatus?.('connecting');

    const wsUrl = this.endpoint.replace('http://', 'ws://').replace('https://', 'wss://');
    const url = `${wsUrl}/ws/live/${this.batchId}`;

    try {
      this.ws = new WebSocket(url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        console.log(`[LiveStream] Connected: ${this.batchId}`);
        this.reconnectAttempts = 0;
        this.onStatus?.('connected');

        // Start ping interval to keep connection alive
        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send('ping');
          }
        }, 30000);
      };

      this.ws.onmessage = (event) => {
        try {
          const result = JSON.parse(event.data) as LiveStreamResult;
          this.onResult?.(result);
        } catch (e) {
          console.error('[LiveStream] Failed to parse message:', e);
        }
      };

      this.ws.onerror = (event) => {
        console.error('[LiveStream] Error:', event);
        this.onStatus?.('error');
        this.onError?.(new Error('WebSocket error'));
      };

      this.ws.onclose = (event) => {
        console.log(`[LiveStream] Closed: ${event.code} ${event.reason}`);
        this.onStatus?.('disconnected');
        this._clearPingInterval();

        // Attempt reconnection if not intentionally closed
        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
          console.log(`[LiveStream] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
          setTimeout(() => this._connect(), delay);
        }
      };
    } catch (e) {
      console.error('[LiveStream] Failed to create WebSocket:', e);
      this.onError?.(e instanceof Error ? e : new Error('Failed to connect'));
    }
  }

  private _clearPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Send a frame for processing
  sendFrame(imageData: Blob | ArrayBuffer): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    if (imageData instanceof Blob) {
      imageData.arrayBuffer().then(buffer => {
        this.ws?.send(buffer);
      });
    } else {
      this.ws.send(imageData);
    }

    return true;
  }

  // Request session summary
  requestSummary(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send('summary');
    }
  }

  // Reset session for new recording
  resetSession(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send('reset');
    }
  }

  // Check if connected
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Disconnect
  disconnect(): void {
    this.isIntentionallyClosed = true;
    this._clearPingInterval();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  // Get batch ID
  getBatchId(): string {
    return this.batchId;
  }
}


// Video Stream Manager for progressive video processing
export interface VideoStreamFrame {
  type: 'frame';
  frame_index: number;
  frame_id: number;
  timestamp: number;
  pig_count: number;
  detections: Detection[];
  annotated_image: string;
  processing_time: number;
}

export interface VideoStreamProgress {
  type: 'progress';
  processed: number;
  total: number;
  percent: number;
}

export interface VideoStreamComplete {
  type: 'complete';
  total_frames: number;
  processed_frames: number;
  summary: PigTrackingSummary;
}

export interface VideoStreamInit {
  type: 'init';
  batch_id: string;
  total_frames: number;
  status: string;
}

export type VideoStreamMessage = VideoStreamFrame | VideoStreamProgress | VideoStreamComplete | VideoStreamInit | { type: string; [key: string]: any };

export type VideoStreamFrameCallback = (frame: VideoStreamFrame) => void;
export type VideoStreamProgressCallback = (progress: VideoStreamProgress) => void;
export type VideoStreamCompleteCallback = (complete: VideoStreamComplete) => void;
export type VideoStreamStatusCallback = (status: 'connecting' | 'connected' | 'processing' | 'completed' | 'disconnected' | 'error') => void;

export class VideoStreamManager {
  private ws: WebSocket | null = null;
  private batchId: string;
  private endpoint: string;
  private onFrame: VideoStreamFrameCallback | null = null;
  private onProgress: VideoStreamProgressCallback | null = null;
  private onComplete: VideoStreamCompleteCallback | null = null;
  private onStatus: VideoStreamStatusCallback | null = null;
  private onError: LiveStreamErrorCallback | null = null;
  private totalFrames: number = 0;
  private processedFrames: Map<number, VideoStreamFrame> = new Map();
  private isIntentionallyClosed = false;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(batchId: string, totalFrames: number, endpoint?: string) {
    this.batchId = batchId;
    this.totalFrames = totalFrames;
    this.endpoint = endpoint || backendService.getEndpoint();
  }

  connect(
    onFrame: VideoStreamFrameCallback,
    onProgress: VideoStreamProgressCallback,
    onComplete: VideoStreamCompleteCallback,
    onStatus?: VideoStreamStatusCallback,
    onError?: LiveStreamErrorCallback
  ): void {
    this.onFrame = onFrame;
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onStatus = onStatus || null;
    this.onError = onError || null;
    this.isIntentionallyClosed = false;

    this._connect();
  }

  private _connect(): void {
    this.onStatus?.('connecting');

    const wsUrl = this.endpoint.replace('http://', 'ws://').replace('https://', 'wss://');
    const url = `${wsUrl}/ws/stream/${this.batchId}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log(`[VideoStream] Connected: ${this.batchId}`);
        this.onStatus?.('connected');

        // Start ping interval
        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send('ping');
          }
        }, 30000);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as VideoStreamMessage;

          switch (msg.type) {
            case 'init':
              // Ready to start processing
              console.log(`[VideoStream] Init: ${msg.total_frames} frames`);
              break;

            case 'frame':
              const frame = msg as VideoStreamFrame;
              this.processedFrames.set(frame.frame_index, frame);
              this.onFrame?.(frame);
              break;

            case 'progress':
              this.onProgress?.(msg as VideoStreamProgress);
              break;

            case 'complete':
              this.onStatus?.('completed');
              this.onComplete?.(msg as VideoStreamComplete);
              break;

            case 'status':
              if (msg.status === 'processing') {
                this.onStatus?.('processing');
              }
              break;
          }
        } catch (e) {
          console.error('[VideoStream] Failed to parse message:', e);
        }
      };

      this.ws.onerror = (event) => {
        console.error('[VideoStream] Error:', event);
        this.onStatus?.('error');
        this.onError?.(new Error('WebSocket error'));
      };

      this.ws.onclose = () => {
        console.log(`[VideoStream] Closed`);
        this.onStatus?.('disconnected');
        this._clearPingInterval();
      };
    } catch (e) {
      console.error('[VideoStream] Failed to create WebSocket:', e);
      this.onError?.(e instanceof Error ? e : new Error('Failed to connect'));
    }
  }

  private _clearPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Start processing (call after connect)
  startProcessing(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send('start');
      this.onStatus?.('processing');
    }
  }

  // Get a specific frame (if already processed)
  getFrame(frameIndex: number): VideoStreamFrame | undefined {
    return this.processedFrames.get(frameIndex);
  }

  // Request a frame from server (if we don't have it cached)
  requestFrame(frameIndex: number): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'get_frame', frame_index: frameIndex }));
    }
  }

  // Get all processed frames
  getProcessedFrames(): VideoStreamFrame[] {
    return Array.from(this.processedFrames.values()).sort((a, b) => a.frame_index - b.frame_index);
  }

  // Get processed frame count
  getProcessedCount(): number {
    return this.processedFrames.size;
  }

  // Get total frame count
  getTotalFrames(): number {
    return this.totalFrames;
  }

  // Check if connected
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Disconnect
  disconnect(): void {
    this.isIntentionallyClosed = true;
    this._clearPingInterval();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  // Get batch ID
  getBatchId(): string {
    return this.batchId;
  }
}

export const backendService = new BackendService();
