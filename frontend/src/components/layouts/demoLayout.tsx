export default function DemoLayout({ children }: any) {
    return (
        <main className="h-screen relative overflow-hidden" style={{ backgroundColor: '#0f1419' }} suppressHydrationWarning>
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
            <div
                className="fixed inset-0 z-0"
                style={{
                    background: 'linear-gradient(to bottom, rgba(15, 20, 25, 0.4) 0%, rgba(15, 20, 25, 0.6) 50%, rgba(15, 20, 25, 0.75) 100%)',
                }}
            />

            <div className="container mx-auto px-4 py-2 sm:py-4 relative z-10 h-full overflow-y-auto">
                {children}
            </div>
        </main>
    );
}