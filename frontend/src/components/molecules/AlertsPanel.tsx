import React from 'react';
import { Alert, HederaReceipt } from '@/types';
import { Portal } from '../atoms/portal';

interface AlertsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    alerts: Alert[];
    hederaReceipts: HederaReceipt[];
    hederaEnabled: boolean;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
    isOpen,
    onClose,
    alerts,
    hederaReceipts,
    hederaEnabled
}) => {
    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
                <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-800">
                        <div>
                            <h2 className="text-lg sm:text-xl font-semibold text-white">Alert System</h2>
                            <p className="text-xs sm:text-sm text-gray-400 mt-1">Real-time monitoring on Hedera HCS</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-white mb-4">Alert Types</h3>
                            <div className="grid gap-4">
                                <div className="bg-[#0a0a0a] border border-red-900/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-medium text-white">Count Mismatch</h4>
                                                <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-xs rounded-full font-medium">HIGH</span>
                                            </div>
                                            <div className="space-y-1.5 text-sm text-gray-400">
                                                <div><span className="text-gray-500">Trigger:</span> Detected pigs ≠ Expected count</div>
                                                <div><span className="text-gray-500">Risk:</span> Missing pig (sick/hiding) or unauthorized entry</div>
                                                <div><span className="text-gray-500">Action:</span> Perform physical headcount immediately</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#0a0a0a] border border-yellow-900/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-medium text-white">Inactivity Alert</h4>
                                                <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-xs rounded-full font-medium">MEDIUM</span>
                                            </div>
                                            <div className="space-y-1.5 text-sm text-gray-400">
                                                <div><span className="text-gray-500">Trigger:</span> Pig stationary for 15+ seconds</div>
                                                <div><span className="text-gray-500">Risk:</span> Lethargy - possible illness or fever</div>
                                                <div><span className="text-gray-500">Action:</span> Check temperature, monitor closely</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-white">Alert History</h3>
                                <span className="text-xs text-gray-500">{alerts.length} total</span>
                            </div>

                            <div className="space-y-2">
                                {alerts.length === 0 ? (
                                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-8 text-center">
                                        <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm text-gray-500">No alerts recorded yet</p>
                                    </div>
                                ) : (
                                    alerts.map((alert, idx) => (
                                        <div
                                            key={idx}
                                            className={`bg-[#0a0a0a] border rounded-lg p-4 ${alert.severity === 'high' ? 'border-red-900/30' : 'border-yellow-900/30'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${alert.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                                                        }`}></div>
                                                    <span className="text-white text-sm font-medium">
                                                        {alert.alert_type === 'count_mismatch' ? 'Count Mismatch' : 'Inactivity Alert'}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(alert.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-400 mb-1">
                                                {alert.risk}
                                            </div>
                                            {alert.expected_count !== undefined && (
                                                <div className="text-xs text-gray-500">
                                                    Expected: {alert.expected_count} | Detected: {alert.detected_count}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {hederaEnabled && hederaReceipts.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-white mb-4">Blockchain Verification</h3>
                                <div className="space-y-2">
                                    {hederaReceipts.map((receipt, idx) => (
                                        <div key={idx} className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3">
                                            {receipt.success ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs text-gray-400">Logged to Hedera</div>
                                                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                                                            Topic: {receipt.topic_id} • Seq: {receipt.sequence}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs text-red-400">Failed: {receipt.error}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Portal>
    );
};