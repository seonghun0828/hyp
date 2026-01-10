'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useFunnelStore } from '@/lib/store';
import { messageTypes } from '@/lib/styles';
import { trackEvent } from '@/lib/analytics';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import Image from 'next/image';

export default function MessagesPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('styles.messages');
  const tStyles = useTranslations('styles');
  const tSteps = useTranslations('steps');
  const tCommon = useTranslations('common');
  
  const { summary, setMessageType } = useFunnelStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stepNames = [
    tSteps('linkInput'),
    tSteps('productSummary'),
    tSteps('messageType'),
    tSteps('imageUpload'),
    tSteps('editor'),
    tSteps('result'),
  ];

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!summary) {
      router.push(`/${locale}`);
      return;
    }
  }, [summary, router, isHydrated, locale]);

  const handleSelect = (optionId: string) => {
    setSelectedId(optionId);
    setMessageType(optionId);

    trackEvent('style_select', {
      step: 3,
      page: 'messages',
      category: 'messages',
      option_id: optionId,
      locale,
    });

    router.push(`/${locale}/styles/expressions`);
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <ProgressBar
        currentStep={3}
        totalSteps={6}
        stepNames={stepNames}
      />

      <div className="container mx-auto px-4 pb-12 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t('title')} {tStyles('selectTitle')}
            </h1>
            <p className="text-gray-600">
              {tStyles('selectDescription')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {messageTypes.map((option) => {
              const isSelected = selectedId === option.id;
              // problem-solving -> problemSolving (카멜케이스 변환)
              const optionKey = option.id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
              const label = optionKey.charAt(0).toUpperCase() + optionKey.slice(1);
              
              return (
                <div
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer border-2 ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-300'
                      : 'border-transparent'
                  }`}
                >
                  <div className="p-6">
                    <div className="aspect-video bg-gray-100 rounded-lg mb-4 relative overflow-hidden">
                      <Image
                        src={option.src}
                        alt={t(optionKey as any) || label}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {t(optionKey as any) || label}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {t(`${optionKey}Desc` as any) || option.aiPrompt}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedId(null);
                router.back();
              }}
            >
              {tCommon('back')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
