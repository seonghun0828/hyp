'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFunnelStore, SuccessTexts } from '@/lib/store';
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

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  backgroundColor: 'transparent' | 'black' | 'white';
  isSelected: boolean;
}

export default function EditorPage() {
  const router = useRouter();
  const {
    summary,
    concept,
    imageUrl,
    successTexts,
    setSuccessTexts,
    setFinalImageUrl,
  } = useFunnelStore();
  // SUCCESs 원칙 관련 상태
  const [currentIndex, setCurrentIndex] = useState(0);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

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

  // 디버깅용 로그
  console.log('🎯 Editor page - loaded principles:', {
    totalPrinciples: principles.length,
    loadedCount: loadedPrinciples.length,
    loadedKeys: loadedPrinciples.map((p) => p.key),
    currentIndex,
    currentPrinciple: currentPrinciple?.key,
    hasSuccessTexts: !!successTexts,
    navigationText:
      loadedPrinciples.length > 0
        ? `${currentIndex + 1} / ${loadedPrinciples.length}`
        : '0 / 0',
  });

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
    if (!imageUrl) {
      router.push('/upload');
      return;
    }
    // successTexts가 없어도 에디터 페이지에 머물러서 로딩 표시
    // if (!successTexts) {
    //   router.push('/upload');
    //   return;
    // }

    // 선택된 원칙의 문구로 텍스트 요소 생성 (successTexts가 있을 때만)
    if (successTexts && currentPrinciple) {
      createTextElement();
    }
  }, [
    summary,
    concept,
    imageUrl,
    successTexts,
    router,
    isHydrated,
    currentIndex,
  ]);

  // summary가 변경될 때 successTexts 초기화
  const [lastSummaryUrl, setLastSummaryUrl] = useState<string | null>(null);
  const [lastConceptId, setLastConceptId] = useState<string | null>(null);

  useEffect(() => {
    if (isHydrated && summary) {
      const currentUrl = summary.url;

      // URL이 변경되었을 때 successTexts 초기화
      if (lastSummaryUrl && lastSummaryUrl !== currentUrl) {
        console.log('Summary URL changed, clearing successTexts:', {
          lastSummaryUrl,
          currentUrl,
        });
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

  // 선택된 원칙의 문구로 텍스트 요소 생성
  const createTextElement = () => {
    if (!successTexts || !currentPrinciple) return;

    const currentText = successTexts[currentPrinciple.key];
    if (!currentText) return;

    // 기존 텍스트 요소가 있으면 업데이트, 없으면 새로 생성
    const existingElement = textElements.find((el) => el.text === currentText);

    if (!existingElement) {
      const newElement: TextElement = {
        id: `text-${Date.now()}`,
        text: currentText,
        x: 50,
        y: 100,
        fontSize: 12,
        color: '#000000',
        fontFamily: 'Arial',
        backgroundColor: 'white',
        isSelected: true,
      };

      setTextElements([newElement]);
      setSelectedElement(newElement.id);
    } else {
      // 기존 요소 선택
      setTextElements((prev) =>
        prev.map((el) => ({ ...el, isSelected: el.id === existingElement.id }))
      );
      setSelectedElement(existingElement.id);
    }
  };

  // HTML/CSS 방식으로 변경 - drawCanvas 함수 제거

  // HTML/CSS 방식으로 변경 - drawCanvas 호출 제거

  // 자동 텍스트 생성 제거 - 사용자가 옵션을 클릭할 때만 생성

  // HTML/CSS 방식으로 변경 - 중복 제거

  // 텍스트 편집 모달 함수들
  const openTextEditor = (elementId: string, currentText: string) => {
    setEditingTextId(elementId);
    setEditingText(currentText);
  };

  const closeTextEditor = () => {
    setEditingTextId(null);
    setEditingText('');
  };

  const saveTextEdit = () => {
    if (editingTextId && editingText.trim() !== '') {
      setTextElements((prev) =>
        prev.map((el) =>
          el.id === editingTextId ? { ...el, text: editingText.trim() } : el
        )
      );
    }
    closeTextEditor();
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
      const updated = prev.map((el) =>
        el.id === elementId ? { ...el, ...updates } : el
      );
      return updated;
    });
  };

  const deleteTextElement = (elementId: string) => {
    setTextElements((prev) => prev.filter((el) => el.id !== elementId));
    setSelectedElement(null);
  };

  const handleSave = async () => {
    // html2canvas-pro를 사용하여 div를 이미지로 변환 (lab() 색상 함수 지원)
    const { default: html2canvas } = await import('html2canvas-pro');
    const element = document.querySelector('.editor-container') as HTMLElement;

    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        // width, height 제거 - 실제 DOM 크기 사용
        useCORS: true,
        allowTaint: true,
        logging: false,
        foreignObjectRendering: false,
        removeContainer: true,
        ignoreElements: (element) => {
          // 에디터 UI 요소들만 제외
          if (element.classList) {
            // 텍스트 툴바 제외
            if (element.classList.contains('text-toolbar')) {
              return true;
            }
            // 삭제 버튼 제외
            if (
              element.classList.contains('bg-red-500') ||
              element.classList.contains('bg-red-600') ||
              (element.tagName === 'BUTTON' && element.textContent === '×')
            ) {
              return true;
            }
            // 편집 버튼 제외
            if (
              element.classList.contains('bg-blue-500') ||
              element.classList.contains('bg-blue-600') ||
              (element.tagName === 'BUTTON' && element.textContent === '✏️')
            ) {
              return true;
            }
          }
          return false;
        },
        onclone: (clonedDoc) => {
          // 선택된 요소의 스타일 정리
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.outline = 'none';
            htmlEl.style.boxShadow = 'none';
          });
        },
      });

      const finalImageUrl = canvas.toDataURL('image/png');

      // sessionStorage에 저장 (localStorage 용량 초과 방지)
      sessionStorage.setItem('finalImageUrl', finalImageUrl);

      // Zustand store에도 저장 (UI 업데이트용)
      setFinalImageUrl(finalImageUrl);
      router.push('/result');
    } catch (error) {
      console.error('이미지 생성 실패:', error);
      alert('이미지 생성에 실패했습니다. 다시 시도해주세요.');
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

  if (!summary || !concept || !imageUrl) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <ProgressBar currentStep={5} totalSteps={6} stepNames={stepNames} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              콘텐츠 에디터
            </h1>
            <p className="text-gray-600">
              텍스트를 드래그하여 위치를 조정하고 스타일을 변경해보세요
            </p>
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

              {/* 텍스트 스타일 조정 */}
              {selectedElement && (
                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    텍스트 스타일
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        폰트 크기
                      </label>
                      <input
                        type="range"
                        min="6"
                        max="48"
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        색상
                      </label>
                      <input
                        type="color"
                        key={selectedElement} // key 추가로 강제 리렌더링
                        value={
                          textElements.find((el) => el.id === selectedElement)
                            ?.color || '#000000'
                        }
                        onChange={(e) => {
                          const newColor = e.target.value;
                          updateElementStyle(selectedElement, {
                            color: newColor,
                          });
                        }}
                        onInput={(e) => {
                          const newColor = (e.target as HTMLInputElement).value;
                          updateElementStyle(selectedElement, {
                            color: newColor,
                          });
                        }}
                        onMouseMove={(e) => {
                          if (e.buttons === 1) {
                            const newColor = (e.target as HTMLInputElement)
                              .value;
                            updateElementStyle(selectedElement, {
                              color: newColor,
                            });
                          }
                        }}
                        onMouseDown={(e) => {
                          const newColor = (e.target as HTMLInputElement).value;
                          updateElementStyle(selectedElement, {
                            color: newColor,
                          });
                        }}
                        onMouseUp={(e) => {
                          const newColor = (e.target as HTMLInputElement).value;
                          updateElementStyle(selectedElement, {
                            color: newColor,
                          });
                        }}
                        onFocus={(e) => {
                          const newColor = (e.target as HTMLInputElement).value;
                          updateElementStyle(selectedElement, {
                            color: newColor,
                          });
                        }}
                        onBlur={(e) => {
                          const newColor = (e.target as HTMLInputElement).value;
                          updateElementStyle(selectedElement, {
                            color: newColor,
                          });
                        }}
                        onClick={(e) => {
                          const newColor = (e.target as HTMLInputElement).value;
                          updateElementStyle(selectedElement, {
                            color: newColor,
                          });
                        }}
                        onKeyDown={(e) => {
                          const newColor = (e.target as HTMLInputElement).value;
                          updateElementStyle(selectedElement, {
                            color: newColor,
                          });
                        }}
                        onKeyUp={(e) => {
                          const newColor = (e.target as HTMLInputElement).value;
                          updateElementStyle(selectedElement, {
                            color: newColor,
                          });
                        }}
                        className="w-full h-10 rounded border"
                      />
                    </div>

                    <div>
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
                  </div>
                </div>
              )}
            </div>

            {/* 캔버스 영역 */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-center">
                  <div
                    className="relative border border-gray-300 rounded-lg overflow-hidden editor-container"
                    style={{ width: '800px', height: '600px' }}
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
                      className="w-full h-full object-contain bg-white"
                    />
                    {/* 텍스트 오버레이 */}
                    {textElements.map((element) => (
                      <div
                        key={element.id}
                        className={`absolute cursor-move select-none z-10 ${
                          element.isSelected ? 'ring-2 ring-blue-500' : ''
                        }`}
                        style={{
                          left: `${element.x}px`,
                          top: `${element.y}px`,
                          fontSize: `${element.fontSize}px`,
                          fontFamily: element.fontFamily,
                          color: element.color,
                          backgroundColor:
                            element.backgroundColor === 'transparent'
                              ? 'transparent'
                              : element.backgroundColor === 'black'
                              ? 'rgba(0, 0, 0, 0.8)'
                              : 'rgba(255, 255, 255, 0.8)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          whiteSpace: 'pre', // 줄바꿈 표시
                          display: 'inline-block', // 인라인 블록으로 설정
                        }}
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // 더블클릭으로 커스텀 텍스트 편집 모달 열기
                          openTextEditor(element.id, element.text);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedElement(element.id);
                          setIsDragging(true);

                          // 선택 상태 업데이트
                          setTextElements((prev) =>
                            prev.map((el) => ({
                              ...el,
                              isSelected: el.id === element.id,
                            }))
                          );

                          // 드래그 시작 시 마우스와 텍스트의 오프셋 계산
                          const container =
                            document.querySelector('.editor-container');
                          if (container) {
                            const containerRect =
                              container.getBoundingClientRect();
                            const offsetX =
                              e.clientX - containerRect.left - element.x;
                            const offsetY =
                              e.clientY - containerRect.top - element.y;

                            // 전역 마우스 이벤트 핸들러
                            const handleGlobalMouseMove = (
                              moveEvent: MouseEvent
                            ) => {
                              const newX =
                                moveEvent.clientX -
                                containerRect.left -
                                offsetX;
                              const newY =
                                moveEvent.clientY - containerRect.top - offsetY;

                              setTextElements((prev) =>
                                prev.map((el) =>
                                  el.id === element.id
                                    ? { ...el, x: newX, y: newY }
                                    : el
                                )
                              );
                            };

                            const handleGlobalMouseUp = () => {
                              setIsDragging(false);
                              document.removeEventListener(
                                'mousemove',
                                handleGlobalMouseMove
                              );
                              document.removeEventListener(
                                'mouseup',
                                handleGlobalMouseUp
                              );
                            };

                            document.addEventListener(
                              'mousemove',
                              handleGlobalMouseMove
                            );
                            document.addEventListener(
                              'mouseup',
                              handleGlobalMouseUp
                            );
                          }
                        }}
                      >
                        {element.text}
                        {/* 수정 버튼 */}
                        <button
                          className="absolute -top-2 -right-4 w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-blue-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            // 커스텀 텍스트 편집 모달 열기
                            openTextEditor(element.id, element.text);
                          }}
                          title="텍스트 수정"
                        >
                          ✏️
                        </button>
                        {/* 삭제 버튼 */}
                        <button
                          className="absolute -top-2 -right-10 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTextElement(element.id);
                          }}
                          title="텍스트 삭제"
                        >
                          ×
                        </button>
                      </div>
                    ))}
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

      {/* 커스텀 텍스트 편집 모달 */}
      {editingTextId && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeTextEditor}
        >
          <div
            className="bg-white rounded-lg p-6 shadow-xl"
            style={{ width: '800px', height: '600px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">텍스트 편집</h3>
            <div
              className="relative"
              style={{ width: '100%', height: '300px' }}
            >
              <textarea
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    closeTextEditor();
                  } else if (e.key === 'Enter' && e.ctrlKey) {
                    saveTextEdit();
                  }
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  padding: '4px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  resize: 'none',
                  outline: 'none',
                  fontFamily:
                    textElements.find((el) => el.id === editingTextId)
                      ?.fontFamily || 'Arial',
                  fontSize: `${
                    textElements.find((el) => el.id === editingTextId)
                      ?.fontSize || 12
                  }px`,
                  color:
                    textElements.find((el) => el.id === editingTextId)?.color ||
                    '#000000',
                  backgroundColor: (() => {
                    const element = textElements.find(
                      (el) => el.id === editingTextId
                    );
                    if (!element) return 'rgba(255, 255, 255, 0.8)';
                    return element.backgroundColor === 'transparent'
                      ? 'transparent'
                      : element.backgroundColor === 'black'
                      ? 'rgba(0, 0, 0, 0.8)'
                      : 'rgba(255, 255, 255, 0.8)';
                  })(),
                  whiteSpace: 'pre',
                }}
                placeholder="텍스트를 입력하세요... (Ctrl+Enter로 저장, Esc로 취소)"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={closeTextEditor} variant="outline" size="sm">
                취소
              </Button>
              <Button onClick={saveTextEdit} size="sm">
                저장
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
