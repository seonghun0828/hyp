'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFunnelStore } from '@/lib/store';
import { generateFileName, getOrCreateSessionId } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import { FeedbackPrompt } from '@/components/FeedbackPrompt';
import { PromotionPrompt } from '@/components/PromotionPrompt';

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

export default function ResultPage() {
  const router = useRouter();
  const { summary, reset } = useFunnelStore();
  const [downloading, setDownloading] = useState(false);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showPromotion, setShowPromotion] = useState(false);
  const [hasQuickFeedback, setHasQuickFeedback] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [lastQuickFeedback, setLastQuickFeedback] = useState<
    'good' | 'neutral' | 'bad' | null
  >(null);

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

    // sessionStorage에서 finalImageUrl 가져오기
    const storedImageUrl = sessionStorage.getItem('finalImageUrl');
    if (storedImageUrl) {
      setFinalImageUrl(storedImageUrl);
    } else {
      // finalImageUrl이 없으면 에디터로 리다이렉트
      router.push('/editor');
      return;
    }

    // resultId 가져오기 (우선순위: URL 쿼리 파라미터 > sessionStorage)
    const searchParams = new URLSearchParams(window.location.search);
    const urlResultId = searchParams.get('result-id');
    const storedResultId = sessionStorage.getItem('resultId');

    const finalResultId = urlResultId || storedResultId;

    if (!finalResultId) {
      // resultId가 없으면 에러 처리
      console.error('resultId가 없습니다. 결과물을 불러올 수 없습니다.');
      router.push('/editor');
      return;
    }

    // URL에서 가져온 경우 sessionStorage에도 저장
    if (urlResultId && !storedResultId) {
      sessionStorage.setItem('resultId', urlResultId);
    }

    setResultId(finalResultId);

    // 간단 설문 참여 여부 확인
    const quickFeedbackDone = sessionStorage.getItem('quickFeedbackDone');
    if (quickFeedbackDone === 'true') {
      setHasQuickFeedback(true);
    }
  }, [summary, router, isHydrated]);

  const handleQuickFeedback = async (feedback: 'good' | 'neutral' | 'bad') => {
    if (!resultId || hasQuickFeedback) return;

    // 1. 즉시 UI 반영 (optimistic update)
    sessionStorage.setItem('quickFeedbackDone', 'true');
    setHasQuickFeedback(true);
    setLastQuickFeedback(feedback);

    // 2. 이벤트 추적
    trackEvent('quick_feedback', {
      step: 6,
      page: 'result',
      action: 'quick_feedback',
      feedback,
    });

    // 3. 백그라운드에서 API 요청 (await 없이)
    try {
      const userId = getOrCreateSessionId();

      fetch('/api/quick-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          resultId,
          quickFeedback: feedback,
        }),
      }).catch((err) => {
        console.error('Failed to save quick feedback:', err);
        // 에러 발생해도 UI는 이미 반영되었으므로 그대로 유지
      });
    } catch (err) {
      console.error('Failed to save quick feedback:', err);
    }

    // 4. 피드백에 따라 다른 모달 표시
    if (feedback === 'good') {
      // good이면 홍보 팝업 표시
      setShowPromotion(true);
    } else {
      // neutral 또는 bad면 바로 피드백 모달 표시
      setShowFeedback(true);
    }
  };

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

      // 다운로드 후 1초 뒤 홍보 팝업 표시 (피드백 선택 여부와 관계없이)
      setTimeout(() => {
        setShowPromotion(true);
      }, 1000);
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
    sessionStorage.removeItem('resultId');
    sessionStorage.removeItem('quickFeedbackDone');
    reset();
    router.push('/');
  };

  // hydration이 완료되기 전에는 로딩 표시
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

  if (!summary || !finalImageUrl) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">이미지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <ProgressBar currentStep={9} totalSteps={9} stepNames={stepNames} />

      <div className="container mx-auto px-4 pb-12 md:py-12">
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

              {/* 간단 설문 CTA */}
              {!hasQuickFeedback && (
                <div className="mb-6 text-center">
                  <p className="text-lg font-medium text-gray-700 mb-4">
                    이 결과, 어땠나요?
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => handleQuickFeedback('good')}
                      className="cursor-pointer flex flex-col items-center gap-2 px-6 py-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <span className="text-2xl">👍</span>
                      <span className="text-sm font-medium text-gray-700">
                        좋았어요
                      </span>
                    </button>
                    <button
                      onClick={() => handleQuickFeedback('neutral')}
                      className="cursor-pointer flex flex-col items-center gap-2 px-6 py-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <span className="text-2xl">🤔</span>
                      <span className="text-sm font-medium text-gray-700">
                        보통이에요
                      </span>
                    </button>
                    <button
                      onClick={() => handleQuickFeedback('bad')}
                      className="cursor-pointer flex flex-col items-center gap-2 px-6 py-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <span className="text-2xl">👎</span>
                      <span className="text-sm font-medium text-gray-700">
                        별로예요
                      </span>
                    </button>
                  </div>
                </div>
              )}

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
              <p className="text-gray-600 text-sm">
                이 콘텐츠는 HYP(Highlight Your Product)로 생성되었습니다.
                <br />
                SNS나 마케팅에 자유롭게 활용하세요!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 홍보 팝업 */}
      {showPromotion && (
        <PromotionPrompt
          onClose={() => {
            setShowPromotion(false);
            // 홍보 팝업 닫으면 피드백 모달 표시
            setShowFeedback(true);
          }}
          onAgree={() => {
            // 동의하기 처리 (나중에 API 호출 등 추가 가능)
            console.log('Promotion agreed');
          }}
        />
      )}

      {/* 피드백 팝업 */}
      {showFeedback && (
        <FeedbackPrompt onClose={() => setShowFeedback(false)} />
      )}
    </div>
  );
}
