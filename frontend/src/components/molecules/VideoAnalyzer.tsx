'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  backendService,
  Detection,
  FrameData,
  PigTrackingSummary,
  LiveStreamManager,
  LiveStreamResult,
  VideoStreamManager,
  VideoStreamFrame,
  VideoStreamProgress,
  VideoStreamComplete
} from '@/services/backend.service';

type InputMode = 'video' | 'camera';
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'processing' | 'completed' | 'error';

const PIG_COLORS: Record<number, string> = {
  1: '#ef4444', 2: '#22c55e', 3: '#3b82f6', 4: '#eab308', 5: '#ec4899',
  6: '#06b6d4', 7: '#f97316', 8: '#8b5cf6', 9: '#14b8a6', 10: '#f43f5e',
  11: '#84cc16', 12: '#0ea5e9', 13: '#fb7185', 14: '#4ade80', 15: '#818cf8',
  16: '#fde047', 17: '#f0abfc', 18: '#67e8f9', 19: '#c2410c', 20: '#7c3aed',
  21: '#059669', 22: '#be123c', 23: '#65a30d', 24: '#1d4ed8', 25: '#fdba74',
  26: '#7dd3fc', 27: '#c4b5fd', 28: '#fda4af', 29: '#86efac', 30: '#bef264',
};
const NEUTRAL = '#6b7280';

interface ProcessedFrame {
  frame_index: number;
  frame_id: number;
  annotated_image: string;
  detections: Detection[];
  processing_time: number;
}

export const VideoAnalyzer: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [mode, setMode] = useState<InputMode>('video');
  const [video, setVideo] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<PigTrackingSummary | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Video Processing State
  const [totalFrames, setTotalFrames] = useState(0);
  const [processedFrames, setProcessedFrames] = useState<Map<number, ProcessedFrame>>(new Map());
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [videoStatus, setVideoStatus] = useState<ConnectionStatus>('disconnected');
  const [progress, setProgress] = useState({ processed: 0, total: 0, percent: 0 });
  const [batchId, setBatchId] = useState('');

  // Live Camera State
  const [camActive, setCamActive] = useState(false);
  const [liveFrame, setLiveFrame] = useState<string | null>(null);
  const [liveDetections, setLiveDetections] = useState<Detection[]>([]);
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>('disconnected');
  const [liveStats, setLiveStats] = useState({ fps: 0, latency: 0, frameCount: 0 });

  // Refs
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const liveStreamRef = useRef<LiveStreamManager | null>(null);
  const videoStreamRef = useRef<VideoStreamManager | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const color = (n: number | null | undefined) => (n && n >= 1 && n <= 30 ? PIG_COLORS[n] : NEUTRAL);

  // Get current frame data
  const currentFrame = processedFrames.get(currentFrameIdx);

  // Process uploaded video with progressive streaming
  const processVideo = async () => {
    if (!video) return;

    setError('');
    setProcessedFrames(new Map());
    setCurrentFrameIdx(0);
    setProgress({ processed: 0, total: 0, percent: 0 });
    setSummary(null);
    setVideoStatus('connecting');

    try {
      const uploadResult = await backendService.uploadVideoForStreaming(video, 2);
      setBatchId(uploadResult.batch_id);
      setTotalFrames(uploadResult.total_frames);
      setProgress({ processed: 0, total: uploadResult.total_frames, percent: 0 });

      const streamManager = new VideoStreamManager(
        uploadResult.batch_id,
        uploadResult.total_frames
      );
      videoStreamRef.current = streamManager;

      streamManager.connect(
        (frame: VideoStreamFrame) => {
          setProcessedFrames(prev => {
            const updated = new Map(prev);
            updated.set(frame.frame_index, {
              frame_index: frame.frame_index,
              frame_id: frame.frame_id,
              annotated_image: frame.annotated_image,
              detections: frame.detections,
              processing_time: frame.processing_time
            });
            return updated;
          });

          setCurrentFrameIdx(prev => {
            if (prev === frame.frame_index - 1 || prev === 0) {
              return frame.frame_index;
            }
            return prev;
          });
        },
        (prog: VideoStreamProgress) => {
          setProgress({
            processed: prog.processed,
            total: prog.total,
            percent: prog.percent
          });
        },
        (complete: VideoStreamComplete) => {
          setSummary(complete.summary);
          setVideoStatus('completed');
        },
        (status) => {
          setVideoStatus(status);
        },
        (err) => {
          setError(`Stream error: ${err.message}`);
          setVideoStatus('error');
        }
      );

      const waitAndStart = () => {
        if (streamManager.isConnected()) {
          streamManager.startProcessing();
        } else {
          setTimeout(waitAndStart, 100);
        }
      };
      setTimeout(waitAndStart, 200);

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
      setVideoStatus('error');
    }
  };

  const handleLiveResult = useCallback((result: LiveStreamResult) => {
    if (result.annotated_image) {
      setLiveFrame(result.annotated_image);
    }
    setLiveDetections(result.detections || []);
    setLiveStats(prev => ({
      fps: result.fps || prev.fps,
      latency: (result.processing_time || 0) * 1000,
      frameCount: result.frame_id || prev.frameCount
    }));

    if (result.session_summary) {
      setSummary(result.session_summary);
    }
  }, []);

  const handleWsStatus = useCallback((status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
    setWsStatus(status);
  }, []);

  const handleWsError = useCallback((err: Error) => {
    console.error('[LiveStream] Error:', err);
    setError(`WebSocket: ${err.message}`);
  }, []);

  const startCam = async () => {
    try {
      setError('');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const id = `live-${Date.now()}`;
      setBatchId(id);

      const liveStream = new LiveStreamManager(id);
      liveStreamRef.current = liveStream;

      liveStream.connect(
        handleLiveResult,
        handleWsError,
        handleWsStatus
      );

      setCamActive(true);
      setLiveStats({ fps: 0, latency: 0, frameCount: 0 });

      const waitForConnection = () => {
        if (liveStream.isConnected()) {
          startCapturing();
        } else {
          setTimeout(waitForConnection, 100);
        }
      };
      waitForConnection();

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Camera failed');
    }
  };

  const startCapturing = () => {
    const captureAndSend = async () => {
      if (!videoRef.current || !canvasRef.current || !liveStreamRef.current) return;

      const v = videoRef.current;
      const c = canvasRef.current;

      c.width = v.videoWidth;
      c.height = v.videoHeight;

      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(v, 0, 0);

      c.toBlob(async (blob) => {
        if (blob && liveStreamRef.current?.isConnected()) {
          liveStreamRef.current.sendFrame(blob);
        }
      }, 'image/jpeg', 0.8);
    };

    captureIntervalRef.current = setInterval(captureAndSend, 250);
  };

  const stopCam = () => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    if (liveStreamRef.current) {
      liveStreamRef.current.disconnect();
      liveStreamRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    setCamActive(false);
    setLiveFrame(null);
    setLiveDetections([]);
    setWsStatus('disconnected');
  };

  const stopVideoStream = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.disconnect();
      videoStreamRef.current = null;
    }
  };

  const reset = () => {
    stopCam();
    stopVideoStream();
    setVideo(null);
    setProcessedFrames(new Map());
    setTotalFrames(0);
    setCurrentFrameIdx(0);
    setProgress({ processed: 0, total: 0, percent: 0 });
    setError('');
    setSummary(null);
    setBatchId('');
    setVideoStatus('disconnected');
    if (fileRef.current) fileRef.current.value = '';
  };

  useEffect(() => () => {
    stopCam();
    stopVideoStream();
  }, []);

  const getStatusColor = (status: ConnectionStatus) => ({
    disconnected: 'bg-gray-500',
    connecting: 'bg-yellow-500 animate-pulse',
    connected: 'bg-emerald-500',
    processing: 'bg-purple-500 animate-pulse',
    completed: 'bg-emerald-500',
    error: 'bg-red-500'
  }[status]);

  const isProcessing = videoStatus === 'connecting' || videoStatus === 'connected' || videoStatus === 'processing';

  return (
    <div className={`flex flex-col h-full bg-gray-950 text-gray-100 ${className}`}>
      {/* Mode Toggle */}
      <div className="flex gap-2 p-3 bg-gray-900 border-b border-gray-800">
        <button
          onClick={() => { setMode('video'); stopCam(); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            mode === 'video'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
          }`}
        >
          Video
        </button>
        <button
          onClick={() => { setMode('camera'); stopVideoStream(); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            mode === 'camera'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
          }`}
        >
          Live
        </button>
      </div>

      {/* Controls */}
      <div className="p-3 bg-gray-900 border-b border-gray-800">
        {mode === 'video' ? (
          <div className="flex gap-2 items-center">
            <label className="flex-1 cursor-pointer">
              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                disabled={isProcessing}
                onChange={e => { const file = e.target.files?.[0] || null; if (file) { stopVideoStream(); setProcessedFrames(new Map()); setTotalFrames(0); setCurrentFrameIdx(0); setProgress({ processed: 0, total: 0, percent: 0 }); setError(''); setSummary(null); setBatchId(''); setVideoStatus('disconnected'); } setVideo(file); }}
                className="hidden"
              />
              <div className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed transition-all ${
                isProcessing
                  ? 'border-gray-700 bg-gray-800/50 text-gray-500 cursor-not-allowed'
                  : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-purple-500 hover:bg-gray-700'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm font-medium truncate max-w-[150px]">
                  {video ? video.name : 'Select Video'}
                </span>
              </div>
            </label>
            <button
              onClick={processVideo}
              disabled={!video || isProcessing}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold disabled:bg-gray-700 disabled:text-gray-500 hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 disabled:shadow-none"
            >
              {isProcessing ? 'Processing...' : 'Analyze'}
            </button>
            {(processedFrames.size > 0 || isProcessing) && (
              <button
                onClick={reset}
                className="px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition-all"
              >
                Reset
              </button>
            )}
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <button
              onClick={camActive ? stopCam : startCam}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg ${
                camActive
                  ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-600/20'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20'
              }`}
            >
              {camActive ? 'Stop Camera' : 'Start Camera'}
            </button>

            {camActive && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(wsStatus)}`} />
                <span className="text-xs text-gray-300 font-medium capitalize">{wsStatus}</span>
              </div>
            )}

            {summary && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="p-2.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all"
              >
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar for Video Processing */}
      {mode === 'video' && (isProcessing || videoStatus === 'completed') && totalFrames > 0 && (
        <div className="px-3 py-2.5 bg-gray-900/80 border-b border-gray-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-2 text-gray-300">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(videoStatus)}`} />
              <span className="font-medium">{videoStatus === 'completed' ? 'Complete' : 'Processing...'}</span>
            </span>
            <span className="text-gray-400 font-mono">{progress.processed}/{progress.total} ({progress.percent.toFixed(0)}%)</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-3 py-2.5 bg-red-900/30 border-b border-red-800/50 text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Live Camera View */}
      {mode === 'camera' && (
        <div className="flex-1 bg-black relative">
          <video ref={videoRef} className="hidden" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />

          {liveFrame ? (
            <img src={liveFrame} alt="Live" className="w-full h-full object-contain" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {camActive ? (
                  <>
                    <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">
                      {wsStatus === 'connecting' ? 'Connecting...' :
                       wsStatus === 'connected' ? 'Waiting for frames...' :
                       'Starting camera...'}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">Tap Start Camera to begin</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Live Stats Overlay */}
          {camActive && wsStatus === 'connected' && (
            <div className="absolute top-3 left-3 flex gap-2">
              <div className="px-2.5 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg text-white text-xs font-mono">
                {liveStats.fps.toFixed(1)} FPS
              </div>
              <div className="px-2.5 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg text-white text-xs font-mono">
                {liveStats.latency.toFixed(0)}ms
              </div>
              <div className="px-2.5 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg text-white text-xs font-mono">
                #{liveStats.frameCount}
              </div>
            </div>
          )}

          {/* Detection Overlay */}
          {liveDetections.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">{liveDetections.length} pigs detected</span>
                <div className="flex gap-1.5">
                  {liveDetections.slice(0, 8).map((d, i) => (
                    <span
                      key={i}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-lg"
                      style={{ background: color(d.pig_number) }}
                    >
                      {d.pig_number || '?'}
                    </span>
                  ))}
                  {liveDetections.length > 8 && (
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-gray-700 text-gray-300">
                      +{liveDetections.length - 8}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Video Results - Progressive Display */}
      {mode === 'video' && totalFrames > 0 && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Frame */}
          <div className="flex-1 bg-black relative min-h-0">
            {currentFrame ? (
              <>
                <img src={currentFrame.annotated_image} alt="" className="w-full h-full object-contain" />
                {/* Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-gray-400 text-sm font-mono">Frame {currentFrame.frame_id}</span>
                    <span className="flex-1" />
                    <span className="text-white font-semibold">{currentFrame.detections.length} pigs</span>
                    <button
                      onClick={() => setDrawerOpen(true)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                  {/* Scrubber */}
                  <input
                    type="range"
                    min={0}
                    max={totalFrames - 1}
                    value={currentFrameIdx}
                    onChange={e => {
                      const idx = +e.target.value;
                      if (processedFrames.has(idx)) {
                        setCurrentFrameIdx(idx);
                      }
                    }}
                    className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-4
                      [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:bg-purple-500
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:shadow-lg
                      [&::-webkit-slider-thumb]:shadow-purple-500/50"
                  />
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Processing frame {currentFrameIdx + 1}...</p>
                </div>
              </div>
            )}
          </div>

          {/* Frame Thumbnails - Progressive */}
          <div className="bg-gray-900 p-2 border-t border-gray-800">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {[...Array(totalFrames)].map((_, i) => {
                const frame = processedFrames.get(i);
                const isProcessed = !!frame;
                const isCurrent = i === currentFrameIdx;

                return (
                  <div
                    key={i}
                    onClick={() => isProcessed && setCurrentFrameIdx(i)}
                    className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden transition-all border-2 ${
                      isCurrent
                        ? 'border-purple-500 scale-105 shadow-lg shadow-purple-500/30'
                        : isProcessed
                          ? 'border-transparent cursor-pointer hover:border-gray-600'
                          : 'border-transparent cursor-not-allowed'
                    }`}
                  >
                    {isProcessed ? (
                      <img
                        src={frame.annotated_image}
                        alt=""
                        className={`w-full h-full object-cover ${!isCurrent ? 'opacity-60 hover:opacity-100' : ''}`}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-gray-600 border-t-purple-500 rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detected Pigs Pills */}
          {currentFrame && currentFrame.detections.length > 0 && (
            <div className="p-2.5 bg-gray-900 border-t border-gray-800 flex gap-2 overflow-x-auto">
              {currentFrame.detections.map((d, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-white text-xs font-semibold whitespace-nowrap shadow-lg"
                  style={{ background: color(d.pig_number), boxShadow: `0 4px 12px ${color(d.pig_number)}40` }}
                >
                  {d.pig_number ? `#${d.pig_number}` : '?'} {(d.confidence * 100).toFixed(0)}%
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {mode === 'video' && totalFrames === 0 && videoStatus === 'disconnected' && (
        <div className="flex-1 flex items-center justify-center bg-gray-950">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Select a video to analyze</p>
          </div>
        </div>
      )}

      {/* Slide-out Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gray-900 shadow-2xl flex flex-col border-l border-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="font-semibold text-white">Detection Log</h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-all"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Summary */}
            {summary && Object.keys(summary.identified_pigs || {}).length > 0 && (
              <div className="p-4 border-b border-gray-800 bg-gray-800/50">
                <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Identified Pigs</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(summary.identified_pigs).map(([n, d]) => (
                    <span
                      key={n}
                      className="px-2.5 py-1 rounded-lg text-white text-xs font-semibold"
                      style={{ background: color(+n) }}
                    >
                      #{n} ({d.appearances}x)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Frame List */}
            <div className="flex-1 overflow-y-auto">
              {[...processedFrames.values()].sort((a, b) => a.frame_index - b.frame_index).map((f) => (
                <div
                  key={f.frame_index}
                  onClick={() => { setCurrentFrameIdx(f.frame_index); setDrawerOpen(false); }}
                  className={`p-4 border-b border-gray-800 cursor-pointer transition-all ${
                    f.frame_index === currentFrameIdx
                      ? 'bg-purple-900/30 border-l-2 border-l-purple-500'
                      : 'hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Frame {f.frame_id}</span>
                    <span className="text-xs text-gray-400">{f.detections.length} pigs</span>
                  </div>
                  <div className="flex gap-1.5">
                    {f.detections.map((d, j) => (
                      <span
                        key={j}
                        className="w-6 h-6 rounded-md text-white text-xs font-bold flex items-center justify-center"
                        style={{ background: color(d.pig_number) }}
                      >
                        {d.pig_number || '?'}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Color Legend */}
            <div className="p-4 border-t border-gray-800 bg-gray-800/50">
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Color Legend</p>
              <div className="flex flex-wrap gap-1">
                {[...Array(30)].map((_, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded text-white text-[9px] font-bold flex items-center justify-center"
                    style={{ background: PIG_COLORS[i + 1] }}
                  >
                    {i + 1}
                  </div>
                ))}
                <div className="w-5 h-5 rounded text-white text-[9px] font-bold flex items-center justify-center" style={{ background: NEUTRAL }}>?</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
