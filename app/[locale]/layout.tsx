import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { GoogleTagManager } from '@next/third-parties/google';
import Script from 'next/script';
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
        ? 'HYP - 뭘 올려야 할지 몰라서, 아직도 못 올리고 있다면'
        : 'HYP - From nothing to post-ready content for your product',
      template: '%s | HYP',
    },
    description: isKorean
      ? '제품 링크 하나로 SNS에 올릴 수 있는 이미지 기반 콘텐츠를 만들어줍니다. 일단 시작해보세요.'
      : 'Turn your product into post-ready visuals and messages — even if you don’t know where to start.',
    openGraph: {
      locale: isKorean ? 'ko_KR' : 'en_US',
      images: '/og-image.png',
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
      <body
        className={`${recursive.variable} antialiased font-recursive bg-neutral-100`}
      >
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID!} />
        <Script src="https://tally.so/widgets/embed.js" strategy="lazyOnload" />
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
