import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { LayoutProvider } from '@/lib/layout-context';
import { ClientLayout } from '@/components/ClientLayout';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ShardDen (砾穴) - Developer Toolkit',
  description: 'A modular developer toolkit platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.className} ${jetbrainsMono.className}`}>
        <ThemeProvider>
          <LayoutProvider>
            <ClientLayout>{children}</ClientLayout>
          </LayoutProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
