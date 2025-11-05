'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFunnelStore } from '@/lib/store';
import { trackEvent } from '@/lib/analytics';
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

export default function UploadPage() {
  const router = useRouter();
  const {
    concept,
    summary,
    setImageUrl,
    setImagePrompt,
    setSuccessTexts,
    successTexts,
  } = useFunnelStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SUCCESs 문구 생성 관련 상태 (백그라운드에서만 사용)
  const [textsGenerating, setTextsGenerating] = useState(false);
  const [textsReady, setTextsReady] = useState(false);

  // 이미지 프롬프트 생성 관련 상태 (Promise로 관리)
  const imagePromptPromiseRef = useRef<Promise<string> | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      setError('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 문구 생성 대기하지 않고 즉시 진행
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImageUrl(result);
        // 직접 업로드임을 명시적으로 표시
        setImagePrompt('[USER_UPLOADED]');

        // 이벤트 추적
        trackEvent('image_ready', {
          step: 4,
          page: 'upload',
          method: 'upload',
        });

        router.push('/editor');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleAIGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      // Promise가 없으면 여기서 생성 (fallback)
      if (!imagePromptPromiseRef.current) {
        if (!summary) {
          throw new Error('제품 정보가 없습니다.');
        }

        imagePromptPromiseRef.current = (async () => {
          const response = await fetch('/api/generate-image-prompt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              summary: summary,
            }),
          });

          if (!response.ok) {
            throw new Error('이미지 프롬프트 생성에 실패했습니다.');
          }

          const data = await response.json();
          return data.imagePrompt;
        })();
      }

      // 프롬프트 준비될 때까지 대기
      const prompt = await imagePromptPromiseRef.current;

      // 프롬프트를 store에 저장
      setImagePrompt(prompt);

      // 이미지 생성
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imagePrompt: prompt,
        }),
      });

      if (!response.ok) {
        throw new Error('이미지 생성에 실패했습니다.');
      }

      const data = await response.json();
      setImageUrl(data.imageUrl);

      // 이벤트 추적
      trackEvent('image_ready', {
        step: 4,
        page: 'upload',
        method: 'ai_generate',
      });

      router.push('/editor');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 상태가 로드될 때까지 기다리는 로딩 상태 추가
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Zustand persist가 hydration을 완료할 때까지 기다림
    setIsHydrated(true);
  }, []);

  // 캐시된 데이터를 한번에 가져오는 함수
  const generateSuccessTextsFromCache = async () => {
    setTextsGenerating(true);
    try {
      const response = await fetch('/api/generate-success-texts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: summary?.url,
          conceptName: concept?.name,
          summary,
          concept,
        }),
      });

      if (!response.ok) {
        throw new Error('SUCCESs 문구 생성에 실패했습니다.');
      }

      const data = await response.json();
      setSuccessTexts(data.texts);
      setTextsReady(true);
    } catch (err) {
      setError('문구 생성 중 오류가 발생했습니다.');
    } finally {
      setTextsGenerating(false);
    }
  };

  // SUCCESs 문구 생성 함수 (SSE 스트리밍)
  const generateSuccessTextsStreaming = async () => {
    // 🔥 중요: SSE 시작 전에 완전히 초기화
    setSuccessTexts(undefined);
    setTextsGenerating(true);

    // 로컬 상태로 SSE 데이터 관리
    let streamingTexts: any = {};

    try {
      // POST 요청으로 SSE 스트림 시작
      const response = await fetch('/api/generate-success-texts-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: summary?.url,
          conceptName: concept?.name,
          summary,
          concept,
        }),
      });

      if (!response.ok) {
        throw new Error('SUCCESs 문구 생성에 실패했습니다.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('스트림을 읽을 수 없습니다.');
      }

      let buffer = '';
      let completedCount = 0;
      const totalCount = 6;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          setTextsReady(true);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const { principle, text, completed, total, cached } = data;

              // 로컬 상태에 추가
              streamingTexts[principle] = text;

              // 즉시 successTexts 업데이트
              setSuccessTexts({ ...streamingTexts } as any);

              completedCount = completed;

              // 모든 원칙이 완료되면 준비 완료
              if (completed === total) {
                setTextsReady(true);
              }
            } catch (error) {}
          }
        }
      }
    } catch (err) {
      setError('문구 생성 중 오류가 발생했습니다.');
    } finally {
      setTextsGenerating(false);
    }
  };

  // URL 변경 감지 및 문구 생성
  const [lastSummaryUrl, setLastSummaryUrl] = useState<string | null>(null);
  const [lastConceptId, setLastConceptId] = useState<string | null>(null);

  useEffect(() => {
    if (isHydrated && summary) {
      const currentUrl = summary.url;

      // URL이 변경되었을 때 successTexts 초기화
      if (lastSummaryUrl && lastSummaryUrl !== currentUrl) {
        setSuccessTexts(undefined);
        setTextsReady(false);
        setTextsGenerating(false);
      }

      setLastSummaryUrl(currentUrl);
    }
  }, [summary, isHydrated, lastSummaryUrl, setSuccessTexts]);

  // 컨셉 변경 감지 로직 제거 - API가 캐시 키로 처리하므로 불필요

  // 캐시 확인 후 초기화 함수
  const checkCacheAndInitialize = async () => {
    if (!summary || !concept) return;

    const cacheKey = `${summary.url}_${concept.name}`;

    try {
      const response = await fetch('/api/check-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cacheKey }),
      });

      const { exists } = await response.json();

      if (!exists) {
        // 캐시가 없으면 SSE로 새로 생성
        setSuccessTexts(undefined);
        setTextsReady(false);
        setTextsGenerating(false);
        generateSuccessTextsStreaming();
      } else {
        // 캐시가 있으면 기존 API로 한번에 가져오기
        generateSuccessTextsFromCache();
      }
    } catch (error) {
      // 에러 시에도 새로 생성 (SSE 스트리밍)
      setSuccessTexts(undefined);
      generateSuccessTextsStreaming();
    }
  };

  // 페이지 진입 시 캐시 확인 후 처리
  useEffect(() => {
    if (isHydrated && summary && concept) {
      checkCacheAndInitialize();
    }
  }, [isHydrated, summary, concept]);

  // 페이지 진입 시 이미지 프롬프트 미리 생성 (Promise로 시작)
  useEffect(() => {
    if (isHydrated && summary && !imagePromptPromiseRef.current) {
      imagePromptPromiseRef.current = (async () => {
        const response = await fetch('/api/generate-image-prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: summary,
          }),
        });

        if (!response.ok) {
          throw new Error('이미지 프롬프트 생성에 실패했습니다.');
        }

        const data = await response.json();
        // 프롬프트를 store에 저장
        setImagePrompt(data.imagePrompt);
        return data.imagePrompt;
      })();
    }
  }, [isHydrated, summary, setImagePrompt]);

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
      <ProgressBar currentStep={4} totalSteps={6} stepNames={stepNames} />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              이미지 업로드
            </h1>
            <p className="text-gray-600">
              제품 이미지를 업로드하거나 AI로 생성해보세요
            </p>
          </div>

          <div className="space-y-6">
            {/* 파일 업로드 영역 */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={loading}
              />

              <div className="space-y-4">
                <div className="text-4xl">📸</div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    이미지를 드래그하거나 클릭하여 업로드
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    PNG, JPG, GIF 파일 (최대 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* 구분선 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            {/* AI 생성 버튼 */}
            <div className="text-center">
              <Button
                onClick={handleAIGenerate}
                loading={loading}
                variant="outline"
                size="lg"
                className="w-full"
              >
                AI로 이미지 생성
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                AI가 자동으로 이미지를 생성합니다.
                <br />더 정확한 결과를 원하시면 직접 업로드해주세요.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* 뒤로가기 버튼 */}
            <div className="text-center">
              <Button variant="ghost" onClick={() => router.back()}>
                뒤로가기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
