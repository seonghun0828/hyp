'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface CreditGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCredits: number | null;
  onOpenRecharge: () => void;
  isLoggedIn: boolean;
}

export default function CreditGuideModal({
  open,
  onOpenChange,
  currentCredits,
  onOpenRecharge,
  isLoggedIn,
}: CreditGuideModalProps) {
  const t = useTranslations('creditGuide');
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Current Credits */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg">
            <span className="text-sm text-gray-500 mb-1">{t('currentCredits')}</span>
            <div className="text-3xl font-bold text-primary flex items-center gap-2">
              <span>🪙</span>
              <span>{currentCredits?.toLocaleString() ?? 0}</span>
            </div>
          </div>

          {/* Accordions */}
          <div className="space-y-2">
            <AccordionItem title={t('whatIsCredit.title')}>
              <div className="space-y-2 text-sm text-gray-600 leading-relaxed">
                <p className="whitespace-pre-line">
                  {t('whatIsCredit.content1')}
                  <br />
                  <span className="font-semibold text-gray-900">
                    {t('whatIsCredit.highlight1')}
                  </span>
                  {t('whatIsCredit.content1End')}
                  <br />
                  {t('whatIsCredit.note')}
                </p>
                <p className="whitespace-pre-line">
                  {t('whatIsCredit.content2')}
                  <br />
                  <span className="font-semibold text-gray-900">
                    {t('whatIsCredit.highlight2')}
                  </span>
                  {t('whatIsCredit.content2End')}
                </p>
              </div>
            </AccordionItem>

            <AccordionItem title={t('howToRecharge.title')}>
              <div className="space-y-2 text-sm text-gray-600 leading-relaxed">
                <p className="whitespace-pre-line">
                  {t('howToRecharge.content1')}{' '}
                  <span className="font-semibold text-gray-900">
                    {t('howToRecharge.highlight1')}
                  </span>
                  {t('howToRecharge.content1End')}
                  <br />
                  {t('howToRecharge.content2')}{' '}
                  <span className="font-semibold text-gray-900">{t('howToRecharge.highlight2')}</span>
                  {t('howToRecharge.content2End')}
                </p>
                <p>{t('howToRecharge.content3')}</p>
              </div>
            </AccordionItem>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              onOpenChange(false);
              onOpenRecharge();
            }}
          >
            {isLoggedIn ? t('rechargeButton') : t('loginButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AccordionItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        className={`transition-all duration-200 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden bg-gray-50`}
      >
        <div className="p-4 border-t border-gray-100">{children}</div>
      </div>
    </div>
  );
}
