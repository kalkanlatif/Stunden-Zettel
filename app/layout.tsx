import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Kalkan Stundenzettel',
  description: 'Digitale Arbeitszeiterfassung gem. § 17 MiLoG',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          {children}
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
