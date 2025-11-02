import DemoLayout from '@/components/layouts/demoLayout';
import LivePigDetection from '@/components/organisms/Livepigdetection';


export default function PigDetectionPage() {


    return (
        <DemoLayout>
            <div className="relative z-10 backdrop-blur-xl bg-black/40 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/20 pointer-events-none" />
                <div className="relative">
                    <LivePigDetection />
                </div>
            </div>
        </DemoLayout >
    );
}