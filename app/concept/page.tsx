'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFunnelStore } from '@/lib/store';
import { concepts } from '@/lib/concepts';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const stepNames = [
  '링크 입력',
  '제품 요약',
  '컨셉 선택',
  '이미지 업로드',
  '에디터',
  '결과',
];

export default function ConceptPage() {
  const router = useRouter();
  const { summary, setConcept } = useFunnelStore();

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
  }, [summary, router, isHydrated]);

  const handleConceptSelect = (concept: any) => {
    console.log('=== CONCEPT SELECTION ===');
    console.log('Selected concept:', concept);
    console.log('Concept ID:', concept.id);
    console.log('Concept name:', concept.name);
    console.log('=== END CONCEPT SELECTION ===');

    setConcept(concept);
    router.push('/upload');
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

  if (!summary) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <ProgressBar currentStep={3} totalSteps={6} stepNames={stepNames} />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              홍보 컨셉 선택
            </h1>
            <p className="text-gray-600">
              제품에 어울리는 홍보 스타일을 선택해주세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {concepts.map((concept) => (
              <div
                key={concept.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {concept.name}
                  </h3>

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {concept.description}
                  </p>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        자세히 보기
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">
                          {concept.name}
                        </DialogTitle>
                        <DialogDescription className="text-base">
                          {concept.description}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-900 mb-2">
                            📝 문구 템플릿
                          </h4>
                          <div className="text-blue-800 text-sm whitespace-pre-line">
                            {concept.template}
                          </div>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-green-900 mb-2">
                            💡 예시
                          </h4>
                          <div className="text-green-800 text-sm whitespace-pre-line">
                            {concept.example}
                          </div>
                        </div>

                        <div className="flex gap-2 text-xs text-gray-500">
                          <span>톤: {concept.tone}</span>
                          <span>•</span>
                          <span>구조: {concept.structure}</span>
                        </div>

                        <div className="flex gap-3">
                          <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1">
                              닫기
                            </Button>
                          </DialogTrigger>
                          <Button
                            className="flex-1"
                            onClick={() => handleConceptSelect(concept)}
                          >
                            이 컨셉으로 진행
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
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
