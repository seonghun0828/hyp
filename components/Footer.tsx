'use client';

import { useTranslations } from 'next-intl';

export default function Footer() {
  const tFooter = useTranslations('footer');

  return (
    <footer className="border-t border-gray-200 bg-white/20 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          {/* Copyright */}
          <p className="text-sm text-gray-600">{tFooter('copyright')}</p>

          {/* Links */}
          <div className="flex gap-6 text-sm">
            <a
              href="https://cherry-diascia-425.notion.site/HYP-Terms-of-Service-2ef955a05ff280509903f1687f79830c"
              className="text-gray-600 hover:text-blue-600 transition-colors"
              target="_blank"
            >
              {tFooter('termsOfService')}
            </a>
            <a
              href="https://cherry-diascia-425.notion.site/HYP-Privacy-Policy-2ef955a05ff28091836ef746b1c7f85e"
              className="text-gray-600 hover:text-blue-600 transition-colors"
              target="_blank"
            >
              {tFooter('privacyPolicy')}
            </a>
            <a
              href="https://cherry-diascia-425.notion.site/HYP-Pricing-Policy-2ef955a05ff28094a84df47a641e65dd"
              className="text-gray-600 hover:text-blue-600 transition-colors"
              target="_blank"
            >
              {tFooter('pricing')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
