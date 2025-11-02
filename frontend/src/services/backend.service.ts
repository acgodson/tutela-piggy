const API_ENDPOINT = process.env.API_ENDPOINT || "http://localhost:8002";

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

export interface HealthResponse {
  status: string;
  [key: string]: any;
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

  async checkHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.endpoint}/health`);

    if (!response.ok) {
      throw new Error("Cannot connect to backend");
    }

    return response.json();
  }

  getEndpoint(): string {
    return this.endpoint;
  }
}

export const backendService = new BackendService();
