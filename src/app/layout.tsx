
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

// Aggressively simplified metadata to troubleshoot hydration error
export const metadata: Metadata = {
  title: 'Memoria',
  description: 'Personal Idea Tracker and Family Diary',
  manifest: '/manifest.json',
  themeColor: '#1A9EFF', // Single theme color
  icons: {
    icon: '/icons/icon-192x192.png', // Basic icon
    apple: '/icons/icon-192x192.png', // Basic apple touch icon
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Ensure no <head> tag is manually placed here by RootLayout */}
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
