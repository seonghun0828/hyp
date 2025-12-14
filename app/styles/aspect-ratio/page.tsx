'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFunnelStore } from '@/lib/store';
import { STEP_NAMES, TOTAL_STEPS } from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';

const aspectRatioOptions = [
  {
    id: '1:1',
    label: '1:1 (정사각형)',
    description: '인스타그램 피드, 트위터/X, 링크드인, 커뮤니티 썸네일 등',
    ratio: '1:1',
  },
  {
    id: '4:5',
    label: '4:5 (세로형)',
    description: '인스타그램 피드, 페이스북, 모바일 중심 SNS',
    ratio: '4:5',
  },
  {
    id: '16:9',
    label: '16:9 (가로형)',
    description: '웹사이트, 랜딩 페이지',
    ratio: '16:9',
  },
];

export default function AspectRatioPage() {
  const router = useRouter();
  const { summary, styles, setAspectRatio } = useFunnelStore();
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
    if (
      !styles?.messageType ||
      !styles?.expressionStyle ||
      !styles?.toneMood ||
      !styles?.modelComposition
    ) {
      router.push('/styles/messages');
      return;
    }
  }, [summary, styles, router, isHydrated]);

  const handleSelect = (ratioId: string) => {
    setAspectRatio(ratioId);

    trackEvent('style_select', {
      step: 7,
      page: 'aspect-ratio',
      category: 'aspect-ratio',
      option_id: ratioId,
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
    !styles?.toneMood ||
    !styles?.modelComposition
  ) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <ProgressBar
        currentStep={7}
        totalSteps={TOTAL_STEPS}
        stepNames={STEP_NAMES}
      />

      <div className="container mx-auto px-4 pb-12 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              콘텐츠 비율 선택
            </h1>
            <p className="text-gray-600">
              생성할 콘텐츠의 목적에 따라 비율을 선택해주세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aspectRatioOptions.map((option) => {
              const isSelected = styles.aspectRatio === option.id;
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
            <Button variant="ghost" onClick={() => router.back()}>
              뒤로가기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
