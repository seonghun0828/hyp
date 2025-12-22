'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFunnelStore, SuccessTexts } from '@/lib/store';
import { STEP_NAMES, TOTAL_STEPS } from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import ColorThief from 'colorthief';
import { fonts, fontNames } from '@/lib/fonts';

const minFont = 4;
const maxFont = 36;

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  backgroundColor: 'transparent' | 'black' | 'white';
  isSelected: boolean;
  type: 'recommended' | 'custom'; // 추천 텍스트인지 커스텀 텍스트인지
  recommendedPrincipleKey?: string; // 추천 텍스트인 경우 어떤 원칙의 텍스트인지
  fontIndex: number; // 각 텍스트가 사용하는 폰트 인덱스
}

export default function EditorPage() {
  const router = useRouter();
  const {
    summary,
    styles,
    imageUrl,
    imagePrompt,
    successTexts,
    setSuccessTexts,
    setFinalImageUrl,
  } = useFunnelStore();

  // 비율에 따른 에디터 컨테이너 크기 계산
  const getEditorContainerSize = useCallback(() => {
    const aspectRatio = styles?.aspectRatio || '4:5';

    // 화면 크기 기반 제약
    const viewportWidth =
      typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight =
      typeof window !== 'undefined' ? window.innerHeight : 800;

    // 컨테이너가 들어갈 수 있는 최대 크기 (패딩 고려)
    const maxWidth = Math.min(1200, viewportWidth - 100); // 좌우 패딩 고려
    const maxHeight = Math.min(viewportHeight * 0.7, viewportHeight - 300); // 상하 여백 고려 (60% -> 70%로 증가)

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

    return { width, height };
  }, [styles?.aspectRatio]);

  const [containerSize, setContainerSize] = useState(() => ({
    width: 800,
    height: 1000,
  }));

  // 비율 변경 및 화면 크기 변경 시 컨테이너 크기 재계산
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSize = () => {
      setContainerSize(getEditorContainerSize());
    };

    // 초기 크기 설정
    updateSize();

    // 리사이즈 이벤트 리스너 추가
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [getEditorContainerSize]);
  // SUCCESs 원칙 관련 상태
  const [currentIndex, setCurrentIndex] = useState(0);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [isTextButtonMinimized, setIsTextButtonMinimized] = useState(false);

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
            const textWidth = measureTextWidthWithDOM(
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
  const [isHydrated, setIsHydrated] = useState(false);

  // 텍스트 편집 모달 상태
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // SUCCESs 원칙 정의 (한글)
  const principles = [
    {
      key: 'simple',
      label: '단순성',
      desc: '메시지를 한눈에 이해할 수 있게 핵심만 전달해요.',
      color: 'bg-blue-500',
    },
    {
      key: 'unexpected',
      label: '의외성',
      desc: '예상 밖의 전개로 주목을 끌어요.',
      color: 'bg-purple-500',
    },
    {
      key: 'concrete',
      label: '구체성',
      desc: '생생한 사실과 사례로 보여줘요.',
      color: 'bg-green-500',
    },
    {
      key: 'credible',
      label: '신뢰성',
      desc: '근거와 데이터로 믿음을 줘요.',
      color: 'bg-orange-500',
    },
    {
      key: 'emotional',
      label: '감성',
      desc: '사람의 마음을 움직이는 감정을 담아요.',
      color: 'bg-pink-500',
    },
    {
      key: 'story',
      label: '스토리',
      desc: '이야기로 제품의 가치를 자연스럽게 전달해요.',
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
    if (!isHydrated) return;

    // 상태 확인 및 적절한 페이지로 리다이렉트
    if (!summary) {
      router.push('/');
      return;
    }
    if (
      !styles ||
      !styles.messageType ||
      !styles.expressionStyle ||
      !styles.toneMood ||
      !styles.modelComposition
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
    if (successTexts && currentPrinciple && textElements.length === 0) {
      createRecommendedText();
    }
  }, [summary, styles, imageUrl, successTexts, router, isHydrated]);

  // 홍보 문구 스타일 변경 시 추천 텍스트 재생성
  useEffect(() => {
    if (!isHydrated || !successTexts || !currentPrinciple) return;

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
  }, [currentIndex, isHydrated, successTexts, currentPrinciple?.key]);

  // summary가 변경될 때 successTexts 초기화
  const [lastSummaryUrl, setLastSummaryUrl] = useState<string | null>(null);
  const [lastConceptId, setLastConceptId] = useState<string | null>(null);

  useEffect(() => {
    if (isHydrated && summary) {
      const currentUrl = summary.url;

      // URL이 변경되었을 때 successTexts 초기화
      if (lastSummaryUrl && lastSummaryUrl !== currentUrl) {
        // successTexts 초기화
        setSuccessTexts(undefined);
        // 이미지 업로드 페이지로 리다이렉트하여 새로 생성
        router.push('/upload');
      }

      setLastSummaryUrl(currentUrl);
    }
  }, [summary, isHydrated, lastSummaryUrl, setSuccessTexts, router]);

  // 컨셉 변경 감지 로직 제거 - API가 캐시 키로 처리하므로 불필요

  useEffect(() => {
    // Zustand persist가 hydration을 완료할 때까지 기다림
    setIsHydrated(true);
  }, []);

  // DOM을 사용한 정확한 텍스트 너비 측정
  const measureTextWidthWithDOM = (
    text: string,
    fontSize: number,
    fontFamily: string
  ): number => {
    // 임시 요소 생성
    const measureElement = document.createElement('span');
    measureElement.style.visibility = 'hidden';
    measureElement.style.position = 'absolute';
    measureElement.style.whiteSpace = 'pre';
    measureElement.style.fontSize = `${fontSize}px`;
    measureElement.style.fontFamily = fontFamily;
    measureElement.textContent = text;

    document.body.appendChild(measureElement);
    const width = measureElement.offsetWidth;
    document.body.removeChild(measureElement);

    return width;
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
      const width = measureTextWidthWithDOM(text, fontSize, fontFamily);
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

    // 실제 사용 가능한 너비
    const availableWidth = containerWidth - textPaddingLeft - textPaddingRight;

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

    // 텍스트 너비 측정
    const textWidth = measureTextWidthWithDOM(
      currentText,
      actualFontSize,
      fontFamily
    );

    // 가운데 정렬 계산
    const totalTextWidth = textWidth + textPaddingLeft + textPaddingRight;
    let centerX = (containerWidth - totalTextWidth) / 2;

    // 컨테이너 높이 가져오기
    const containerHeight = getContainerHeight();

    // 위치 계산
    const textHeight = actualFontSize * 1.5;
    const padding = 16;
    const totalHeight = textHeight + 8;

    // 위치는 기존 추천 텍스트의 위치를 유지 (있으면)
    let finalX = styleSource?.x ?? centerX;
    let finalY = styleSource?.y ?? 100;

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
      text: currentText,
      x: finalX,
      y: finalY,
      fontSize: actualFontSize,
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
            const textWidth = measureTextWidthWithDOM(
              newElement.text,
              newElement.fontSize,
              fontFamily
            );
            const textHeight = newElement.fontSize * 1.5; // 대략적인 높이
            const padding = 16; // 좌우 패딩 (4px + 8px) * 2
            const totalWidth = textWidth + padding;
            const totalHeight = textHeight + 8; // 상하 패딩

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

    // 마우스 이벤트 핸들러
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newX = moveEvent.clientX - containerRect.left - offsetX;
      const newY = moveEvent.clientY - containerRect.top - offsetY;

      setTextElements((prev) =>
        prev.map((el) =>
          el.id === element.id ? { ...el, x: newX, y: newY } : el
        )
      );
    };

    const handleMouseUp = () => {
      setIsDragging(false);
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
      const newX = touch.clientX - containerRect.left - offsetX;
      const newY = touch.clientY - containerRect.top - offsetY;

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
      !styles.expressionStyle ||
      !styles.toneMood ||
      !styles.modelComposition ||
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
          // 1. 버튼들을 감싸고 있는 컨테이너 찾기
          // "수정/삭제 버튼이 들어있는 div" = div.flex.justify-end
          const buttonContainers = clonedDoc.querySelectorAll(
            'div.flex.justify-end'
          );

          buttonContainers.forEach((container) => {
            // 해당 컨테이너를 투명하게 만듦 (공간은 차지함)
            (container as HTMLElement).style.visibility = 'hidden';
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
        throw new Error('콘텐츠 저장에 실패했습니다.');
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
      router.push(`/result?result-id=${contentId}`);
    } catch (error) {
      console.error('Save error:', error);
      alert(
        error instanceof Error
          ? error.message
          : '저장 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    } finally {
      setLoading(false);
    }
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

  if (
    !summary ||
    !styles ||
    !styles.messageType ||
    !styles.expressionStyle ||
    !styles.toneMood ||
    !styles.modelComposition ||
    !imageUrl
  ) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <ProgressBar
        currentStep={9}
        totalSteps={TOTAL_STEPS}
        stepNames={STEP_NAMES}
      />

      <div className="container mx-auto px-4 pb-8 md:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              콘텐츠 에디터
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* SUCCESs 원칙 네비게이션 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  홍보 문구 스타일
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
                            {currentPrinciple?.label}
                          </p>
                          <p className="text-xs text-gray-600">
                            {currentPrinciple?.desc}
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
                        ← 이전
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
                        다음 →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-sm">
                      문구를 생성하고 있습니다...
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {loadedPrinciples.length} / 6 완료
                    </p>
                  </div>
                )}
              </div>

              {/* 텍스트 스타일 조정 - 데스크톱에서만 표시 */}
              {selectedElement && (
                <div className="bg-white rounded-lg shadow-md p-6 mt-6 hidden lg:block">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    텍스트 스타일
                  </h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      글꼴 설정
                    </label>
                    <div className="flex gap-2 flex-wrap">
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
                        색상
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
                          이미지에서 색상을 추출하는 중...
                        </div>
                      )}
                    </div>

                    <div className="flex">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          배경색
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
                            if (!current) return '글자';

                            if (current.backgroundColor === 'white') {
                              return '하얀색';
                            } else if (current.backgroundColor === 'black') {
                              return '검정색';
                            } else {
                              return '없음';
                            }
                          })()}
                        </button>
                      </div>

                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          글자 크기
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
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 캔버스 영역 - 홍보 문구 스타일 바로 아래 */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-center">
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
                        {!isTextButtonMinimized && <span>텍스트</span>}
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
                          title="최소화"
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
                            console.error('색상 추출 실패:', error);
                          }
                        }}
                      />
                      {/* 텍스트 오버레이 */}
                      {textElements.map((element) => {
                        const isEditing = editingTextId === element.id;
                        const elementFontClassName =
                          fonts[element.fontIndex].className;
                        return (
                          <div
                            key={element.id}
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
                                    className="absolute flex gap-1.5 md:gap-2 z-20"
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
                                      title="텍스트 수정"
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
                                      title="텍스트 삭제"
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
                                  className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap"
                                  style={{
                                    fontSize: `${Math.max(
                                      element.fontSize * 0.4,
                                      8
                                    )}px`,
                                  }}
                                >
                                  AI 추천
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-center gap-4">
                  <Button variant="outline" onClick={() => router.back()}>
                    뒤로가기
                  </Button>
                  <Button onClick={handleSave} loading={loading}>
                    완성하기
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
              <div className="w-full flex flex-col items-center py-6">
                {/* 스타일이 적용된 텍스트 편집 박스 */}
                <div
                  className={`inline-block ${editingFontClassName}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    color: editingElement.color,
                    backgroundColor:
                      editingElement.backgroundColor === 'transparent'
                        ? 'transparent'
                        : editingElement.backgroundColor === 'black'
                        ? 'rgb(0, 0, 0)'
                        : 'rgb(255, 255, 255)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    whiteSpace: 'pre',
                    fontSize: `${editingElement.fontSize}px`,
                    display: 'inline-block',
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
                      color: editingElement.color,
                      backgroundColor: 'transparent',
                      whiteSpace: 'pre',
                      lineHeight: 'normal',
                      overflow: 'hidden',
                      fontFamily: 'inherit',
                      fontWeight: 'inherit',
                      letterSpacing: 'inherit',
                      width: 'auto',
                      minWidth: '1ch',
                      height: 'auto',
                    }}
                    placeholder="텍스트를 입력하세요"
                    autoFocus
                    ref={(textarea) => {
                      if (textarea) {
                        // 초기 크기 설정
                        textarea.style.height = 'auto';
                        textarea.style.width = 'auto';
                        textarea.style.height = `${textarea.scrollHeight}px`;
                        textarea.style.width = `${Math.max(
                          textarea.scrollWidth,
                          1
                        )}px`;
                      }
                    }}
                    onInput={(e) => {
                      // textarea 크기 자동 조절
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.width = 'auto';
                      target.style.height = `${target.scrollHeight}px`;
                      target.style.width = `${Math.max(
                        target.scrollWidth,
                        1
                      )}px`;
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
                      글꼴 설정
                    </label>
                    <div className="flex gap-1 flex-wrap">
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
                        색상
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
                          이미지에서 색상을 추출하는 중...
                        </div>
                      )}
                    </div>

                    <div className="flex">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          배경색
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
                            if (!editingElement) return '글자';

                            if (editingElement.backgroundColor === 'white') {
                              return '하얀색';
                            } else if (
                              editingElement.backgroundColor === 'black'
                            ) {
                              return '검정색';
                            } else {
                              return '없음';
                            }
                          })()}
                        </button>
                      </div>

                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          글자 크기
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
