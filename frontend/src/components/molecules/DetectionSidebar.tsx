import React from 'react';
import { Detection, Alert } from '@/types';

interface DetectionSidebarProps {
    detections: Detection[];
    alerts: Alert[];
    hederaEnabled: boolean;
    isStreaming: boolean;
    videoSource: 'camera' | 'file';
}

export const DetectionSidebar: React.FC<DetectionSidebarProps> = ({
    detections,
    alerts,
    hederaEnabled,
    isStreaming,
    videoSource
}) => {
    return (
        <div className="space-y-4">
            <div className="backdrop-blur-md bg-black/30 border border-white/20 rounded-xl p-4 shadow-lg">
                <h3 className="text-sm font-semibold text-white mb-3">Active Tracks</h3>
                {detections.length === 0 ? (
                    <div className="text-center py-8">
                        <svg className="w-12 h-12 text-gray-700 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-gray-500">No pigs detected</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {detections.map((det, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between backdrop-blur-sm bg-black/20 px-3 py-2.5 rounded-lg border border-white/5"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-sm text-gray-300 font-medium">
                                        Pig #{det.track_id || '?'}
                                    </span>
                                </div>
                                <span className="text-xs text-green-400 font-medium">
                                    {(det.confidence * 100).toFixed(0)}%
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="backdrop-blur-md bg-black/30 border border-white/20 rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">Recent Alerts</h3>
                    {alerts.length > 0 && (
                        <span className="text-xs text-gray-500">{alerts.length}</span>
                    )}
                </div>
                {alerts.length === 0 ? (
                    <div className="text-center py-8">
                        <svg className="w-12 h-12 text-gray-700 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-gray-500">All clear</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {alerts.slice(0, 5).map((alert, idx) => (
                            <div
                                key={idx}
                                className={`backdrop-blur-sm bg-black/20 rounded-lg p-3 border ${alert.severity === 'high' ? 'border-red-500/30' : 'border-yellow-500/30'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${alert.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                                        }`}></div>
                                    <span className="text-xs text-white font-medium">
                                        {alert.alert_type === 'count_mismatch' ? 'Count Mismatch' : 'Inactivity'}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                    {new Date(alert.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="backdrop-blur-md bg-black/30 border border-white/20 rounded-xl p-4 shadow-lg">
                <h3 className="text-sm font-semibold text-white mb-3">System Status</h3>
                <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Detection Model</span>
                        <span className="flex items-center gap-1.5 text-xs">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            <span className="text-green-400">Active</span>
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Hedera Network</span>
                        <span className="flex items-center gap-1.5 text-xs">
                            <div className={`w-1.5 h-1.5 rounded-full ${hederaEnabled ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                            <span className={hederaEnabled ? 'text-green-400' : 'text-gray-500'}>
                                {hederaEnabled ? 'Connected' : 'Standby'}
                            </span>
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Video Source</span>
                        <span className="text-xs text-gray-300 capitalize">
                            {isStreaming ? videoSource : 'None'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};