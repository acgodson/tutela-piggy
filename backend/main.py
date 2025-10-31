"""
FastAPI Backend for Tutela Pig Analysis
"""

from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import cv2
import numpy as np
import base64
import json
from ultralytics import YOLO
from collections import deque
import asyncio
import io
from datetime import datetime

app = FastAPI(
    title="Tutela Pig Analysis API",
    description="Real-time pig behavior detection with better overlap handling",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
tracker_state = {}


class Detection(BaseModel):
    x: float
    y: float
    width: float
    height: float
    confidence: float
    class_name: str
    track_id: Optional[int] = None


class FrameRequest(BaseModel):
    image: str
    frame_id: int
    timestamp: float


class DetectionResponse(BaseModel):
    frame_id: int
    timestamp: float
    detections: List[Detection]
    fps: float
    processing_time: float


class SimpleTracker:
    def __init__(self, max_age=30, iou_threshold=0.3):
        self.max_age = max_age
        self.iou_threshold = iou_threshold
        self.tracks = {}
        self.next_id = 1
        self.frame_count = 0

    def calculate_iou(self, box1, box2):
        x1, y1, w1, h1 = box1
        x2, y2, w2, h2 = box2

        xi1 = max(x1, x2)
        yi1 = max(y1, y2)
        xi2 = min(x1 + w1, x2 + w2)
        yi2 = min(y1 + h1, y2 + h2)

        inter_area = max(0, xi2 - xi1) * max(0, yi2 - yi1)
        box1_area = w1 * h1
        box2_area = w2 * h2
        union_area = box1_area + box2_area - inter_area

        return inter_area / union_area if union_area > 0 else 0

    def update(self, detections):
        self.frame_count += 1

        if len(detections) == 0:
            self.tracks = {
                tid: track
                for tid, track in self.tracks.items()
                if self.frame_count - track["last_seen"] < self.max_age
            }
            return []

        det_boxes = [[d["x"], d["y"], d["width"], d["height"]] for d in detections]

        matched_indices = set()
        updated_tracks = []

        for track_id, track in list(self.tracks.items()):
            best_iou = 0
            best_idx = -1

            for idx, det_box in enumerate(det_boxes):
                if idx in matched_indices:
                    continue

                iou = self.calculate_iou(track["box"], det_box)
                if iou > best_iou and iou > self.iou_threshold:
                    best_iou = iou
                    best_idx = idx

            if best_idx != -1:
                matched_indices.add(best_idx)
                detections[best_idx]["track_id"] = track_id
                self.tracks[track_id] = {
                    "box": det_boxes[best_idx],
                    "last_seen": self.frame_count,
                }
                updated_tracks.append(detections[best_idx])
            elif self.frame_count - track["last_seen"] >= self.max_age:
                del self.tracks[track_id]

        for idx, detection in enumerate(detections):
            if idx not in matched_indices:
                new_id = self.next_id
                self.next_id += 1
                detection["track_id"] = new_id
                self.tracks[new_id] = {
                    "box": det_boxes[idx],
                    "last_seen": self.frame_count,
                }
                updated_tracks.append(detection)

        return updated_tracks


def split_large_boxes(detections, image_width=None, image_height=None):
    """
    Split unusually wide bounding boxes that likely contain multiple pigs

    Args:
        detections: List of detection dictionaries
        image_width: Width of the image (optional, for ratio calculation)
        image_height: Height of the image (optional)

    Returns:
        List of detections with large boxes potentially split
    """
    split_detections = []

    for detection in detections:
        width = detection["width"]
        height = detection["height"]

        # Skip if dimensions are invalid
        if height <= 0:
            split_detections.append(detection)
            continue

        aspect_ratio = width / height

        # If box is unusually wide (aspect ratio > 1.5), likely contains 2 pigs
        if aspect_ratio > 1.8:
            # Split into two boxes horizontally
            half_width = width / 2

            # Left pig
            split_detections.append(
                {
                    "x": detection["x"],
                    "y": detection["y"],
                    "width": half_width * 0.9,  # Slightly smaller to avoid overlap
                    "height": height,
                    "confidence": detection["confidence"] * 0.85,
                    "class_name": detection["class_name"],
                }
            )

            # Right pig
            split_detections.append(
                {
                    "x": detection["x"] + half_width * 1.1,
                    "y": detection["y"],
                    "width": half_width * 0.9,
                    "height": height,
                    "confidence": detection["confidence"] * 0.85,
                    "class_name": detection["class_name"],
                }
            )
        else:
            # Keep original detection
            split_detections.append(detection)

    return split_detections


tracker = SimpleTracker(max_age=30, iou_threshold=0.25)


@app.on_event("startup")
async def startup_event():
    global model
    try:
        import torch
        from ultralytics.nn.tasks import DetectionModel

        torch.serialization.add_safe_globals([DetectionModel])

        model = YOLO("/app/models/yolov8n.pt")
        print("✅ Model loaded successfully")
        print("📊 Using optimized parameters for multiple pig detection")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        import traceback

        traceback.print_exc()
        model = None


@app.get("/")
async def root():
    return {
        "status": "running",
        "service": "Tutela Pig Analysis API",
        "model_loaded": model is not None,
        "version": "2.0.0",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy" if model is not None else "unhealthy",
        "model_loaded": model is not None,
        "active_tracks": len(tracker.tracks),
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/detect/image", response_model=DetectionResponse)
async def detect_image(file: UploadFile = File(...)):
    if model is None:
        return JSONResponse(status_code=503, content={"error": "Model not loaded"})

    try:
        start_time = asyncio.get_event_loop().time()

        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        results = model(
            image,
            conf=0.3,
            iou=0.3,
            max_det=50,
            verbose=False,
        )

        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                detections.append(
                    {
                        "x": float(x1),
                        "y": float(y1),
                        "width": float(x2 - x1),
                        "height": float(y2 - y1),
                        "confidence": float(box.conf[0]),
                        "class_name": result.names[int(box.cls[0])],
                    }
                )

        detections = split_large_boxes(
            detections, image_width=image.shape[1], image_height=image.shape[0]
        )

        tracked_detections = tracker.update(detections)

        processing_time = asyncio.get_event_loop().time() - start_time
        fps = 1.0 / processing_time if processing_time > 0 else 0

        return DetectionResponse(
            frame_id=0,
            timestamp=start_time,
            detections=tracked_detections,
            fps=fps,
            processing_time=processing_time,
        )

    except Exception as e:
        return JSONResponse(
            status_code=500, content={"error": f"Processing failed: {str(e)}"}
        )


@app.post("/detect/frame", response_model=DetectionResponse)
async def detect_frame(request: FrameRequest):
    if model is None:
        return JSONResponse(status_code=503, content={"error": "Model not loaded"})

    try:
        start_time = asyncio.get_event_loop().time()

        image_data = base64.b64decode(
            request.image.split(",")[1] if "," in request.image else request.image
        )
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        results = model(image, conf=0.3, iou=0.3, max_det=50, verbose=False)

        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                detections.append(
                    {
                        "x": float(x1),
                        "y": float(y1),
                        "width": float(x2 - x1),
                        "height": float(y2 - y1),
                        "confidence": float(box.conf[0]),
                        "class_name": result.names[int(box.cls[0])],
                    }
                )

        detections = split_large_boxes(
            detections, image_width=image.shape[1], image_height=image.shape[0]
        )

        tracked_detections = tracker.update(detections)

        processing_time = asyncio.get_event_loop().time() - start_time
        fps = 1.0 / processing_time if processing_time > 0 else 0

        return DetectionResponse(
            frame_id=request.frame_id,
            timestamp=request.timestamp,
            detections=tracked_detections,
            fps=fps,
            processing_time=processing_time,
        )

    except Exception as e:
        return JSONResponse(
            status_code=500, content={"error": f"Processing failed: {str(e)}"}
        )


@app.websocket("/ws/detect")
async def websocket_detect(websocket: WebSocket):
    await websocket.accept()

    if model is None:
        await websocket.send_json({"error": "Model not loaded"})
        await websocket.close()
        return

    try:
        while True:
            data = await websocket.receive_json()
            start_time = asyncio.get_event_loop().time()

            image_data = base64.b64decode(
                data["image"].split(",")[1] if "," in data["image"] else data["image"]
            )
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            results = model(image, conf=0.3, iou=0.3, max_det=50, verbose=False)

            detections = []
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    detections.append(
                        {
                            "x": float(x1),
                            "y": float(y1),
                            "width": float(x2 - x1),
                            "height": float(y2 - y1),
                            "confidence": float(box.conf[0]),
                            "class_name": result.names[int(box.cls[0])],
                        }
                    )

            detections = split_large_boxes(
                detections, image_width=image.shape[1], image_height=image.shape[0]
            )

            tracked_detections = tracker.update(detections)

            processing_time = asyncio.get_event_loop().time() - start_time
            fps = 1.0 / processing_time if processing_time > 0 else 0

            await websocket.send_json(
                {
                    "frame_id": data.get("frame_id", 0),
                    "timestamp": data.get("timestamp", start_time),
                    "detections": tracked_detections,
                    "fps": fps,
                    "processing_time": processing_time,
                }
            )

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()


@app.post("/detect/video")
async def detect_video(file: UploadFile = File(...)):
    if model is None:
        return JSONResponse(status_code=503, content={"error": "Model not loaded"})

    try:
        temp_input = f"temp_input_{datetime.now().timestamp()}.mp4"
        temp_output = f"temp_output_{datetime.now().timestamp()}.mp4"

        contents = await file.read()
        with open(temp_input, "wb") as f:
            f.write(contents)

        cap = cv2.VideoCapture(temp_input)
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(temp_output, fourcc, fps, (width, height))

        frame_count = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            results = model(frame, conf=0.3, iou=0.3, max_det=50, verbose=False)

            annotated_frame = results[0].plot()
            out.write(annotated_frame)
            frame_count += 1

        cap.release()
        out.release()

        def iterfile():
            with open(temp_output, "rb") as f:
                yield from f

        return StreamingResponse(
            iterfile(),
            media_type="video/mp4",
            headers={
                "Content-Disposition": f"attachment; filename=processed_{file.filename}"
            },
        )

    except Exception as e:
        return JSONResponse(
            status_code=500, content={"error": f"Video processing failed: {str(e)}"}
        )
    finally:
        import os

        try:
            os.remove(temp_input)
            os.remove(temp_output)
        except:
            pass


@app.get("/model/info")
async def model_info():
    if model is None:
        return JSONResponse(status_code=503, content={"error": "Model not loaded"})

    return {
        "model_type": "YOLOv8n",
        "task": "detection",
        "classes": model.names if hasattr(model, "names") else {},
        "input_size": 640,
        "improvements": {
            "conf_threshold": 0.3,
            "iou_threshold": 0.3,
            "max_detections": 50,
            "box_splitting": "enabled",
        },
    }


@app.post("/tracker/reset")
async def reset_tracker():
    global tracker
    tracker = SimpleTracker(max_age=30, iou_threshold=0.25)
    return {"status": "tracker reset", "active_tracks": 0}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8002)
