'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useFunnelStore } from '@/lib/store';
import { trackEvent } from '@/lib/analytics';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';

export default function AspectRatioPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('styles.aspectRatio');
  const tStyles = useTranslations('styles');
  const tSteps = useTranslations('steps');
  const tCommon = useTranslations('common');
  
  const { summary, styles, setAspectRatio } = useFunnelStore();
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

  const aspectRatioOptions = [
    {
      id: '1:1',
      label: t('square'),
      description: t('squareDesc'),
      ratio: '1:1',
    },
    {
      id: '4:5',
      label: t('vertical'),
      description: t('verticalDesc'),
      ratio: '4:5',
    },
    {
      id: '16:9',
      label: t('horizontal'),
      description: t('horizontalDesc'),
      ratio: '16:9',
    },
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
    if (
      !styles?.messageType ||
      !styles?.visualStyle ||
      !styles?.model
    ) {
      router.push(`/${locale}/styles/models`);
      return;
    }
  }, [summary, styles, router, isHydrated, locale]);

  const handleSelect = (ratioId: string) => {
    setSelectedId(ratioId);
    setAspectRatio(ratioId);

    trackEvent('style_select', {
      step: 6,
      page: 'aspect-ratio',
      category: 'aspect-ratio',
      option_id: ratioId,
      locale,
    });

    router.push(`/${locale}/upload`);
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

  if (
    !summary ||
    !styles?.messageType ||
    !styles?.visualStyle ||
    !styles?.model
  ) {
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
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <ProgressBar 
        currentStep={6} 
        totalSteps={9} 
        stepNames={stepNames}
        onStepClick={handleStepClick}
      />

      <div className="container mx-auto px-4 pb-12 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t('title')}
            </h1>
            <p className="text-gray-600">
              {t('description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aspectRatioOptions.map((option) => {
              const isSelected = selectedId === option.id;
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
                    {/* 비율 시각화 */}
                    <div
                      className={`mb-4 bg-gray-100 rounded-lg flex items-center justify-center ${
                        option.id === '1:1'
                          ? 'aspect-square'
                          : option.id === '4:5'
                          ? 'aspect-[4/5]'
                          : 'aspect-video'
                      }`}
                    >
                      <div className="text-gray-400 text-2xl font-bold">
                        {option.ratio}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {option.label}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {option.description}
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
