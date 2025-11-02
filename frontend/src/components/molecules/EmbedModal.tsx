import React from 'react';
import { useEmbed } from '@/hooks/useEmbed';
import { Portal } from '../atoms/portal';

interface EmbedModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EmbedModal: React.FC<EmbedModalProps> = ({ isOpen, onClose }) => {
    const { generateEmbedCode, getDirectUrl, getTopicId, getFarmId, copyToClipboard } = useEmbed();

    if (!isOpen) return null;

    const embedCode = generateEmbedCode();
    const directUrl = getDirectUrl();
    const topicId = getTopicId();
    const farmId = getFarmId();

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
                <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-800">
                        <h2 className="text-lg sm:text-xl font-semibold text-white">Share & Embed</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Direct Link
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={directUrl}
                                    readOnly
                                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-gray-300 text-xs sm:text-sm font-mono focus:outline-none focus:border-gray-600"
                                />
                                <button
                                    onClick={() => copyToClipboard(directUrl, 'Link')}
                                    className="px-4 py-2 sm:py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition text-xs sm:text-sm font-medium"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Embed Code
                            </label>
                            <div className="relative">
                                <pre className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-gray-300 overflow-x-auto font-mono">
                                    {embedCode}
                                </pre>
                                <button
                                    onClick={() => copyToClipboard(embedCode, 'Embed code')}
                                    className="absolute top-3 right-3 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs font-medium transition"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-300 mb-3">Embed Configuration</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Hedera Topic ID:</span>
                                    <span className="text-gray-300 font-mono">{topicId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Farm ID:</span>
                                    <span className="text-gray-300 font-mono">{farmId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Location:</span>
                                    <span className="text-gray-300">Lagos, Nigeria</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Preview
                            </label>
                            <div className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-6 text-center">
                                <div className="text-gray-500 text-sm">
                                    Embedded alert feed will display live Hedera powered logs
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};