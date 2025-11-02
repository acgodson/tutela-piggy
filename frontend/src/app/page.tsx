import Link from 'next/link';

import LandingLayout from '@/components/layouts/landingLayout';

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
    <LandingLayout>

      <div className="pt-16">
        {landingPageHtml ? (
          <div
            dangerouslySetInnerHTML={{ __html: landingPageHtml }}
            className="framer-content"
            suppressHydrationWarning
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

    </LandingLayout>
  );
}
