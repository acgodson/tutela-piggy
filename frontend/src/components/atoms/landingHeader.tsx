import Link from 'next/link';
import Image from 'next/image';



export default async function LandingHeader() {

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f1419]/95 backdrop-blur-md border-b border-gray-800/50">
            <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                    <div className="relative w-10 h-10">
                        <Image
                            src="/logo.jpg"
                            alt="Tutela Logo"
                            width={40}
                            height={40}
                            className="object-contain"
                            priority
                        />
                    </div>
                    <span className="text-white font-semibold text-lg">Tutela</span>
                </Link>

                <div className="flex items-center gap-4">
                    {/* <Link
                        href="/about"
                        className="text-gray-400 hover:text-white transition-colors text-sm font-medium hidden sm:block"
                    >
                        About
                    </Link> */}
                    <Link
                        href="https://github.com/tutela-piggy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors text-sm font-medium hidden sm:block"
                    >
                        GitHub
                    </Link>
                    <Link
                        href="/video-analysis"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Live Demo
                    </Link>
                </div>
            </nav>
        </header>
    );
}
