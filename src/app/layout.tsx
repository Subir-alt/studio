
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

// Aggressively simplified metadata to try and resolve any hydration errors
// This ensures Next.js has minimal, valid data to construct the <head>
export const metadata: Metadata = {
  title: 'Memoria',
  description: 'Personal Idea Tracker and Family Diary',
  manifest: '/manifest.json', // Ensure manifest.json is correct and icons exist
  // themeColor: '#1A9EFF', // Keeping it minimal for now
  // icons: { // Keeping it minimal
  //   icon: '/icons/icon-192x192.png',
  //   apple: '/icons/icon-192x192.png',
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* 
        Ensure no <head> tag is manually placed here by RootLayout.
        Next.js handles <head> generation based on the 'metadata' object exported above.
        The 'suppressHydrationWarning' on <html> and <body> can help with minor mismatches,
        but structural errors (like invalid children in <head>) need to be fixed by ensuring
        the 'metadata' object is correctly formed and there's no manual <head> JSX here.
      */}
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
