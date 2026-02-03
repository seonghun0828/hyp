import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { GoogleTagManager } from '@next/third-parties/google';
import { recursive } from '@/lib/fonts';
import NavigationBar from '@/components/NavigationBar';
import AuthProvider from '@/components/auth/AuthProvider';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import '../globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKorean = locale === 'ko';

  return {
    title: {
      default: isKorean
        ? 'HYP - 제품 홍보 콘텐츠 생성'
        : 'HYP - Product Promotion Generator',
      template: '%s | HYP',
    },
    description: isKorean
      ? 'AI가 제안하고 당신이 선택해 완성합니다. 단 몇 초 만에 홍보 콘텐츠를 만들어보세요.'
      : 'AI suggests, you choose and complete. Create promotional content in just minutes.',
    openGraph: {
      locale: isKorean ? 'ko_KR' : 'en_US',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${recursive.variable} antialiased font-recursive bg-neutral-100`}>
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID!} />
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <NavigationBar locale={locale} />
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
