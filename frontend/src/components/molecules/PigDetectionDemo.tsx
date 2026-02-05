'use client';

import React, { useState, useRef } from 'react';
import { backendService, AnnotatedDetectionResponse, ModelInfo } from '@/services/backend.service';

interface PigDetectionDemoProps {
  className?: string;
}

export const PigDetectionDemo: React.FC<PigDetectionDemoProps> = ({ className = '' }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [result, setResult] = useState<AnnotatedDetectionResponse | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError('');
    }
  };

  const handleDetection = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setError('');

    try {
      const [detectionResult, modelData] = await Promise.all([
        backendService.detectImageAnnotated(selectedImage),
        modelInfo ? Promise.resolve(modelInfo) : backendService.getModelInfo()
      ]);

      setResult(detectionResult);
      if (!modelInfo) setModelInfo(modelData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Detection failed');
    } finally {
      setLoading(false);
    }
  };

  const resetDemo = () => {
    setSelectedImage(null);
    setPreviewUrl('');
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🐷 Advanced Pig Segmentation Demo
        </h2>
        <p className="text-gray-600">
          Upload an image to see our fine-tuned YOLOv8 model detect pigs with precise segmentation masks
        </p>
      </div>

      {/* Model Info */}
      {modelInfo && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">🎯 Model Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600 font-medium">Model:</span>
              <p className="text-gray-700">{modelInfo.model_type}</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Accuracy:</span>
              <p className="text-gray-700">{modelInfo.accuracy.mAP50}% mAP50</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Task:</span>
              <p className="text-gray-700 capitalize">{modelInfo.task}</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Training:</span>
              <p className="text-gray-700">{modelInfo.accuracy.training_epochs} epochs</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDetection}
              disabled={!selectedImage || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '🔄 Analyzing...' : '🔍 Detect Pigs'}
            </button>
            <button
              onClick={resetDemo}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">❌ {error}</p>
        </div>
      )}

      {/* Results Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Image */}
        {previewUrl && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">📸 Original Image</h3>
            <div className="border rounded-lg overflow-hidden">
              <img
                src={previewUrl}
                alt="Original"
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>
          </div>
        )}

        {/* Detection Results */}
        {result && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">
              🎯 Detection Results ({result.pig_count} pigs)
            </h3>
            <div className="border rounded-lg overflow-hidden mb-4">
              <img
                src={result.annotated_image}
                alt="Detection Results"
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>
            
            {/* Performance Stats */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">⚡ Performance</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-green-600 font-medium">Processing:</span>
                  <p className="text-gray-700">{result.processing_time.toFixed(3)}s</p>
                </div>
                <div>
                  <span className="text-green-600 font-medium">FPS:</span>
                  <p className="text-gray-700">{result.fps.toFixed(1)}</p>
                </div>
                <div>
                  <span className="text-green-600 font-medium">Pigs Found:</span>
                  <p className="text-gray-700">{result.pig_count}</p>
                </div>
              </div>
            </div>

            {/* Detection Details */}
            {result.detections.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-2">📋 Detection Details</h4>
                <div className="max-h-32 overflow-y-auto bg-gray-50 rounded p-3">
                  {result.detections.slice(0, 5).map((detection, index) => (
                    <div key={index} className="text-sm text-gray-600 mb-1">
                      Pig {detection.track_id || index + 1}: {(detection.confidence * 100).toFixed(1)}% confidence
                      {detection.has_mask && ` • Mask: ${detection.mask_area?.toFixed(0)} pixels`}
                    </div>
                  ))}
                  {result.detections.length > 5 && (
                    <div className="text-sm text-gray-500 italic">
                      ... and {result.detections.length - 5} more pigs
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Features Highlight */}
      <div className="mt-8 bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-3">✨ Advanced Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-orange-500">🎭</span>
            <div>
              <p className="font-medium text-gray-700">Segmentation Masks</p>
              <p className="text-gray-600">Precise pig boundaries, not just boxes</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-pink-500">🎯</span>
            <div>
              <p className="font-medium text-gray-700">95.2% Accuracy</p>
              <p className="text-gray-600">Professional-grade performance</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-500">⚡</span>
            <div>
              <p className="font-medium text-gray-700">Real-time Processing</p>
              <p className="text-gray-600">Fast inference for live monitoring</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};