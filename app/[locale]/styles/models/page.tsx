'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useFunnelStore } from '@/lib/store';
import { models } from '@/lib/styles';
import { trackEvent } from '@/lib/analytics';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';

export default function ModelsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('styles.models');
  const tStyles = useTranslations('styles');
  const tSteps = useTranslations('steps');
  const tCommon = useTranslations('common');
  
  const { summary, styles, setModel } = useFunnelStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stepNames = [
    tSteps('linkInput'),
    tSteps('productSummary'),
    tSteps('messageType'),
    tSteps('expressionStyle'),
    tSteps('modelComposition'),
    tSteps('aspectRatio'),
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
    if (!styles?.messageType || !styles?.visualStyle) {
      router.push(`/${locale}/styles/expressions`);
      return;
    }
  }, [summary, styles, router, isHydrated, locale]);

  const handleSelect = (optionId: string) => {
    setSelectedId(optionId);
    setModel(optionId);

    trackEvent('style_select', {
      step: 6,
      page: 'models',
      category: 'models',
      option_id: optionId,
      locale,
    });

    router.push(`/${locale}/styles/aspect-ratio`);
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  if (!summary || !styles?.messageType || !styles?.visualStyle) {
    return null;
  }

  const handleStepClick = (stepNumber: number) => {
    const stepRoutes: Record<number, string> = {
      1: `/${locale}`,
      2: `/${locale}/summary`,
      3: `/${locale}/styles/messages`,
      4: `/${locale}/styles/expressions`,
      5: `/${locale}/styles/models`,
      6: `/${locale}/styles/aspect-ratio`,
      7: `/${locale}/upload`,
      8: `/${locale}/editor`,
      9: `/${locale}/result`,
    };
    
    const route = stepRoutes[stepNumber];
    if (route && route !== window.location.pathname) {
      router.push(route);
    }
  };

  return (
    <div className="min-h-screen">
      <ProgressBar 
        currentStep={5} 
        totalSteps={9} 
        stepNames={stepNames}
        onStepClick={handleStepClick}
      />

      <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16 pb-12 md:py-12">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('title')} {tStyles('selectTitle')}
          </h1>
          <p className="text-gray-600">{tStyles('selectDescription')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {models.map((option) => {
              const isSelected = selectedId === option.id;
              // product-ui-only -> productUiOnly, character-mascot -> characterMascot (카멜케이스 변환)
              const optionKey = option.id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
              const label = optionKey.charAt(0).toUpperCase() + optionKey.slice(1);
              
              // 디버깅: 변환 결과 확인
              if (process.env.NODE_ENV === 'development') {
                console.log(`[Models] ID: ${option.id} → Key: ${optionKey}, Label: ${label}`);
              }
              
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

        <div className="mt-8 text-center max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => router.back()}>{tCommon('back')}</Button>
        </div>
      </div>
    </div>
  );
}
