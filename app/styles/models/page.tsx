'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFunnelStore } from '@/lib/store';
import { modelCompositions, getStyleCategoryById } from '@/lib/styles';
import { STEP_NAMES, TOTAL_STEPS } from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import Image from 'next/image';

export default function ModelsPage() {
  const router = useRouter();
  const { summary, styles, setModelComposition } = useFunnelStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!summary) {
      router.push('/');
      return;
    }
    if (!styles?.messageType || !styles?.expressionStyle || !styles?.toneMood) {
      router.push('/styles/messages');
      return;
    }
  }, [summary, styles, router, isHydrated]);

  const handleSelect = (optionId: string) => {
    setModelComposition(optionId);

    trackEvent('style_select', {
      step: 6,
      page: 'models',
      category: 'models',
      option_id: optionId,
    });

    router.push('/upload');
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (
    !summary ||
    !styles?.messageType ||
    !styles?.expressionStyle ||
    !styles?.toneMood
  ) {
    return null;
  }

  const category = getStyleCategoryById('models');

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <ProgressBar
        currentStep={6}
        totalSteps={TOTAL_STEPS}
        stepNames={STEP_NAMES}
      />

      <div className="container mx-auto px-4 pb-12 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {category?.name} 선택
            </h1>
            <p className="text-gray-600">
              원하는 결과물에 비슷한 스타일을 선택해주세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modelCompositions.map((option) => (
              <div
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="p-6">
                  <div className="aspect-video bg-gray-100 rounded-lg mb-4 relative overflow-hidden">
                    <Image
                      src={option.src}
                      alt={option.label}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {option.label}
                  </h3>
                  <p className="text-gray-600 text-sm">{option.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button variant="ghost" onClick={() => router.back()}>
              뒤로가기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
