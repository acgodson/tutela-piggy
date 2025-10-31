import Link from 'next/link';
import Image from 'next/image';

async function fetchLandingPage() {
  try {
    const response = await fetch('https://tutela.framer.website', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TutelaBot/1.0)',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    return html;
  } catch (error) {
    console.error('Error fetching landing page:', error);
    return null;
  }
}

export default async function HomePage() {
  const landingPageHtml = await fetchLandingPage();

  return (
    <div className="relative min-h-screen">

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
            <Link
              href="/about"
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium hidden sm:block"
            >
              About
            </Link>
            <Link
              href="https://github.com/tutela"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium hidden sm:block"
            >
              GitHub
            </Link>
            <Link
              href="/pig-detection"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Live Demo
            </Link>
          </div>
        </nav>
      </header>


      <div className="pt-16">
        {landingPageHtml ? (
          <div
            dangerouslySetInnerHTML={{ __html: landingPageHtml }}
            className="framer-content"
          />
        ) : (
          <div className="min-h-screen flex items-center justify-center bg-[#0f1419]">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-2">
                Unable to load landing page
              </div>
              <Link
                href="/pig-detection"
                className="text-blue-500 hover:text-blue-400 text-sm underline"
              >
                Go to Live Demo →
              </Link>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .framer-content {
            width: 100%;
          }
          .framer-content header {
            display: none !important;
          }
          .framer-content > * {
            margin-top: 0 !important;
          }
          .framer-content body {
            overflow-x: hidden;
          }
        `
      }} />
    </div>
  );
}
