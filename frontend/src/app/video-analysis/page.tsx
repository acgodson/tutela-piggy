'use client';

import React, { useState, useEffect } from 'react';
import { VideoAnalyzer } from '@/components/molecules/VideoAnalyzer';
import { backendService } from '@/services/backend.service';

export default function VideoAnalysisPage() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        await backendService.checkHealth();
        setOnline(true);
      } catch {
        setOnline(false);
      }
    };
    check();
    const i = setInterval(check, 30000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="font-bold text-lg text-white">Tutela</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-full">
          <div className={`w-2 h-2 rounded-full ${
            online === true ? 'bg-emerald-500' :
            online === false ? 'bg-red-500' :
            'bg-yellow-500 animate-pulse'
          }`} />
          <span className="text-xs text-gray-400 font-medium">
            {online === true ? 'Online' : online === false ? 'Offline' : 'Checking...'}
          </span>
        </div>
      </header>

      {/* Main */}
      {online === false ? (
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-950">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-300 font-medium mb-1">Cannot connect to server</p>
            <p className="text-gray-500 text-sm font-mono">{backendService.getEndpoint()}</p>
          </div>
        </div>
      ) : (
        <VideoAnalyzer className="flex-1" />
      )}
    </div>
  );
}
