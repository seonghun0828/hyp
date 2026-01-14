'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useFunnelStore } from '@/lib/store';
import { MAX_IMAGES } from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import ColorThief from 'colorthief';
import { fonts, fontNames } from '@/lib/fonts';
import LoginModal from '@/components/auth/LoginModal';
import PaymentModal from '@/components/PaymentModal';
import { deductCredits } from '@/lib/api/credits';
import { generateImage } from '@/lib/api/images';
import { useCreditStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';

const minFont = 4;
const maxFont = 36;

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: number; // 글자 굵기 (100-900)
  color: string;
  backgroundColor: 'transparent' | 'black' | 'white';
  isSelected: boolean;
  type: 'recommended' | 'custom'; // 추천 텍스트인지 커스텀 텍스트인지
  recommendedPrincipleKey?: string; // 추천 텍스트인 경우 어떤 원칙의 텍스트인지
  fontIndex: number; // 각 텍스트가 사용하는 폰트 인덱스
}

export default function EditorPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('editor');
  const tSteps = useTranslations('steps');
  const tCommon = useTranslations('common');

  const {
    summary,
    styles,
    imageUrl,
    imagePrompt,
    successTexts,
    setSuccessTexts,
    setFinalImageUrl,
    generatedImages,
    addGeneratedImage,
    setImageUrl,
    setImagePrompt,
    hasHydrated,
    resetGeneratedImages,
    randomSeed,
  } = useFunnelStore();

  const { credits, fetchCredits, updateCredits } = useCreditStore();
  const { user } = useAuthStore();

  const stepNames = [
    tSteps('linkInput'),
    tSteps('productSummary'),
    tSteps('messageType'),
    tSteps('expressionStyle'),
    tSteps('toneMood'),
    tSteps('modelComposition'),
    tSteps('aspectRatio'),
    tSteps('imageUpload'),
    tSteps('editor'),
    tSteps('result'),
  ];

  // 1. 페이지 진입 시 첫 번째 이미지를 리스트에 추가 (중복 방지)
  useEffect(() => {
    if (imageUrl && imagePrompt) {
      // 이미 리스트에 있는지 확인 (URL 기준)
      const exists = generatedImages.some((img) => img.url === imageUrl);
      if (!exists) {
        addGeneratedImage({ url: imageUrl, prompt: imagePrompt });
        // 0번 인덱스는 이미 확보된 것으로 처리
        requestedIndicesRef.current.add(0);
      }
    }
  }, [imageUrl, imagePrompt, generatedImages, addGeneratedImage]);

  // 2. 추가 이미지 백그라운드 생성 (총 3개가 될 때까지)
  const requestedIndicesRef = useRef<Set<number>>(new Set([0])); // 0번은 이미 생성됨

  // 부모 컨테이너(흰색 박스)의 실제 크기를 측정하기 위한 Ref
  const containerParentRef = useRef<HTMLDivElement>(null);

  // 텍스트 자동 생성 초기화 여부 확인용 Ref
  const hasInitializedTextRef = useRef(false);

  useEffect(() => {
    // 1. Hydration이 안 됐거나 필수 정보가 없으면 중단
    if (!hasHydrated || !summary || !styles) return;

    // 2. 유저가 직접 업로드한 경우 중단
    if (imagePrompt === '[USER_UPLOADED]') return;

    // 3. 이미 최대 개수만큼 있으면 중단
    if (generatedImages.length >= MAX_IMAGES) return;

    // 4. 현재 존재하는 이미지들은 이미 요청된 것으로 간주하고 Set 업데이트 (새로고침 시 복구용)
    // 인덱스 0부터 현재 개수만큼은 이미 확보된 상태
    for (let i = 0; i < generatedImages.length; i++) {
      requestedIndicesRef.current.add(i);
    }

    // 크레딧 스토어 갱신 (최신 상태 유지)
    fetchCredits();

    // 생성해야 할 인덱스들을 파악하고 병렬 요청
    const generateImagesParallel = async () => {
      const promises: Promise<boolean>[] = [];

      for (let i = 1; i < MAX_IMAGES; i++) {
        // 이미 생성되었거나 요청 중이면 스킵
        if (requestedIndicesRef.current.has(i)) continue;

        // 요청 시작 표시
        requestedIndicesRef.current.add(i);

        // 개별 요청 함수 (Promise 반환)
        const fetchImage = async (index: number): Promise<boolean> => {
          try {
            const data = await generateImage({
              summary,
              styles,
              variationIndex: index,
              randomSeed,
              locale,
            });

            addGeneratedImage({
              url: data.imageUrl,
              prompt: data.imagePrompt,
            });
            return true;
          } catch (error: any) {
            console.error(`이미지 ${index} 생성 실패:`, error);

            // 402 체크
            if (error.status === 402) {
              setShowLoginModal(true);
            }

            requestedIndicesRef.current.delete(index);
            return false;
          }
        };

        promises.push(fetchImage(i));
      }

      // 요청한 이미지 생성 작업들이 있다면 완료 대기 후 크레딧 차감
      if (promises.length > 0) {
        const results = await Promise.all(promises);
        const allSuccess = results.every((success) => success);

        // 요청한 모든 이미지가 성공적으로 생성되었을 때만 크레딧 차감
        if (allSuccess) {
          try {
            await deductCredits(undefined, 'IMAGE_GENERATION_BATCH');
            // 크레딧 차감 후 스토어 업데이트
            fetchCredits();
          } catch (error: any) {
            console.error('크레딧 차감 실패:', error);
            if (error.status === 402) {
              setShowLoginModal(true);
            }
          }
        }
      }
    };

    generateImagesParallel();
  }, [
    hasHydrated, // Hydration 완료 감지
    summary,
    styles,
    generatedImages.length,
    addGeneratedImage,
    imagePrompt,
    randomSeed,
  ]);

  // 추가 이미지 생성 핸들러
  const handleGenerateMoreClick = async () => {
    if (isGeneratingMore || !summary || !styles) return;
    setIsGeneratingMore(true);

    try {
      // 2. UI 분기 처리 (store에서 최신 credits 가져오기)
      const currentCredits = useCreditStore.getState().credits;
      if (currentCredits === null || currentCredits < 1) {
        if (user) {
          setShowPaymentModal(true);
        } else {
          setShowLoginModal(true);
        }
        setIsGeneratingMore(false);
        return;
      }

      // 3. 이미지 생성 요청
      const startIdx = generatedImages.length;
      const promises: Promise<boolean>[] = [];

      for (let i = 0; i < 2; i++) {
        const fetchImage = async (index: number): Promise<boolean> => {
          try {
            const data = await generateImage({
              summary,
              styles,
              variationIndex: index,
              randomSeed,
              locale,
            });

            addGeneratedImage({
              url: data.imageUrl,
              prompt: data.imagePrompt,
            });
            return true;
          } catch (error) {
            console.error(t('errorAdditionalImageFailed'), error);
            return false;
          }
        };

        promises.push(fetchImage(startIdx + i));
      }

      const results = await Promise.all(promises);
      const allSuccess = results.every((success) => success);

      // 4. 성공 시 크레딧 차감
      if (allSuccess) {
        try {
          await deductCredits(1, 'ADDITIONAL_IMAGE_GENERATION');
          // 크레딧 차감 후 스토어 업데이트
          fetchCredits();
          trackEvent('generate_more_images_success', { count: 2 });
        } catch (error) {
          console.error('크레딧 차감 실패:', error);
        }
      } else {
        alert(t('errorSomeImagesFailed'));
      }
    } catch (error) {
      console.error('오류 발생:', error);
      alert(t('errorDuringWork'));
    } finally {
      setIsGeneratingMore(false);
    }
  };

  // 비율에 따른 에디터 컨테이너 크기 계산
  const getEditorContainerSize = useCallback(() => {
    const aspectRatio = styles?.aspectRatio || '4:5';

    // 화면 크기 기반 제약
    const viewportWidth =
      typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight =
      typeof window !== 'undefined' ? window.innerHeight : 800;

    // 컨테이너가 들어갈 수 있는 최대 크기 계산
    // 단순 계산 대신, 실제 부모 요소의 너비를 우선적으로 사용합니다.
    let maxWidth;
    let isExact = false;

    if (containerParentRef.current) {
      // 1. 실제 렌더링된 부모 요소의 너비를 측정 (CSS 규칙이 모두 적용된 최종 크기)
      maxWidth = containerParentRef.current.clientWidth;
      isExact = true;
    } else {
      // 2. Ref가 없을 때(초기 로딩 등)를 위한 Fallback (기존 방식보다 보수적으로 잡음)
      maxWidth = Math.min(1200, viewportWidth - 80);
    }

    // 미세한 렌더링 오차 방지를 위해 2px 정도 여유를 둠
    maxWidth = Math.max(0, maxWidth - 2);

    const maxHeight = Math.min(viewportHeight * 0.7, viewportHeight - 300); // 상하 여백 고려

    let width: number;
    let height: number;

    if (aspectRatio === '1:1') {
      // 정사각형
      const size = Math.min(maxWidth, maxHeight);
      width = size;
      height = size;
    } else if (aspectRatio === '4:5') {
      // 세로형 (width:height = 4:5)
      // 높이를 기준으로 너비 계산
      height = Math.min(maxHeight, (maxWidth * 5) / 4);
      width = (height * 4) / 5;
    } else if (aspectRatio === '16:9') {
      // 가로형 (width:height = 16:9)
      // 너비를 우선으로 계산 (가로형이므로 너비를 최대한 활용)
      width = maxWidth;
      height = (width * 9) / 16;

      // 높이가 제한을 초과하면 높이 기준으로 재계산
      if (height > maxHeight) {
        height = maxHeight;
        width = (height * 16) / 9;
      }
    } else {
      // 기본값 (4:5)
      height = Math.min(maxHeight, (maxWidth * 5) / 4);
      width = (height * 4) / 5;
    }

    return { width, height, isExact };
  }, [styles?.aspectRatio]);

  const [containerSize, setContainerSize] = useState(() => ({
    width: 800,
    height: 1000,
  }));

  // 정확한 크기가 계산되어 렌더링 준비가 되었는지 여부
  const [isInitialized, setIsInitialized] = useState(false);

  // 비율 변경 및 화면 크기 변경 시 컨테이너 크기 재계산
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSize = () => {
      const { width, height, isExact } = getEditorContainerSize();
      setContainerSize({ width, height });
      // 정확한 크기(Ref 기반)로 계산되었다면 화면에 표시
      if (isExact) {
        setIsInitialized(true);
      }
    };

    // 1. 초기 실행
    updateSize();

    // 2. DOM 렌더링 직후 한 번 더 실행 (Ref가 확실히 연결된 후)
    const timeoutId = setTimeout(updateSize, 0);

    // 3. Window 리사이즈 이벤트
    window.addEventListener('resize', updateSize);

    // 4. 부모 요소 크기 변화 감지 (ResizeObserver)
    // 부모 컨테이너의 크기가 실제로 잡히거나 변할 때마다 정확한 크기로 재조정
    let resizeObserver: ResizeObserver | null = null;
    if (containerParentRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateSize();
      });
      resizeObserver.observe(containerParentRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateSize);
      clearTimeout(timeoutId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [getEditorContainerSize]);
  // SUCCESs 원칙 관련 상태
  const [currentIndex, setCurrentIndex] = useState(0);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [isTextButtonMinimized, setIsTextButtonMinimized] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);

  // 스냅 가이드라인 상태
  const [snapGuides, setSnapGuides] = useState({
    vertical: false, // 세로 중앙선 (가로 중앙 정렬)
    horizontal: false, // 가로 중앙선 (세로 중앙 정렬)
  });

  // 선택된 요소의 폰트 인덱스 가져오기
  const getSelectedFontIndex = () => {
    if (!selectedElement) return 0;
    const element = textElements.find((el) => el.id === selectedElement);
    return element?.fontIndex ?? 0;
  };

  // 폰트 변경 시 위치 조정을 포함한 함수
  const handleFontChange = (index: number) => {
    if (!selectedElement) return;

    // 선택된 요소의 폰트 인덱스만 변경
    updateElementStyle(selectedElement, { fontIndex: index });

    // 드래그 중이 아닐 때만 위치 조정
    if (!isDragging) {
      setTimeout(() => {
        const element = textElements.find((el) => el.id === selectedElement);
        if (element) {
          const container = document.querySelector('.editor-container');
          if (container) {
            const containerRect = container.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;

            // 새로운 폰트 정보 가져오기
            const newFont = fonts[index];
            const fontFamily = newFont.style.fontFamily;

            // 텍스트의 실제 크기 측정
            const { width: textWidth } = measureTextSizeWithDOM(
              element.text,
              element.fontSize,
              fontFamily
            );
            const textHeight = element.fontSize * 1.5;
            const padding = 16;
            const totalWidth = textWidth + padding;
            const totalHeight = textHeight + 8;

            // 위치를 컨테이너 안으로 제한
            let newX = element.x;
            let newY = element.y;

            if (newX + totalWidth > containerWidth) {
              newX = Math.max(0, containerWidth - totalWidth);
            }
            if (newX < 0) {
              newX = 0;
            }
            if (newY + totalHeight > containerHeight) {
              newY = Math.max(0, containerHeight - totalHeight);
            }
            if (newY < 0) {
              newY = 0;
            }

            // 위치가 변경된 경우에만 업데이트
            if (newX !== element.x || newY !== element.y) {
              updateElementStyle(selectedElement, { x: newX, y: newY });
            }
          }
        }
      }, 0);
    }
  };
  const [colorPalette, setColorPalette] = useState<number[][]>([]);

  // 상태가 로드될 때까지 기다리는 로딩 상태 추가
  // const [isHydrated, setIsHydrated] = useState(false);

  // 텍스트 편집 모달 상태
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // SUCCESs 원칙 정의
  const principles = [
    {
      key: 'simple',
      color: 'bg-blue-500',
    },
    {
      key: 'unexpected',
      color: 'bg-purple-500',
    },
    {
      key: 'concrete',
      color: 'bg-green-500',
    },
    {
      key: 'credible',
      color: 'bg-orange-500',
    },
    {
      key: 'emotional',
      color: 'bg-pink-500',
    },
    {
      key: 'story',
      color: 'bg-indigo-500',
    },
  ] as const;

  // 로드된 원칙들만 필터링 (로드된 순서 유지)
  const loadedPrinciples = Object.keys(successTexts || {})
    .map((key) => principles.find((p) => p.key === key))
    .filter(Boolean);
  const currentPrinciple =
    loadedPrinciples[currentIndex] || loadedPrinciples[0];
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < loadedPrinciples.length - 1;

  useEffect(() => {
    // hydration이 완료된 후에만 상태 확인
    if (!hasHydrated) return;

    // 상태 확인 및 적절한 페이지로 리다이렉트
    if (!summary) {
      router.push('/');
      return;
    }
    if (
      !styles ||
      !styles.messageType ||
      !styles.visualStyle ||
      !styles.toneMood ||
      !styles.model
    ) {
      router.push('/styles/messages');
      return;
    }
    if (!imageUrl) {
      router.push('/upload');
      return;
    }
    // successTexts가 없어도 에디터 페이지에 머물러서 로딩 표시
    // if (!successTexts) {
    //   router.push('/upload');
    //   return;
    // }

    // 선택된 원칙의 추천 텍스트 생성 (successTexts가 있을 때만, 첫 화면에서만)
    if (
      isInitialized &&
      successTexts &&
      currentPrinciple &&
      textElements.length === 0 &&
      !hasInitializedTextRef.current
    ) {
      createRecommendedText();
      hasInitializedTextRef.current = true;
    }
  }, [
    summary,
    styles,
    imageUrl,
    successTexts,
    router,
    hasHydrated,
    isInitialized,
  ]);

  // 홍보 문구 스타일 변경 시 추천 텍스트 재생성
  useEffect(() => {
    if (!hasHydrated || !successTexts || !currentPrinciple || !isInitialized)
      return;

    // 같은 원칙의 추천 텍스트가 없으면 생성
    const hasRecommendedForCurrent = textElements.some(
      (el) =>
        el.type === 'recommended' &&
        el.recommendedPrincipleKey === currentPrinciple.key
    );

    if (!hasRecommendedForCurrent) {
      createRecommendedText();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentIndex,
    hasHydrated,
    successTexts,
    currentPrinciple?.key,
    isInitialized,
  ]);

  // summary가 변경될 때 successTexts 초기화
  const [lastSummaryUrl, setLastSummaryUrl] = useState<string | null>(null);
  const [lastConceptId, setLastConceptId] = useState<string | null>(null);

  useEffect(() => {
    if (hasHydrated && summary) {
      const currentUrl = summary.url;

      // URL이 변경되었을 때 successTexts 초기화
      if (lastSummaryUrl && lastSummaryUrl !== currentUrl) {
        // successTexts 초기화
        setSuccessTexts(undefined);
        // 생성된 이미지 목록도 초기화
        resetGeneratedImages();

        // 이미지 업로드 페이지로 리다이렉트하여 새로 생성
        router.push('/upload');
      }

      setLastSummaryUrl(currentUrl);
    }
  }, [
    summary,
    hasHydrated,
    lastSummaryUrl,
    setSuccessTexts,
    router,
    resetGeneratedImages,
  ]);

  // 컨셉 변경 감지 로직 제거 - API가 캐시 키로 처리하므로 불필요

  useEffect(() => {
    // Zustand persist가 hydration을 완료할 때까지 기다림
    // setIsHydrated(true);
  }, []);

  // DOM을 사용한 정확한 텍스트 너비 및 높이 측정
  const measureTextSizeWithDOM = (
    text: string,
    fontSize: number,
    fontFamily: string
  ): { width: number; height: number } => {
    // 임시 요소 생성
    const measureElement = document.createElement('div');
    measureElement.style.visibility = 'hidden';
    measureElement.style.position = 'absolute';
    measureElement.style.whiteSpace = 'pre';
    measureElement.style.fontSize = `${fontSize}px`;
    measureElement.style.fontFamily = fontFamily;
    measureElement.style.lineHeight = 'normal';
    measureElement.style.display = 'inline-block';
    measureElement.style.padding = '4px 8px'; // 실제 텍스트 박스 패딩 포함
    measureElement.textContent = text;

    document.body.appendChild(measureElement);
    const width = measureElement.offsetWidth;
    const height = measureElement.offsetHeight;
    document.body.removeChild(measureElement);

    return { width, height };
  };

  // 폰트 크기 자동 조절 (DOM 기반)
  const calculateOptimalFontSize = (
    text: string,
    maxWidth: number,
    fontFamily: string,
    minFontSize: number = minFont,
    maxFontSize: number = maxFont
  ): number => {
    let fontSize = maxFontSize;

    while (fontSize >= minFontSize) {
      const { width } = measureTextSizeWithDOM(text, fontSize, fontFamily);
      if (width <= maxWidth) {
        return fontSize;
      }
      fontSize -= 1;
    }

    return minFontSize;
  };

  // 컨테이너 너비 가져오기
  const getContainerWidth = (): number => {
    return containerSize.width;
  };

  // 컨테이너 높이 가져오기
  const getContainerHeight = (): number => {
    return containerSize.height;
  };

  // 추천 텍스트 생성 (홍보 문구 스타일 선택 시)
  const createRecommendedText = () => {
    if (!successTexts || !currentPrinciple) return;

    const currentText = successTexts[currentPrinciple.key];
    if (!currentText) return;

    // 모든 추천 텍스트 찾기 (최대 1개만 있어야 함)
    const existingRecommended = textElements.find(
      (el) => el.type === 'recommended'
    );

    // 같은 원칙의 추천 텍스트가 있고 텍스트가 같으면 선택만
    if (
      existingRecommended &&
      existingRecommended.recommendedPrincipleKey === currentPrinciple.key &&
      existingRecommended.text === currentText
    ) {
      setTextElements((prev) =>
        prev.map((el) => ({
          ...el,
          isSelected: el.id === existingRecommended.id,
        }))
      );
      setSelectedElement(existingRecommended.id);
      return;
    }

    // 기존 추천 텍스트의 스타일을 유지 (있으면 그것을, 없으면 다른 텍스트 요소 사용)
    const styleSource =
      existingRecommended || (textElements.length > 0 ? textElements[0] : null);

    // 폰트 인덱스 (기존 추천 텍스트의 폰트를 사용하거나 기본값 0)
    const fontIndex = styleSource?.fontIndex ?? 0;

    // 현재 폰트 정보 가져오기
    const currentFont = fonts[fontIndex];
    const fontFamily = currentFont.style.fontFamily;

    // 컨테이너 너비 가져오기
    const containerWidth = getContainerWidth();
    const textPaddingLeft = 8;
    const textPaddingRight = 8;

    // 실제 사용 가능한 너비 (이미지 너비보다 작게 설정 - 85% 수준)
    const availableWidth =
      (containerWidth - textPaddingLeft - textPaddingRight) * 0.65;

    // 최적의 폰트 크기 계산
    const optimalFontSize = calculateOptimalFontSize(
      currentText,
      availableWidth,
      fontFamily,
      minFont,
      maxFont
    );

    // 실제로 사용할 글자 크기 (기존 추천 텍스트의 스타일 유지)
    const actualFontSize = styleSource?.fontSize ?? optimalFontSize;

    // 텍스트 너비 및 높이 측정
    const { width: totalTextWidth, height: totalTextHeight } =
      measureTextSizeWithDOM(currentText, actualFontSize, fontFamily);

    // 가운데 정렬 계산
    let centerX = (containerWidth - totalTextWidth) / 2;

    // 컨테이너 높이 가져오기
    const containerHeight = getContainerHeight();

    // 위치 계산
    let finalX = styleSource?.x ?? centerX;
    let finalY = styleSource?.y ?? 100;

    // 경계 체크
    if (finalX + totalTextWidth > containerWidth) {
      finalX = Math.max(0, containerWidth - totalTextWidth);
    }
    if (finalX < 0) {
      finalX = 0;
    }
    if (finalY + totalTextHeight > containerHeight) {
      finalY = Math.max(0, containerHeight - totalTextHeight);
    }
    if (finalY < 0) {
      finalY = 0;
    }

    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      text: currentText,
      x: finalX,
      y: finalY,
      fontSize: actualFontSize,
      fontWeight: styleSource?.fontWeight ?? 400,
      color: styleSource?.color ?? '#000000',
      backgroundColor: styleSource?.backgroundColor ?? 'white',
      isSelected: true,
      type: 'recommended',
      recommendedPrincipleKey: currentPrinciple.key,
      fontIndex: styleSource?.fontIndex ?? 0,
    };

    // 모든 추천 텍스트를 제거하고 새로운 추천 텍스트 추가 (추천 텍스트는 최대 1개만)
    setTextElements((prev) =>
      prev
        .filter((el) => el.type !== 'recommended') // 모든 추천 텍스트 제거
        .map((el) => ({ ...el, isSelected: false }))
        .concat([newElement])
    );
    setSelectedElement(newElement.id);
  };

  // 커스텀 텍스트 추가
  const addCustomText = () => {
    // 최소화된 상태에서 버튼을 누르면 원래 형태로 복원
    if (isTextButtonMinimized) {
      setIsTextButtonMinimized(false);
    }
    // 기존 텍스트 요소가 있는지 확인 (스타일 유지용)
    const previousElement =
      textElements.length > 0 ? textElements[textElements.length - 1] : null;

    // 폰트 인덱스 (기존 텍스트의 폰트를 사용하거나 기본값 0)
    const fontIndex = previousElement?.fontIndex ?? 0;

    // 현재 폰트 정보 가져오기
    const currentFont = fonts[fontIndex];
    const fontFamily = currentFont.style.fontFamily;

    // 컨테이너 너비 가져오기
    const containerWidth = getContainerWidth();
    const textPaddingLeft = 8;
    const textPaddingRight = 8;

    // 빈 텍스트로 생성
    const defaultText = '';
    const actualFontSize = previousElement?.fontSize ?? 16; // 기본 폰트 크기

    // 빈 텍스트일 때는 기본 위치 사용
    const defaultTextWidth = 100; // 빈 텍스트일 때 예상 너비
    const totalTextWidth =
      defaultTextWidth + textPaddingLeft + textPaddingRight;
    let centerX = (containerWidth - totalTextWidth) / 2;

    // 컨테이너 높이 가져오기
    const containerHeight = getContainerHeight();

    // 위치 계산 (기존 텍스트 아래에 배치)
    const textHeight = actualFontSize * 1.5;
    const totalHeight = textHeight + 8;

    let finalX = centerX;
    let finalY = previousElement
      ? previousElement.y + previousElement.fontSize * 1.5 + 20
      : 100;

    // 경계 체크
    if (finalX + totalTextWidth > containerWidth) {
      finalX = Math.max(0, containerWidth - totalTextWidth);
    }
    if (finalX < 0) {
      finalX = 0;
    }
    if (finalY + totalHeight > containerHeight) {
      finalY = Math.max(0, containerHeight - totalHeight);
    }
    if (finalY < 0) {
      finalY = 0;
    }

    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      text: defaultText, // 빈 텍스트
      x: finalX,
      y: finalY,
      fontSize: actualFontSize,
      fontWeight: previousElement?.fontWeight ?? 400,
      color: previousElement?.color ?? '#000000',
      backgroundColor: previousElement?.backgroundColor ?? 'white',
      isSelected: true,
      type: 'custom',
      fontIndex: fontIndex,
    };

    setTextElements((prev) =>
      prev.map((el) => ({ ...el, isSelected: false })).concat([newElement])
    );
    setSelectedElement(newElement.id);

    // 즉시 편집 모드로 열기 (빈 텍스트)
    openTextEditor(newElement.id, defaultText);
  };

  // HTML/CSS 방식으로 변경 - drawCanvas 함수 제거

  // HTML/CSS 방식으로 변경 - drawCanvas 호출 제거

  // 자동 텍스트 생성 제거 - 사용자가 옵션을 클릭할 때만 생성

  // HTML/CSS 방식으로 변경 - 중복 제거

  // 텍스트 편집 모달 함수들
  const openTextEditor = (elementId: string, currentText: string) => {
    // 편집 버튼을 눌렀을 때 해당 텍스트 박스를 선택
    setSelectedElement(elementId);
    setTextElements((prev) =>
      prev.map((el) => ({
        ...el,
        isSelected: el.id === elementId,
      }))
    );
    setEditingTextId(elementId);
    setEditingText(currentText);
  };

  const closeTextEditor = () => {
    // 편집 모달을 닫을 때 빈 텍스트면 제거
    if (editingTextId) {
      const trimmedText = editingText.trim();
      if (trimmedText === '') {
        setTextElements((prev) => prev.filter((el) => el.id !== editingTextId));
        setSelectedElement(null);
      }
    }
    setEditingTextId(null);
    setEditingText('');
  };

  const saveTextEdit = () => {
    if (!editingTextId) {
      closeTextEditor();
      return;
    }

    const trimmedText = editingText.trim();

    // 빈 텍스트나 공백만 있으면 텍스트 요소 제거
    if (trimmedText === '') {
      setTextElements((prev) => prev.filter((el) => el.id !== editingTextId));
      setSelectedElement(null);
      closeTextEditor();
      return;
    }

    // 텍스트가 있으면 업데이트
    setTextElements((prev) =>
      prev.map((el) => {
        if (el.id === editingTextId) {
          // 추천 텍스트를 수정하면 커스텀 텍스트로 변환
          if (el.type === 'recommended') {
            return {
              ...el,
              text: trimmedText,
              type: 'custom' as const,
              recommendedPrincipleKey: undefined,
            };
          }
          return { ...el, text: trimmedText };
        }
        return el;
      })
    );
    closeTextEditor();
  };

  const handleTextChange = (newText: string) => {
    setEditingText(newText);
    if (editingTextId) {
      setTextElements((prev) =>
        prev.map((el) => {
          if (el.id === editingTextId) {
            // 추천 텍스트를 수정하면 커스텀 텍스트로 변환
            if (el.type === 'recommended') {
              return {
                ...el,
                text: newText,
                type: 'custom' as const,
                recommendedPrincipleKey: undefined,
              };
            }
            return { ...el, text: newText };
          }
          return el;
        })
      );
    }
  };

  // 네비게이션 핸들러
  const handlePrevPrinciple = () => {
    if (canGoPrev) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNextPrinciple = () => {
    if (canGoNext) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleElementClick = (elementId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedElement(elementId);
    setTextElements((prev) =>
      prev.map((el) => ({
        ...el,
        isSelected: el.id === elementId,
      }))
    );
  };

  // HTML/CSS 방식으로 변경 - Canvas 관련 함수 제거

  // HTML/CSS 방식으로 변경 - Canvas 관련 함수 제거

  const updateElementStyle = (
    elementId: string,
    updates: Partial<TextElement>
  ) => {
    setTextElements((prev) => {
      const updated = prev.map((el) => {
        if (el.id !== elementId) return el;

        const newElement = { ...el, ...updates };

        // 드래그 중이 아니고, 스타일이 변경된 경우에만 위치를 컨테이너 안으로 조정
        if (
          !isDragging &&
          (updates.fontSize ||
            updates.color ||
            updates.backgroundColor ||
            updates.fontIndex)
        ) {
          const container = document.querySelector('.editor-container');
          if (container) {
            const containerRect = container.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;

            // 현재 폰트 정보 가져오기 (업데이트된 fontIndex 사용)
            const fontIndex = newElement.fontIndex ?? el.fontIndex;
            const currentFont = fonts[fontIndex];
            const fontFamily = currentFont.style.fontFamily;

            // 텍스트의 실제 크기 측정
            const { width: totalWidth, height: totalHeight } =
              measureTextSizeWithDOM(
                newElement.text,
                newElement.fontSize,
                fontFamily
              );

            // 위치를 컨테이너 안으로 제한
            let newX = newElement.x;
            let newY = newElement.y;

            // 오른쪽 경계 체크
            if (newX + totalWidth > containerWidth) {
              newX = Math.max(0, containerWidth - totalWidth);
            }
            // 왼쪽 경계 체크
            if (newX < 0) {
              newX = 0;
            }
            // 아래쪽 경계 체크
            if (newY + totalHeight > containerHeight) {
              newY = Math.max(0, containerHeight - totalHeight);
            }
            // 위쪽 경계 체크
            if (newY < 0) {
              newY = 0;
            }

            return { ...newElement, x: newX, y: newY };
          }
        }

        return newElement;
      });
      return updated;
    });
  };

  // 공통 드래그 시작 함수 (마우스와 터치 모두 지원)
  const handleDragStart = (
    element: TextElement,
    clientX: number,
    clientY: number
  ) => {
    setSelectedElement(element.id);
    setIsDragging(true);

    // 선택 상태 업데이트
    setTextElements((prev) =>
      prev.map((el) => ({
        ...el,
        isSelected: el.id === element.id,
      }))
    );

    const container = document.querySelector('.editor-container');
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const offsetX = clientX - containerRect.left - element.x;
    const offsetY = clientY - containerRect.top - element.y;

    // 현재 폰트 정보 가져오기 (드래그 중 크기 계산용)
    const currentFont = fonts[element.fontIndex];
    const fontFamily = currentFont.style.fontFamily;

    // 텍스트 크기 측정 (중심점 계산용)
    // 실제 렌더링된 DOM 요소의 크기를 사용하여 정확도 향상
    const domElement = document.getElementById(element.id);
    let totalWidth = 0;
    let totalHeight = 0;

    if (domElement) {
      totalWidth = domElement.offsetWidth;
      totalHeight = domElement.offsetHeight;
    } else {
      // Fallback: DOM 요소를 찾지 못한 경우 (거의 발생하지 않음)
      const { width, height } = measureTextSizeWithDOM(
        element.text,
        element.fontSize,
        fontFamily
      );
      totalWidth = width;
      totalHeight = height;
    }

    // 마우스 이벤트 핸들러
    const handleMouseMove = (moveEvent: MouseEvent) => {
      let newX = moveEvent.clientX - containerRect.left - offsetX;
      let newY = moveEvent.clientY - containerRect.top - offsetY;

      // 스냅 기능 로직
      const containerCenterX = containerRect.width / 2;
      const containerCenterY = containerRect.height / 2;
      const elementCenterX = newX + totalWidth / 2;
      const elementCenterY = newY + totalHeight / 2;

      const SNAP_THRESHOLD = 15; // 스냅 거리 임계값 (px)
      let snapV = false;
      let snapH = false;

      // 가로 중앙 정렬 (세로선 표시)
      if (Math.abs(elementCenterX - containerCenterX) < SNAP_THRESHOLD) {
        newX = containerCenterX - totalWidth / 2;
        snapV = true;
      }

      // 세로 중앙 정렬 (가로선 표시)
      if (Math.abs(elementCenterY - containerCenterY) < SNAP_THRESHOLD) {
        newY = containerCenterY - totalHeight / 2;
        snapH = true;
      }

      setSnapGuides({ vertical: snapV, horizontal: snapH });

      setTextElements((prev) =>
        prev.map((el) =>
          el.id === element.id ? { ...el, x: newX, y: newY } : el
        )
      );
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setSnapGuides({ vertical: false, horizontal: false });
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    // 터치 이벤트 핸들러
    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length === 0) return;
      moveEvent.preventDefault(); // 스크롤 방지
      moveEvent.stopPropagation(); // 이벤트 전파 방지
      const touch = moveEvent.touches[0];
      let newX = touch.clientX - containerRect.left - offsetX;
      let newY = touch.clientY - containerRect.top - offsetY;

      // 스냅 기능 로직 (터치)
      const containerCenterX = containerRect.width / 2;
      const containerCenterY = containerRect.height / 2;
      const elementCenterX = newX + totalWidth / 2;
      const elementCenterY = newY + totalHeight / 2;

      const SNAP_THRESHOLD = 15; // 스냅 거리 임계값 (px)
      let snapV = false;
      let snapH = false;

      // 가로 중앙 정렬 (세로선 표시)
      if (Math.abs(elementCenterX - containerCenterX) < SNAP_THRESHOLD) {
        newX = containerCenterX - totalWidth / 2;
        snapV = true;
      }

      // 세로 중앙 정렬 (가로선 표시)
      if (Math.abs(elementCenterY - containerCenterY) < SNAP_THRESHOLD) {
        newY = containerCenterY - totalHeight / 2;
        snapH = true;
      }

      setSnapGuides({ vertical: snapV, horizontal: snapH });

      setTextElements((prev) =>
        prev.map((el) =>
          el.id === element.id ? { ...el, x: newX, y: newY } : el
        )
      );
    };

    const handleTouchEnd = (e?: TouchEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setIsDragging(false);
      setSnapGuides({ vertical: false, horizontal: false });
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    // 이벤트 리스너 등록
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  const deleteTextElement = (elementId: string) => {
    setTextElements((prev) => prev.filter((el) => el.id !== elementId));
    setSelectedElement(null);
  };

  const handleSave = async () => {
    if (
      !summary ||
      !styles ||
      !styles.messageType ||
      !styles.visualStyle ||
      !styles.toneMood ||
      !styles.model ||
      !currentPrinciple
    ) {
      alert('필수 정보가 없습니다. 다시 시도해주세요.');
      return;
    }

    setLoading(true);

    const { default: html2canvas } = await import('html2canvas-pro');
    const element = document.querySelector('.editor-container') as HTMLElement;

    if (!element) {
      setLoading(false);
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
        foreignObjectRendering: false,
        removeContainer: true,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (element) => {
          if (element.classList) {
            // 텍스트 툴바만 제외 (버튼은 onclone에서 처리)
            if (element.classList.contains('text-toolbar')) {
              return true;
            }
          }
          return false;
        },
        onclone: (clonedDoc) => {
          // 1. exclude-from-result 클래스를 가진 요소를 찾아서 제거
          const excludeElements = clonedDoc.querySelectorAll(
            '.exclude-from-result'
          );
          excludeElements.forEach((el) => {
            el.remove();
          });

          // 2. 선택된 요소의 외곽선/그림자 등 스타일 정리
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.outline = 'none';
            htmlEl.style.boxShadow = 'none';
          });
        },
      });

      const finalImageUrl = canvas.toDataURL('image/png');

      // 1. Supabase Storage에 업로드
      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Image: finalImageUrl,
        }),
      });

      if (!uploadResponse.ok) {
        throw new Error('이미지 업로드에 실패했습니다.');
      }

      const uploadData = await uploadResponse.json();
      const storageUrl = uploadData.imageUrl;

      // 2. 이미지 생성에 사용된 프롬프트 사용 (store에서 가져옴)
      // 프롬프트가 없거나 사용자 업로드인 경우 명시적 메시지 사용
      const promptToSave = imagePrompt || '[PROMPT_NOT_AVAILABLE]';

      // 3. 텍스트 배열 생성
      const texts = textElements.map((el) => el.text);

      // 4. DB에 저장
      const saveResponse = await fetch('/api/save-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summaryId: summary.id,
          styles: styles,
          selectedPrinciple: currentPrinciple.key,
          texts: texts,
          imagePrompt: promptToSave,
          finalImageUrl: storageUrl,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error(t('errorSaveFailed'));
      }

      const saveData = await saveResponse.json();
      const contentId = saveData.contentId;

      // 5. resultId를 sessionStorage와 URL에 저장
      sessionStorage.setItem('resultId', contentId);
      sessionStorage.setItem('finalImageUrl', finalImageUrl);

      // Zustand store에도 저장 (UI 업데이트용)
      setFinalImageUrl(finalImageUrl);

      // 이벤트 추적
      trackEvent('editor_complete', {
        step: 5,
        page: 'editor',
      });

      // 결과 페이지로 이동 (URL 쿼리 파라미터에 result-id 추가)
      router.push(`/${locale}/result?result-id=${contentId}`);
    } catch (error) {
      console.error('Save error:', error);
      alert(error instanceof Error ? error.message : t('errorSave'));
    } finally {
      setLoading(false);
    }
  };

  // hydration이 완료되기 전에는 로딩 표시
  if (!hasHydrated) {
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
    !styles ||
    !styles.messageType ||
    !styles.visualStyle ||
    !styles.toneMood ||
    !styles.model ||
    !imageUrl
  ) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <ProgressBar
        currentStep={9}
        totalSteps={10}
        stepNames={stepNames}
        onStepClick={(stepNumber: number) => {
          const stepRoutes: Record<number, string> = {
            1: `/${locale}`,
            2: `/${locale}/summary`,
            3: `/${locale}/styles/messages`,
            4: `/${locale}/styles/expressions`,
            5: `/${locale}/styles/tones-moods`,
            6: `/${locale}/styles/models`,
            7: `/${locale}/styles/aspect-ratio`,
            8: `/${locale}/upload`,
            9: `/${locale}/editor`,
            10: `/${locale}/result`,
          };

          const route = stepRoutes[stepNumber];
          if (route && route !== window.location.pathname) {
            router.push(route);
          }
        }}
      />

      <div className="container mx-auto px-4 pb-8 md:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('title')}
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* SUCCESs 원칙 네비게이션 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('promotionalTextStyle')}
                </h3>

                {/* 현재 원칙 표시 */}
                {loadedPrinciples.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${currentPrinciple?.color} mr-3`}
                        ></div>
                        <div>
                          <p className="text-sm font-medium">
                            {currentPrinciple?.key
                              ? t(`principles.${currentPrinciple.key}.label`)
                              : ''}
                          </p>
                          <p className="text-xs text-gray-600">
                            {currentPrinciple?.key
                              ? t(`principles.${currentPrinciple.key}.desc`)
                              : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 네비게이션 버튼 */}
                    <div className="flex justify-between">
                      <button
                        onClick={handlePrevPrinciple}
                        disabled={!canGoPrev}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          canGoPrev
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {t('previous')}
                      </button>

                      <div className="text-xs text-gray-500 flex items-center">
                        {loadedPrinciples.length > 0
                          ? `${currentIndex + 1} / ${loadedPrinciples.length}`
                          : '0 / 0'}
                      </div>

                      <button
                        onClick={handleNextPrinciple}
                        disabled={!canGoNext}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          canGoNext
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {t('next')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-sm">
                      {t('generatingTexts')}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {loadedPrinciples.length} / 6 {t('completed')}
                    </p>
                  </div>
                )}
              </div>

              {/* 텍스트 스타일 조정 - 데스크톱에서만 표시 */}
              {selectedElement && (
                <div className="bg-white rounded-lg shadow-md p-6 mt-6 hidden lg:block">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('textStyle')}
                  </h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('fontSetting')}
                    </label>
                    <div className="flex gap-2 flex-wrap max-h-[186px] overflow-y-auto p-1">
                      {fontNames.map((fontName, index) => (
                        <button
                          key={fontName}
                          onClick={() => handleFontChange(index)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            getSelectedFontIndex() === index
                              ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          } ${fonts[index].className}`}
                        >
                          {fontName}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('color')}
                      </label>
                      {colorPalette.length > 0 ? (
                        <div className="flex justify-between gap-1">
                          {colorPalette.map(([r, g, b], index) => {
                            const hexColor = `#${[r, g, b]
                              .map((x) => {
                                const hex = x.toString(16);
                                return hex.length === 1 ? '0' + hex : hex;
                              })
                              .join('')}`;
                            const currentColor =
                              textElements.find(
                                (el) => el.id === selectedElement
                              )?.color || '#000000';
                            const isSelected =
                              currentColor.toLowerCase() ===
                              hexColor.toLowerCase();

                            return (
                              <button
                                key={index}
                                onClick={() => {
                                  if (selectedElement) {
                                    updateElementStyle(selectedElement, {
                                      color: hexColor,
                                    });
                                  }
                                }}
                                className={`w-5 h-5 rounded border transition-all ${
                                  isSelected
                                    ? 'border-blue-500 ring-2 ring-blue-300 scale-110'
                                    : 'border-gray-300 hover:border-gray-400 hover:scale-105'
                                }`}
                                style={{ backgroundColor: hexColor }}
                                title={`RGB(${r}, ${g}, ${b})`}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 py-2">
                          {t('extractingColors')}
                        </div>
                      )}
                    </div>

                    <div className="flex">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('backgroundColor')}
                        </label>
                        <button
                          className={`px-4 py-2 rounded text-sm transition-colors ${(() => {
                            const current = textElements.find(
                              (el) => el.id === selectedElement
                            );
                            if (!current)
                              return 'bg-blue-500 text-white hover:bg-blue-600';

                            if (current.backgroundColor === 'white') {
                              return 'bg-white text-black border border-gray-300 hover:bg-gray-50';
                            } else if (current.backgroundColor === 'black') {
                              return 'bg-black text-white hover:bg-gray-800';
                            } else {
                              return 'bg-transparent text-black border border-gray-300 hover:bg-gray-50';
                            }
                          })()}`}
                          onClick={() => {
                            const current = textElements.find(
                              (el) => el.id === selectedElement
                            );
                            if (!current) return;

                            // 순환 로직: 하얀색 → 검정색 → 없음 → 하얀색
                            let nextBackgroundColor:
                              | 'transparent'
                              | 'black'
                              | 'white';

                            if (current.backgroundColor === 'white') {
                              // 하얀색 → 검정색
                              nextBackgroundColor = 'black';
                            } else if (current.backgroundColor === 'black') {
                              // 검정색 → 없음
                              nextBackgroundColor = 'transparent';
                            } else {
                              // 없음 → 하얀색
                              nextBackgroundColor = 'white';
                            }

                            updateElementStyle(selectedElement, {
                              backgroundColor: nextBackgroundColor,
                              // 텍스트 색상은 변경하지 않음
                            });
                          }}
                        >
                          {(() => {
                            const current = textElements.find(
                              (el) => el.id === selectedElement
                            );
                            if (!current) return t('backgroundText');

                            if (current.backgroundColor === 'white') {
                              return t('backgroundWhite');
                            } else if (current.backgroundColor === 'black') {
                              return t('backgroundBlack');
                            } else {
                              return t('backgroundNone');
                            }
                          })()}
                        </button>
                      </div>

                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-0.5">
                          {t('fontSize')}
                        </label>
                        <input
                          type="range"
                          min={minFont}
                          max={maxFont}
                          value={
                            textElements.find((el) => el.id === selectedElement)
                              ?.fontSize || 12
                          }
                          onChange={(e) =>
                            updateElementStyle(selectedElement, {
                              fontSize: parseInt(e.target.value),
                            })
                          }
                          className="w-full"
                        />
                        <div className="mt-1">
                          <label className="block text-sm font-medium text-gray-700 mb-0.5">
                            {t('fontWeight')}
                          </label>
                          <input
                            type="range"
                            min={100}
                            max={900}
                            step={100}
                            value={
                              textElements.find(
                                (el) => el.id === selectedElement
                              )?.fontWeight || 400
                            }
                            onChange={(e) =>
                              updateElementStyle(selectedElement, {
                                fontWeight: parseInt(e.target.value),
                              })
                            }
                            className="w-full"
                          />
                          {/* <div className="text-xs text-gray-500 mt-1 text-center">
                            {textElements.find(
                              (el) => el.id === selectedElement
                            )?.fontWeight || 400}
                          </div> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 캔버스 영역 - 홍보 문구 스타일 바로 아래 */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-center" ref={containerParentRef}>
                  <div
                    className="relative"
                    style={{ width: `${containerSize.width}px` }}
                  >
                    {/* 플로팅 버튼 - 우측 하단 */}
                    <div
                      className={`absolute bottom-4 z-20 flex items-start gap-0.5 transition-all ${
                        isTextButtonMinimized ? 'right-0' : 'right-4'
                      }`}
                    >
                      <button
                        onClick={addCustomText}
                        className={`bg-blue-500 text-white hover:bg-blue-600 transition-all text-sm font-medium flex items-center gap-1.5 shadow-lg ${
                          isTextButtonMinimized
                            ? 'px-2 py-1 rounded-full'
                            : 'px-3 py-1.5 rounded-lg'
                        }`}
                        style={{
                          boxShadow:
                            '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        }}
                      >
                        <span>+</span>
                        {!isTextButtonMinimized && <span>{t('text')}</span>}
                      </button>
                      {!isTextButtonMinimized && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsTextButtonMinimized(true);
                          }}
                          className="bg-gray-400 hover:bg-gray-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs transition-colors shadow-md"
                          style={{
                            fontSize: '10px',
                            lineHeight: '1',
                          }}
                          title={t('minimize')}
                        >
                          −
                        </button>
                      )}
                    </div>

                    <div
                      className="relative border border-gray-300 rounded-lg overflow-hidden editor-container"
                      style={{
                        width: `${containerSize.width}px`,
                        height: `${containerSize.height}px`,
                        maxWidth: '100%',
                        touchAction: 'none',
                        opacity: isInitialized ? 1 : 0,
                        transition: 'opacity 0.2s ease-in-out',
                      }}
                      onMouseDown={(e) => {
                        // 빈 공간 클릭 시 선택 해제
                        if (e.target === e.currentTarget) {
                          setSelectedElement(null);
                          setTextElements((prev) =>
                            prev.map((el) => ({ ...el, isSelected: false }))
                          );
                        }
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt="Generated image"
                        className="w-full h-full object-cover bg-white"
                        onLoad={(e) => {
                          try {
                            const img = e.currentTarget;
                            const colorThief = new ColorThief();
                            const palette = colorThief.getPalette(img, 10);

                            // 검은색과 하얀색 정의
                            const black = [0, 0, 0];
                            const white = [255, 255, 255];

                            // 검은색/하얀색과 유사한 색상 필터링 (약간의 오차 허용)
                            const filteredPalette = palette.filter(
                              ([r, g, b]) => {
                                // 검은색 체크 (RGB 합이 30 이하)
                                const isBlack = r + g + b <= 30;
                                // 하얀색 체크 (RGB 합이 750 이상)
                                const isWhite = r + g + b >= 750;
                                return !isBlack && !isWhite;
                              }
                            );

                            // 검은색, 하얀색을 처음에 추가하고 나머지 색상 추가
                            const finalPalette = [
                              black,
                              white,
                              ...filteredPalette,
                            ];
                            setColorPalette(finalPalette);
                          } catch (error) {
                            console.error(t('colorExtractionFailed'), error);
                          }
                        }}
                      />

                      {/* 스냅 가이드라인 */}
                      {snapGuides.vertical && (
                        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-blue-500 z-0 transform -translate-x-1/2 pointer-events-none" />
                      )}
                      {snapGuides.horizontal && (
                        <div className="absolute left-0 right-0 top-1/2 h-px bg-blue-500 z-0 transform -translate-y-1/2 pointer-events-none" />
                      )}

                      {/* 텍스트 오버레이 */}
                      {textElements.map((element) => {
                        const isEditing = editingTextId === element.id;
                        const elementFontClassName =
                          fonts[element.fontIndex].className;
                        return (
                          <div
                            key={element.id}
                            id={element.id}
                            className={`absolute cursor-move flex flex-col select-none z-10  ${elementFontClassName}`}
                            style={{
                              left: `${element.x}px`,
                              top: `${element.y}px`,
                              fontSize: `${element.fontSize}px`,
                              opacity: isEditing ? 0 : 1,
                              pointerEvents: isEditing ? 'none' : 'auto',
                            }}
                            onDoubleClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // 더블클릭으로 커스텀 텍스트 편집 모달 열기
                              openTextEditor(element.id, element.text);
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();

                              const target = e.target as HTMLElement;
                              if (
                                target.tagName === 'BUTTON' ||
                                target.closest('button')
                              ) {
                                return; // 버튼을 눌렀다면 드래그 로직 실행하지 않음
                              }

                              handleDragStart(element, e.clientX, e.clientY);
                            }}
                            onTouchStart={(e) => {
                              const touch = e.touches[0];

                              const target = e.target as HTMLElement;
                              if (
                                target.tagName === 'BUTTON' ||
                                target.closest('button')
                              ) {
                                return; // 버튼을 눌렀다면 드래그 로직 실행하지 않음
                              }

                              handleDragStart(
                                element,
                                touch.clientX,
                                touch.clientY
                              );
                            }}
                          >
                            {/* 편집/삭제 버튼 - absolute로 오버레이하여 레이아웃에 영향 없음 */}
                            {element.isSelected &&
                              !isDragging &&
                              (() => {
                                // 버튼 크기를 화면 크기에 비례하여 계산
                                const viewportWidth =
                                  typeof window !== 'undefined'
                                    ? window.innerWidth
                                    : 1200;
                                const viewportHeight =
                                  typeof window !== 'undefined'
                                    ? window.innerHeight
                                    : 800;
                                const baseSize = Math.min(
                                  viewportWidth,
                                  viewportHeight
                                );
                                // 화면 크기의 3-4% 정도로 버튼 크기 설정 (최소 24px, 최대 40px)
                                const buttonSize = Math.max(
                                  24,
                                  Math.min(40, baseSize * 0.035)
                                );
                                const iconSize = buttonSize * 0.6;

                                return (
                                  <div
                                    className="absolute flex gap-1.5 md:gap-2 z-20 exclude-from-result"
                                    style={{
                                      top: `-${buttonSize + 4}px`,
                                      right: '0px',
                                    }}
                                  >
                                    {/* 수정 버튼 */}
                                    <button
                                      className="bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-md"
                                      style={{
                                        width: `${buttonSize}px`,
                                        height: `${buttonSize}px`,
                                        fontSize: `${iconSize}px`,
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openTextEditor(
                                          element.id,
                                          element.text
                                        );
                                      }}
                                      onMouseDown={(e) => {
                                        e.stopPropagation(); // 부모의 onMouseDown/handleDragStart 실행 방지
                                      }}
                                      onTouchStart={(e) => {
                                        e.stopPropagation();
                                      }}
                                      title={t('editText')}
                                    >
                                      ✏️
                                    </button>
                                    {/* 삭제 버튼 */}
                                    <button
                                      className="bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                                      style={{
                                        width: `${buttonSize}px`,
                                        height: `${buttonSize}px`,
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteTextElement(element.id);
                                      }}
                                      onMouseDown={(e) => {
                                        e.stopPropagation(); // 부모의 onMouseDown/handleDragStart 실행 방지
                                      }}
                                      onTouchStart={(e) => {
                                        e.stopPropagation();
                                      }}
                                      title={t('deleteText')}
                                    >
                                      <svg
                                        width={iconSize}
                                        height={iconSize}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                      >
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                        <line x1="6" y1="18" x2="18" y2="6" />
                                      </svg>
                                    </button>
                                  </div>
                                );
                              })()}

                            <div className="relative inline-block">
                              <div
                                className={
                                  element.isSelected
                                    ? 'ring-2 ring-blue-500'
                                    : ''
                                }
                                style={{
                                  color: element.color,
                                  fontWeight: element.fontWeight,
                                  backgroundColor:
                                    element.backgroundColor === 'transparent'
                                      ? 'transparent'
                                      : element.backgroundColor === 'black'
                                      ? 'rgb(0, 0, 0)'
                                      : 'rgb(255, 255, 255)',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  whiteSpace: 'pre',
                                  display: 'inline-block',
                                }}
                              >
                                {element.text}
                              </div>
                              {/* AI 추천 라벨 */}
                              {element.type === 'recommended' && (
                                <div
                                  className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap exclude-from-result"
                                  style={{
                                    fontSize: `${Math.max(
                                      element.fontSize * 0.4,
                                      8
                                    )}px`,
                                  }}
                                >
                                  {t('aiRecommended')}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 하단 썸네일 리스트 (추가) - AI 생성 시에만 노출 */}
                {imagePrompt !== '[USER_UPLOADED]' && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      {t('otherStyles')}
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {/* 현재 생성된 이미지들 */}
                      {generatedImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setImageUrl(img.url);
                            setImagePrompt(img.prompt);
                          }}
                          className={`relative w-24 h-32 rounded-lg overflow-hidden border-2 transition-all shrink-0 group ${
                            imageUrl === img.url
                              ? 'border-blue-500 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <img
                            src={img.url}
                            alt={`Variation ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {imageUrl === img.url && (
                            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                              <div className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {t('selected')}
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </button>
                      ))}

                      {/* 로딩 스켈레톤 (3개가 안 찼으면 보여줌) - 자동 생성 중일 때만 */}
                      {generatedImages.length < MAX_IMAGES && (
                        <div className="w-24 h-32 rounded-lg bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 shrink-0 animate-pulse">
                          <div className="text-xl mb-1">✨</div>
                          <span className="text-xs">{t('generating')}</span>
                        </div>
                      )}

                      {/* 이미지 더 생성해보기 버튼 (항상 마지막에 표시) */}
                      <button
                        onClick={handleGenerateMoreClick}
                        disabled={
                          isGeneratingMore ||
                          generatedImages.length < MAX_IMAGES
                        }
                        className={`w-24 h-32 rounded-lg bg-white border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors shrink-0 ${
                          isGeneratingMore ||
                          generatedImages.length < MAX_IMAGES
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        {isGeneratingMore ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mb-2"></div>
                            <span className="text-xs text-center px-1">
                              {t('generating')}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="text-xl mb-1">+</div>
                            <span className="text-xs text-center px-1 whitespace-pre-line">
                              {t('generateMoreImages')}
                              <br />
                              <span className="text-[10px] text-gray-400 font-normal">
                                {t('creditCost')}
                              </span>
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-center gap-4">
                  <Button variant="outline" onClick={() => router.back()}>
                    {t('back')}
                  </Button>
                  <Button onClick={handleSave} loading={loading}>
                    {t('complete')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 텍스트 편집 영역 (화면 상단 고정) */}
      {editingTextId &&
        (() => {
          const editingElement = textElements.find(
            (el) => el.id === editingTextId
          );
          if (!editingElement) return null;

          const editingFontClassName =
            fonts[editingElement.fontIndex].className;

          return (
            <div
              className="fixed inset-0 z-50 flex flex-col"
              onClick={closeTextEditor}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
              }}
            >
              {/* 상단 고정 텍스트 박스 */}
              <div className="w-full flex flex-col items-center py-6 px-4">
                {/* 스타일이 적용된 텍스트 편집 박스 */}
                <div
                  className={`inline-block rounded-lg ${editingFontClassName}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    color: editingElement.color,
                    fontWeight: editingElement.fontWeight,
                    backgroundColor:
                      editingElement.backgroundColor === 'transparent'
                        ? 'transparent'
                        : editingElement.backgroundColor === 'black'
                        ? 'rgb(0, 0, 0)'
                        : 'rgb(255, 255, 255)',
                    padding: '4px 8px',
                    whiteSpace: 'pre',
                    fontSize: `${editingElement.fontSize}px`,
                    display: 'inline-block',
                    maxWidth: 'calc(100vw - 32px)',
                  }}
                >
                  <textarea
                    value={editingText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        closeTextEditor();
                      }
                    }}
                    className={editingFontClassName}
                    style={{
                      padding: '0',
                      margin: '0',
                      border: 'none',
                      borderRadius: '0',
                      resize: 'none',
                      outline: 'none',
                      fontSize: `${editingElement.fontSize}px`,
                      fontWeight: editingElement.fontWeight,
                      color: editingElement.color,
                      backgroundColor: 'transparent',
                      whiteSpace: 'pre',
                      lineHeight: 'normal',
                      overflow: 'hidden',
                      fontFamily: 'inherit',
                      letterSpacing: 'inherit',
                      width: 'auto',
                      minWidth: '1ch',
                      maxWidth: 'calc(100vw - 48px)',
                      height: 'auto',
                    }}
                    placeholder={t('enterText')}
                    autoFocus
                    ref={(textarea) => {
                      if (textarea) {
                        // 초기 크기 설정
                        const maxWidth = Math.min(
                          textarea.scrollWidth,
                          window.innerWidth - 48
                        );
                        textarea.style.height = 'auto';
                        textarea.style.width = 'auto';
                        textarea.style.height = `${textarea.scrollHeight}px`;
                        textarea.style.width = `${Math.max(maxWidth, 1)}px`;
                      }
                    }}
                    onInput={(e) => {
                      // textarea 크기 자동 조절
                      const target = e.target as HTMLTextAreaElement;
                      const maxWidth = Math.min(
                        target.scrollWidth,
                        window.innerWidth - 48
                      );
                      target.style.height = 'auto';
                      target.style.width = 'auto';
                      target.style.height = `${target.scrollHeight}px`;
                      target.style.width = `${Math.max(maxWidth, 1)}px`;
                    }}
                  />
                </div>

                {/* 텍스트 스타일 블록 - 모바일에서만 표시 (편집 모드일 때만) */}
                <div
                  className="bg-white rounded-lg shadow-md p-3 mt-3 max-w-2xl w-full lg:hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-2">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      {t('fontSetting')}
                    </label>
                    <div className="flex gap-1 flex-wrap max-h-[102px] overflow-y-auto pr-1">
                      {fontNames.map((fontName, index) => (
                        <button
                          key={fontName}
                          onClick={() => handleFontChange(index)}
                          className={`px-2 py-1 rounded-lg text-sm font-medium transition-all ${
                            editingElement.fontIndex === index
                              ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          } ${fonts[index].className}`}
                        >
                          {fontName}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        {t('color')}
                      </label>
                      {colorPalette.length > 0 ? (
                        <div className="flex justify-between gap-1">
                          {colorPalette.map(([r, g, b], index) => {
                            const hexColor = `#${[r, g, b]
                              .map((x) => {
                                const hex = x.toString(16);
                                return hex.length === 1 ? '0' + hex : hex;
                              })
                              .join('')}`;
                            const currentColor =
                              editingElement?.color || '#000000';
                            const isSelected =
                              currentColor.toLowerCase() ===
                              hexColor.toLowerCase();

                            return (
                              <button
                                key={index}
                                onClick={() => {
                                  if (editingTextId) {
                                    updateElementStyle(editingTextId, {
                                      color: hexColor,
                                    });
                                  }
                                }}
                                className={`w-4 h-4 rounded border transition-all ${
                                  isSelected
                                    ? 'border-blue-500 ring-2 ring-blue-300 scale-110'
                                    : 'border-gray-300 hover:border-gray-400 hover:scale-105'
                                }`}
                                style={{ backgroundColor: hexColor }}
                                title={`RGB(${r}, ${g}, ${b})`}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 py-2">
                          {t('extractingColors')}
                        </div>
                      )}
                    </div>

                    <div className="flex">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          {t('backgroundColor')}
                        </label>
                        <button
                          className={`px-2 py-1 rounded text-xs transition-colors ${(() => {
                            if (!editingElement)
                              return 'bg-blue-500 text-white hover:bg-blue-600';

                            if (editingElement.backgroundColor === 'white') {
                              return 'bg-white text-black border border-gray-300 hover:bg-gray-50';
                            } else if (
                              editingElement.backgroundColor === 'black'
                            ) {
                              return 'bg-black text-white hover:bg-gray-800';
                            } else {
                              return 'bg-transparent text-black border border-gray-300 hover:bg-gray-50';
                            }
                          })()}`}
                          onClick={() => {
                            if (!editingElement || !editingTextId) return;

                            // 순환 로직: 하얀색 → 검정색 → 없음 → 하얀색
                            let nextBackgroundColor:
                              | 'transparent'
                              | 'black'
                              | 'white';

                            if (editingElement.backgroundColor === 'white') {
                              nextBackgroundColor = 'black';
                            } else if (
                              editingElement.backgroundColor === 'black'
                            ) {
                              nextBackgroundColor = 'transparent';
                            } else {
                              nextBackgroundColor = 'white';
                            }

                            updateElementStyle(editingTextId, {
                              backgroundColor: nextBackgroundColor,
                            });
                          }}
                        >
                          {(() => {
                            if (!editingElement) return t('backgroundText');

                            if (editingElement.backgroundColor === 'white') {
                              return t('backgroundWhite');
                            } else if (
                              editingElement.backgroundColor === 'black'
                            ) {
                              return t('backgroundBlack');
                            } else {
                              return t('backgroundNone');
                            }
                          })()}
                        </button>
                      </div>

                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">
                          {t('fontSize')}
                        </label>
                        <input
                          type="range"
                          min={minFont}
                          max={maxFont}
                          value={editingElement?.fontSize || 12}
                          onChange={(e) => {
                            if (editingTextId) {
                              updateElementStyle(editingTextId, {
                                fontSize: parseInt(e.target.value),
                              });
                            }
                          }}
                          className="w-full"
                        />
                        <div className="mt-1">
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            {t('fontWeight')}
                          </label>
                          <input
                            type="range"
                            min={100}
                            max={900}
                            step={100}
                            value={editingElement?.fontWeight || 400}
                            onChange={(e) => {
                              if (editingTextId) {
                                updateElementStyle(editingTextId, {
                                  fontWeight: parseInt(e.target.value),
                                });
                              }
                            }}
                            className="w-full"
                          />
                          {/* <div className="text-xs text-gray-500 mt-1 text-center">
                            {editingElement?.fontWeight || 400}
                          </div> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
      <PaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        isLoggedIn={!!user}
        onSuccess={async () => {
          // 충전 완료 후 서버에서 최신 크레딧 조회
          await fetchCredits();
          // 이미지 추가 생성 재시도
          handleGenerateMoreClick();
        }}
      />
    </div>
  );
}
