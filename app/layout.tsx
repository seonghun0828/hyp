import type { Metadata } from 'next';
import { GoogleTagManager } from '@next/third-parties/google';
import './globals.css';
import { inter } from '@/lib/fonts';

export const metadata: Metadata = {
  title: {
    default: 'HYP',
    template: '%s | HYP',
  },
  description: 'Highlight Your Product',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased font-inter`}>
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID!} />
        {children}
      </body>
    </html>
  );
}
