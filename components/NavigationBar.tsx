'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ProfileDisplay from '@/components/auth/ProfileDisplay';

interface NavigationBarProps {
  locale: string;
}

export default function NavigationBar({ locale }: NavigationBarProps) {
  const router = useRouter();

  const handleLogoClick = () => {
    router.push(`/${locale}`);
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-neutral-100 border-b border-neutral-200">
      <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center hover:opacity-80 transition-opacity duration-fast"
            aria-label="Go to homepage"
          >
            <Image
              src="/images/Logo-HYP.png"
              alt="HYP Logo"
              width={60}
              height={25}
              priority
            />
          </button>

          {/* Right side: Language Switcher + Profile */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ProfileDisplay />
          </div>
        </div>
      </div>
    </nav>
  );
}
