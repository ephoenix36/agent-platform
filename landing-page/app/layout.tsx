import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Optimization Platform | AI-Powered Business Optimization',
  description: 'Evolutionary AI agents that optimize sales, products, education, healthcare, climate solutions, and governance. Achieve 15-75% improvements with evidence-based strategies.',
  keywords: ['AI optimization', 'evolutionary algorithms', 'business optimization', 'sales automation', 'product optimization'],
  authors: [{ name: 'Optimization Platform' }],
  openGraph: {
    title: 'Optimization Platform | AI-Powered Business Optimization',
    description: 'Achieve 15-75% improvements across your business with evolutionary AI agents',
    url: 'https://optimization.ai',
    siteName: 'Optimization Platform',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Optimization Platform | AI-Powered Business Optimization',
    description: 'Achieve 15-75% improvements with evolutionary AI',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
