import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tutela | Early Disease Detection for Pigs - AI-Powered Livestock Monitoring",
  description: "Monitor your animals' health 24/7 with thermal imaging, AI, and real-time alerts. Early disease detection can cut mortality by up to 50% and reduce antibiotic use by 30-40%. Built for African farmers with blockchain verification on Hedera.",
  keywords: [
    "livestock monitoring",
    "pig health monitoring",
    "early disease detection",
    "thermal imaging",
    "AI agriculture",
    "livestock management",
    "African farming",
    "blockchain agriculture",
    "Hedera blockchain",
    "animal health tracking",
    "farm automation",
    "precision livestock farming"
  ],
  authors: [{ name: "Tutela" }],
  creator: "Tutela",
  publisher: "Tutela",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://tutela.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Tutela | Early Disease Detection for Pigs - AI-Powered Livestock Monitoring",
    description: "Monitor your animals' health 24/7 with thermal imaging, AI, and real-time alerts. Early disease detection can cut mortality by up to 50% and reduce antibiotic use by 30-40%. Built for African farmers with blockchain verification on Hedera.",
    url: '/',
    siteName: 'Tutela',
    images: [
      {
        url: '/logo.jpg',
        width: 1200,
        height: 630,
        alt: 'Tutela Logo - AI-Powered Livestock Monitoring',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Tutela | Early Disease Detection for Pigs",
    description: "Monitor your animals' health 24/7 with AI, thermal imaging, and blockchain-verified alerts. Built for African farmers.",
    images: ['/logo.jpg'],
    creator: '@tutela',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {

  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
