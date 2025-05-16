
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Ensure Inter font is imported
import './globals.css';
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';

// Configure Inter font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Use a CSS variable for the font
});

export const metadata: Metadata = {
  title: 'Memoria',
  description: 'Personal Idea Tracker and Family Diary',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Apply the Inter font variable to the body */}
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
