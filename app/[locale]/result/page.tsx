'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useFunnelStore } from '@/lib/store';
import { generateFileName, getOrCreateSessionId } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import { PromotionPrompt } from '@/components/PromotionPrompt';

export default function ResultPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('result');
  const tSteps = useTranslations('steps');
  const tCommon = useTranslations('common');

  const {
    summary,
    reset,
    setSummary,
    setStyles,
    setImagePrompt,
    setFinalImageUrl: setStoreFinalImageUrl,
  } = useFunnelStore();

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
  const [downloading, setDownloading] = useState(false);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [showPromotion, setShowPromotion] = useState(false);
  const [hasQuickFeedback, setHasQuickFeedback] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);

  // Get locale-specific form ID
  const formId =
    locale === 'ko'
      ? process.env.NEXT_PUBLIC_TALLY_FORM_ID_KO
      : process.env.NEXT_PUBLIC_TALLY_FORM_ID_EN;

  // 상태가 로드될 때까지 기다리는 로딩 상태 추가
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Zustand persist가 hydration을 완료할 때까지 기다림
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // hydration이 완료된 후에만 상태 확인
    if (!isHydrated) return;

    const searchParams = new URLSearchParams(window.location.search);
    const urlResultId = searchParams.get('result-id');

    // URL에 result-id가 있고, 아직 로드하지 않았다면 서버에서 데이터 가져오기
    if (urlResultId && resultId !== urlResultId) {
      const fetchResult = async () => {
        try {
          setIsLoadingResult(true);
          const response = await fetch(`/api/result/${urlResultId}`);

          if (!response.ok) {
            throw new Error('Failed to fetch result');
          }

          const data = await response.json();

          // 받아온 데이터로 로컬 상태 업데이트
          if (data.summary) {
            setSummary(data.summary);
          }

          if (data.generatedContent) {
            if (data.generatedContent.styles) {
              setStyles(data.generatedContent.styles);
            }
            if (data.generatedContent.imagePrompt) {
              setImagePrompt(data.generatedContent.imagePrompt);
            }
            if (data.generatedContent.finalImageUrl) {
              setStoreFinalImageUrl(data.generatedContent.finalImageUrl);
              setFinalImageUrl(data.generatedContent.finalImageUrl);
              sessionStorage.setItem(
                'finalImageUrl',
                data.generatedContent.finalImageUrl
              );
            }
          }

          setResultId(urlResultId);
          sessionStorage.setItem('resultId', urlResultId);
        } catch (error) {
          console.error('Error fetching result:', error);
          // 데이터 로드 실패 시 에러 처리 (선택사항)
        } finally {
          setIsLoadingResult(false);
        }
      };

      fetchResult();
      return; // 비동기 작업 시작했으므로 일단 리턴
    }

    // 로딩 중이면 아래 로직 실행 안 함
    if (isLoadingResult) return;

    // 상태 확인 및 적절한 페이지로 리다이렉트
    // (URL ID가 없거나 로딩 실패해서 데이터가 없는 경우)
    if (!summary && !urlResultId) {
      router.push('/');
      return;
    }

    // sessionStorage에서 finalImageUrl 가져오기
    // (API로 로드된 경우는 위에서 이미 setFinalImageUrl 됨)
    if (!finalImageUrl) {
      const storedImageUrl = sessionStorage.getItem('finalImageUrl');
      if (storedImageUrl) {
        setFinalImageUrl(storedImageUrl);
      } else if (!urlResultId) {
        // finalImageUrl이 없고 URL ID도 없으면 에디터로 리다이렉트
        router.push('/editor');
        return;
      }
    }

    // resultId 처리 (URL에 없고 세션에만 있는 경우)
    if (!resultId) {
      const storedResultId = sessionStorage.getItem('resultId');
      if (storedResultId) {
        setResultId(storedResultId);
      } else if (!urlResultId && finalImageUrl) {
        // 이미지는 있는데 ID가 없는 경우 (예외적 상황)
        console.error('resultId가 없습니다.');
      }
    }

    // 간단 설문 참여 여부 확인
    const quickFeedbackDone = sessionStorage.getItem('quickFeedbackDone');
    if (quickFeedbackDone === 'true') {
      setHasQuickFeedback(true);
    }
  }, [isHydrated, router, resultId, summary, finalImageUrl]);

  const handleQuickFeedback = async (feedback: 'good' | 'neutral' | 'bad') => {
    if (!resultId || hasQuickFeedback) return;

    // 1. 즉시 UI 반영 (optimistic update)
    sessionStorage.setItem('quickFeedbackDone', 'true');
    setHasQuickFeedback(true);

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
      const response = await fetch(finalImageUrl);
      if (!response.ok)
        throw new Error(t('errorDownloadFailed', { status: response.status }));
      const blob = await response.blob();
      const fileName = generateFileName(summary.title || summary.core_value);

      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1);

      // 조건: iOS이면서 + 공유 API를 지원하는 경우
      if (isIOS && navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: 'image/png' });

        // 파일 공유가 가능한지 한 번 더 체크
        if (navigator.canShare({ files: [file] })) {
          alert(t('iosShareHint'));
          try {
            await navigator.share({
              files: [file],
            });
            // 공유 성공 시 여기서 종료
            return;
          } catch (shareError) {
            // 사용자가 공유 창을 닫거나 취소한 경우 (AbortError)는 조용히 무시
            if ((shareError as Error).name !== 'AbortError') {
              alert(t('iosShareFallback'));
              console.error('공유 실패, 다운로드로 전환합니다:', shareError);
              // 공유 실패 시 아래의 다운로드 로직으로 진행
            } else {
              // 취소한 경우는 다운로드도 하지 않음
              return;
            }
          }
        }
      }

      // [기존 다운로드 로직] - 안드로이드, PC, 또는 공유 실패 시 실행
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // 홍보 팝업 (공유나 다운로드 성공 후 1초 뒤)
      setTimeout(() => {
        setShowPromotion(true);
      }, 1000);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  // 기존 다운로드 로직을 분리한 헬퍼 함수
  const downloadFile = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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
  if (!isHydrated || isLoadingResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isLoadingResult ? t('loadingResult') : tCommon('loading')}
          </p>
        </div>
      </div>
    );
  }

  if (!summary || !finalImageUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loadingImage')}</p>
        </div>
      </div>
    );
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
        currentStep={9}
        totalSteps={9}
        stepNames={stepNames}
        onStepClick={handleStepClick}
      />

      <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16 pb-12 md:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t('completionTitle')}
            </h1>
            <p className="text-gray-600">{t('completionDescription')}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* 완성된 이미지 */}
            <div className="p-8">
              <div className="flex justify-center items-center mb-6">
                <img
                  src={finalImageUrl}
                  alt={t('completedImageAlt')}
                  className="rounded-lg shadow-md mx-auto"
                />
              </div>

              {/* 간단 설문 CTA */}
              {!hasQuickFeedback && (
                <div className="mb-6 text-center">
                  <p className="text-lg font-medium text-gray-700 mb-4">
                    {t('feedbackQuestion')}
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => handleQuickFeedback('good')}
                      className="cursor-pointer flex flex-col items-center gap-2 md:px-6 px-3 py-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <span className="text-2xl">👍</span>
                      <span className="text-sm font-medium text-gray-700">
                        {t('feedbackGood')}
                      </span>
                    </button>
                    <button
                      onClick={() => handleQuickFeedback('neutral')}
                      data-tally-open={formId}
                      data-tally-hide-title="1"
                      data-tally-emoji-text="📝"
                      data-tally-emoji-animation="wave"
                      className="cursor-pointer flex flex-col items-center gap-2 md:px-6 px-3 py-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <span className="text-2xl">🤔</span>
                      <span className="text-sm font-medium text-gray-700">
                        {t('feedbackNeutral')}
                      </span>
                    </button>
                    <button
                      onClick={() => handleQuickFeedback('bad')}
                      data-tally-open={formId}
                      data-tally-hide-title="1"
                      data-tally-emoji-text="📝"
                      data-tally-emoji-animation="wave"
                      className="cursor-pointer flex flex-col items-center gap-2 md:px-6 px-3 py-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <span className="text-2xl">👎</span>
                      <span className="text-sm font-medium text-gray-700">
                        {t('feedbackBad')}
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
                  {downloading ? t('downloading') : t('downloadButton')}
                </Button>

                <Button
                  onClick={handleNewProject}
                  variant="outline"
                  size="lg"
                  className="flex-1 sm:flex-none"
                >
                  {t('createNew')}
                </Button>
              </div>
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="max-w-2xl mx-auto mt-8 text-center">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600 text-sm whitespace-pre-line">
                {t('contentFooter')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 홍보 팝업 */}
      {showPromotion && resultId && (
        <PromotionPrompt
          resultId={resultId}
          onClose={() => {
            setShowPromotion(false);
          }}
        />
      )}
    </div>
  );
}
