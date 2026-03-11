import type { Metadata, Viewport } from 'next';
import { Outfit, Fraunces, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { LayoutProvider } from '@/lib/layout-context';
import { ClientLayout } from '@/components/ClientLayout';
import { ClientErrorBoundary } from '@/components/ClientErrorBoundary';
import '../styles/globals.css';

/* ========================================
   Font Strategy - Distinctive & Cohesive
   
   Primary (Outfit): Modern geometric sans
   - Distinctive but readable
   - Good for body text & UI
   
   Display (Fraunces): Variable serif
   - Unique character for headings
   - Adds warmth & personality
   
   Mono (JetBrains): Developer-focused
   - Already excellent for code
   - Keep for technical credibility
   ======================================== */

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['SOFT', 'WONK', 'opsz'], // Variable font features
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `ShardDen (砾穴) - Developer Toolkit`,
  description: 'A modular developer toolkit platform',
  manifest: '/manifest.json',
  icons: [
    { url: '/favicon.ico', sizes: 'any' },
    { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', rel: 'apple-touch-icon' },
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#22c55e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`
        ${outfit.variable} 
        ${fraunces.variable} 
        ${jetbrainsMono.variable}
        font-sans
      `}>
        {/* Skip link for keyboard navigation - WCAG requirement */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--accent)] focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          跳转到主要内容
        </a>
        <ThemeProvider>
          <LayoutProvider>
            <ClientErrorBoundary>
              <ClientLayout>{children}</ClientLayout>
            </ClientErrorBoundary>
          </LayoutProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
