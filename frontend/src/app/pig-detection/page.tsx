import LivePigDetection from '@/components/organisms/Livepigdetection';
import Image from 'next/image';

export default function PigDetectionPage() {


    return (
        <main className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#0f1419' }}>
            {/* Background Image with Gradient Overlay */}
            <div
                className="fixed inset-0 z-0"
                style={{
                    backgroundImage: 'url(/pigs.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    filter: 'blur(1px) brightness(0.5)',
                }}
            />
            {/* Gradient Overlay - more transparent to show image */}
            <div
                className="fixed inset-0 z-0"
                style={{
                    background: 'linear-gradient(to bottom, rgba(15, 20, 25, 0.4) 0%, rgba(15, 20, 25, 0.6) 50%, rgba(15, 20, 25, 0.75) 100%)',
                }}
            />

            <div className="container mx-auto px-4 py-6 relative z-10">
                {/* Header with Logo */}
                <div className="flex items-center justify-center gap-4 mb-8 relative z-10">
                    <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                            src="/logo.jpg"
                            alt="Tutela Logo"
                            width={48}
                            height={48}
                            className="object-contain"
                            priority
                        />
                    </div>
                    <div className="text-left">
                        <h1 className="text-3xl md:text-4xl font-semibold text-white leading-tight">
                            Tutela
                        </h1>
                        <p className="text-sm text-gray-400 font-light">
                            Livestock Monitoring
                        </p>
                    </div>
                </div>

                {/* Main Content with Glassmorphism Effect */}
                <div className="relative z-10 backdrop-blur-xl bg-black/40 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/20 pointer-events-none" />
                    <div className="relative">
                        <LivePigDetection />
                    </div>
                </div>

                {/* Footer Links */}
                <div className="flex items-center justify-center gap-6 mt-12 pt-8 border-t border-gray-800/50 relative z-10">
                    <a
                        href="/about"
                        className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        About Tutela
                    </a>
                    <span className="text-gray-600">•</span>
                    <a
                        href="https://github.com/tutela"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                        </svg>
                        GitHub
                    </a>
                </div>
            </div>
        </main>
    );
}