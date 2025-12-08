'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFunnelStore } from '@/lib/store';
import { toneMoods, getStyleCategoryById } from '@/lib/styles';
import { trackEvent } from '@/lib/analytics';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import Image from 'next/image';

const stepNames = [
  '링크 입력',
  '제품 요약',
  '메시지 타입',
  '표현 방식',
  '톤 & 무드',
  '모델 구성',
  '이미지 업로드',
  '에디터',
  '결과',
];

export default function TonesMoodsPage() {
  const router = useRouter();
  const { summary, styles, setToneMood } = useFunnelStore();
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
    if (!styles?.messageType || !styles?.expressionStyle) {
      router.push('/styles/messages');
      return;
    }
  }, [summary, styles, router, isHydrated]);

  const handleSelect = (optionId: string) => {
    setToneMood(optionId);

    trackEvent('style_select', {
      step: 5,
      page: 'tones-moods',
      category: 'tones-moods',
      option_id: optionId,
    });

    router.push('/styles/models');
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

  if (!summary || !styles?.messageType || !styles?.expressionStyle) {
    return null;
  }

  const category = getStyleCategoryById('tones-moods');

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <ProgressBar currentStep={5} totalSteps={9} stepNames={stepNames} />

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
            {toneMoods.map((option) => (
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

