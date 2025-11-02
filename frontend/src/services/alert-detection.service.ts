export interface Detection {
  track_id?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class_name: string;
}

export interface Alert {
  alert_type: "count_mismatch" | "inactivity_alert";
  severity: "high" | "medium";
  timestamp: string;
  pig_id?: number;
  expected_count?: number;
  detected_count?: number;
  risk: string;
  action: string;
}

interface PositionHistory {
  x: number;
  y: number;
  timestamp: number;
}

export class AlertDetectionService {
  private pigPositionHistory = new Map<number, PositionHistory[]>();
  private lastAlertTime = new Map<string, number>();
  private readonly alertCooldown = 30000;
  private readonly inactivityThreshold = 15000;
  private readonly movementThreshold = 50;

  detectAlerts(detections: Detection[], expectedCount: number): Alert[] {
    const alerts: Alert[] = [];

    const countMismatchAlert = this.checkCountMismatch(
      detections,
      expectedCount
    );
    if (countMismatchAlert) {
      alerts.push(countMismatchAlert);
    }

    const inactivityAlerts = this.checkInactivity(detections);
    alerts.push(...inactivityAlerts);

    return alerts;
  }

  private checkCountMismatch(
    detections: Detection[],
    expectedCount: number
  ): Alert | null {
    if (detections.length === expectedCount) {
      return null;
    }

    const alertKey = "count_mismatch";
    if (!this.shouldTriggerAlert(alertKey)) {
      return null;
    }

    this.lastAlertTime.set(alertKey, Date.now());

    return {
      alert_type: "count_mismatch",
      severity: "high",
      timestamp: new Date().toISOString(),
      expected_count: expectedCount,
      detected_count: detections.length,
      risk:
        detections.length < expectedCount
          ? "Missing pig - possibly sick and hiding"
          : "Extra pig detected - unauthorized entry",
      action: "Perform physical headcount immediately",
    };
  }

  private checkInactivity(detections: Detection[]): Alert[] {
    const alerts: Alert[] = [];
    const currentTime = Date.now();

    detections.forEach((detection) => {
      const trackId = detection.track_id;
      if (!trackId) return;

      const centerX = detection.x + detection.width / 2;
      const centerY = detection.y + detection.height / 2;

      this.updatePositionHistory(trackId, centerX, centerY, currentTime);

      const alert = this.checkPigInactivity(trackId, currentTime);
      if (alert) {
        alerts.push(alert);
      }
    });

    return alerts;
  }

  private updatePositionHistory(
    trackId: number,
    x: number,
    y: number,
    timestamp: number
  ): void {
    if (!this.pigPositionHistory.has(trackId)) {
      this.pigPositionHistory.set(trackId, []);
    }

    const history = this.pigPositionHistory.get(trackId)!;
    history.push({ x, y, timestamp });

    const recentHistory = history.filter(
      (p) => timestamp - p.timestamp < this.inactivityThreshold
    );
    this.pigPositionHistory.set(trackId, recentHistory);
  }

  private checkPigInactivity(
    trackId: number,
    currentTime: number
  ): Alert | null {
    const history = this.pigPositionHistory.get(trackId);
    if (!history || history.length < 5) {
      return null;
    }

    const firstPos = history[0];
    const lastPos = history[history.length - 1];

    const distance = Math.sqrt(
      Math.pow(lastPos.x - firstPos.x, 2) + Math.pow(lastPos.y - firstPos.y, 2)
    );

    if (distance >= this.movementThreshold) {
      return null;
    }

    const alertKey = `inactivity_${trackId}`;
    if (!this.shouldTriggerAlert(alertKey)) {
      return null;
    }

    this.lastAlertTime.set(alertKey, currentTime);

    return {
      alert_type: "inactivity_alert",
      severity: "medium",
      timestamp: new Date().toISOString(),
      pig_id: trackId,
      risk: "Lethargy detected - possible illness or fever",
      action: "Check pig temperature and monitor closely",
    };
  }

  private shouldTriggerAlert(alertKey: string): boolean {
    const lastAlert = this.lastAlertTime.get(alertKey) || 0;
    const currentTime = Date.now();
    return currentTime - lastAlert > this.alertCooldown;
  }

  clearHistory(): void {
    this.pigPositionHistory.clear();
    this.lastAlertTime.clear();
  }

  getPigHistory(trackId: number): PositionHistory[] | undefined {
    return this.pigPositionHistory.get(trackId);
  }
}

export const alertDetectionService = new AlertDetectionService();
