'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { locales, type Locale } from '@/i18n';

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale();

  const switchLanguage = (newLocale: Locale) => {
    // Save to cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;

    // Replace locale in pathname
    const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  const getOtherLocale = (): Locale => {
    return currentLocale === 'ko' ? 'en' : 'ko';
  };

  const getLanguageDisplay = (locale: Locale) => {
    return locale === 'ko' ? '🇰🇷 KO' : '🇺🇸 EN';
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      <button
        onClick={() => switchLanguage(getOtherLocale())}
        className="bg-white/90 backdrop-blur-xs px-3 py-2 rounded-full shadow-sm border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1"
        aria-label="Switch language"
      >
        {getLanguageDisplay(getOtherLocale())}
      </button>
    </div>
  );
}

