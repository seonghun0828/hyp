'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useFunnelStore } from '@/lib/store';
import { getConceptById } from '@/lib/concepts';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';

const stepNames = [
  '링크 입력',
  '제품 요약',
  '컨셉 선택',
  '이미지 업로드',
  '에디터',
  '결과',
];

export default function ConceptPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const { summary, setConcept } = useFunnelStore();

  const conceptId = params.id as string;
  const concept = getConceptById(conceptId);

  // 상태가 로드될 때까지 기다리는 로딩 상태 추가
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Zustand persist가 hydration을 완료할 때까지 기다림
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // hydration이 완료된 후에만 상태 확인
    if (!isHydrated) return;

    // 상태 확인 및 적절한 페이지로 리다이렉트
    if (!summary) {
      router.push('/');
      return;
    }
    if (!concept) {
      router.push('/concept');
      return;
    }
  }, [summary, concept, router, isHydrated]);

  const handleConfirm = () => {
    if (concept) {
      setConcept(concept);
      router.push('/upload');
    }
  };

  // hydration이 완료되기 전에는 로딩 표시
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!summary || !concept) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <ProgressBar currentStep={3} totalSteps={6} stepNames={stepNames} />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {concept.name} 컨셉 미리보기
            </h1>
            <p className="text-gray-600">
              선택한 컨셉으로 생성될 홍보 콘텐츠의 스타일을 확인해보세요
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* 예시 이미지 영역 */}
            <div className="h-96 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">🎨</div>
                <p className="text-lg font-medium">컨셉 예시 이미지</p>
                <p className="text-sm mt-2">{concept.name} 스타일</p>
              </div>
            </div>

            {/* 컨셉 정보 */}
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {concept.name}
              </h2>

              <p className="text-gray-600 mb-6 text-lg">
                {concept.description}
              </p>

              {/* 제품 정보 미리보기 */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  적용될 제품 정보
                </h3>
                <div className="space-y-2 text-gray-700">
                  <p>
                    <span className="font-medium">제품명:</span> {summary.title}
                  </p>
                  <p>
                    <span className="font-medium">설명:</span>{' '}
                    {summary.description}
                  </p>
                  <p>
                    <span className="font-medium">주요 기능:</span>{' '}
                    {summary.features.join(', ')}
                  </p>
                  <p>
                    <span className="font-medium">타겟 고객:</span>{' '}
                    {summary.targetUsers.join(', ')}
                  </p>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  뒤로가기
                </Button>
                <Button onClick={handleConfirm} className="flex-1">
                  이 컨셉으로 진행
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
