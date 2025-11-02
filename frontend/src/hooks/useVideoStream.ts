import { useRef, useState, useCallback, useEffect } from "react";
import { VideoSource } from "@/types";

export const useVideoStream = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoSourceRef = useRef<VideoSource>("camera");

  const [isStreaming, setIsStreaming] = useState(false);
  const [videoSource, setVideoSource] = useState<VideoSource>("camera");

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
        setVideoSource("camera");
        videoSourceRef.current = "camera";
        return true;
      }
      return false;
    } catch (error) {
      console.error("Camera access denied:", error);
      alert("Please allow camera access");
      return false;
    }
  }, []);

  const handleVideoUpload = useCallback((file: File) => {
    console.log("handleVideoUpload called with file:", file.name, file.type);

    if (!file || !videoRef.current) {
      console.error("No file or videoRef");
      return false;
    }

    const url = URL.createObjectURL(file);
    console.log("Created blob URL:", url);

    const video = videoRef.current;
    video.src = url;
    video.loop = true;

    video.onloadedmetadata = () => {
      console.log("Video metadata loaded, starting playback");
      video
        .play()
        .then(() => {
          console.log("Video playing successfully");
          setIsStreaming(true);
          setVideoSource("file");
          videoSourceRef.current = "file";
        })
        .catch((err) => {
          console.error("Error playing video:", err);
        });
    };

    video.onerror = (e) => {
      console.error("Video error:", e);
    };

    video.load();
    return true;
  }, []);

  const stopStreaming = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    if (videoRef.current?.src && videoSourceRef.current === "file") {
      videoRef.current.pause();
      videoRef.current.src = "";
    }

    setIsStreaming(false);
  }, []);

  const getCanvasContext = useCallback(() => {
    return canvasRef.current?.getContext("2d");
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.8);
  }, []);

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (videoRef.current?.src && videoRef.current.src.startsWith("blob:")) {
        URL.revokeObjectURL(videoRef.current.src);
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    isStreaming,
    videoSource,
    startCamera,
    handleVideoUpload,
    stopStreaming,
    getCanvasContext,
    captureFrame,
  };
};
