'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFunnelStore } from '@/lib/store';
import { generateFileName } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import { FeedbackPrompt } from '@/components/FeedbackPrompt';
import { useButtonVisibilityFeedback } from '@/hooks/useButtonVisibilityFeedback';

const stepNames = [
  '링크 입력',
  '제품 요약',
  '컨셉 선택',
  '이미지 업로드',
  '에디터',
  '결과',
];

export default function ResultPage() {
  const router = useRouter();
  const { summary, reset } = useFunnelStore();
  const [downloading, setDownloading] = useState(false);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // 상태가 로드될 때까지 기다리는 로딩 상태 추가
  const [isHydrated, setIsHydrated] = useState(false);

  // 버튼 가시성 감지
  const shouldShowFeedback = useButtonVisibilityFeedback();

  useEffect(() => {
    // Zustand persist가 hydration을 완료할 때까지 기다림
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (shouldShowFeedback) {
      setShowFeedback(true);
    }
  }, [shouldShowFeedback]);

  useEffect(() => {
    // hydration이 완료된 후에만 상태 확인
    if (!isHydrated) return;

    // 상태 확인 및 적절한 페이지로 리다이렉트
    if (!summary) {
      router.push('/');
      return;
    }

    // sessionStorage에서 finalImageUrl 가져오기
    const storedImageUrl = sessionStorage.getItem('finalImageUrl');
    if (storedImageUrl) {
      setFinalImageUrl(storedImageUrl);
    } else {
      // finalImageUrl이 없으면 에디터로 리다이렉트
      router.push('/editor');
      return;
    }
  }, [summary, router, isHydrated]);

  const handleDownload = async () => {
    if (!finalImageUrl || !summary) return;

    setDownloading(true);

    // 이벤트 추적
    trackEvent('download', {
      step: 6,
      page: 'result',
      action: 'download',
    });

    try {
      // Base64 이미지를 Blob으로 변환
      const response = await fetch(finalImageUrl);
      const blob = await response.blob();

      // 다운로드 링크 생성
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generateFileName(summary.title || summary.core_value);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
    } finally {
      setDownloading(false);
    }
  };

  const handleNewProject = () => {
    // 이벤트 추적
    trackEvent('new_project', {
      step: 6,
      page: 'result',
      action: 'new_project',
    });

    // sessionStorage도 초기화
    sessionStorage.removeItem('finalImageUrl');
    reset();
    router.push('/');
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

  if (!summary || !finalImageUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">이미지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <ProgressBar currentStep={6} totalSteps={6} stepNames={stepNames} />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🎉 홍보 콘텐츠 완성
            </h1>
            <p className="text-gray-600">
              AI와 함께 만든 멋진 작품이 완성됐습니다!
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* 완성된 이미지 */}
            <div className="p-8">
              <div className="flex justify-center items-center mb-6">
                <img
                  src={finalImageUrl}
                  alt="완성된 홍보 콘텐츠"
                  className="rounded-lg shadow-md mx-auto"
                />
              </div>

              {/* 제품 정보 요약 */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  생성된 콘텐츠 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">제품명</p>
                    <p className="text-gray-600">
                      {summary.title || summary.core_value}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">원본 링크</p>
                    <p className="text-gray-600 break-all">{summary.url}</p>
                  </div>
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="button-container flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleDownload}
                  loading={downloading}
                  size="lg"
                  className="flex-1 sm:flex-none"
                >
                  {downloading ? '다운로드 중...' : 'PNG 다운로드'}
                </Button>

                <Button
                  onClick={handleNewProject}
                  variant="outline"
                  size="lg"
                  className="flex-1 sm:flex-none"
                >
                  새로 만들기
                </Button>
              </div>
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="mt-8 text-center">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                HYP로 만든 콘텐츠
              </h3>
              <p className="text-gray-600 text-sm">
                이 콘텐츠는 HYP(Highlight Your Product)로 생성되었습니다.
                <br />
                SNS나 마케팅에 자유롭게 활용하세요!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 피드백 팝업 */}
      {showFeedback && (
        <FeedbackPrompt onClose={() => setShowFeedback(false)} />
      )}
    </div>
  );
}
