import Image from 'next/image';

export default function Header() {


    return (

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

    );
}