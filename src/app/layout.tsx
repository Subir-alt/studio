
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Memoria',
  description: 'Personal Idea Tracker and Family Diary',
  manifest: '/manifest.json', 
  formatDetection: {
    telephone: false, 
  },
  themeColor: [ 
    { media: '(prefers-color-scheme: light)', color: '#1A9EFF' }, // Primary light (hsl(205 90% 50%))
    { media: '(prefers-color-scheme: dark)', color: '#66BFFF' },  // Primary dark (hsl(205 80% 60%))
  ],
  icons: {
    icon: [ 
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: ['/icons/icon-96x96.png'], 
    apple: [ 
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true, 
    title: "Memoria", 
    statusBarStyle: 'default', 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
