import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProductSummary {
  id?: string;
  url: string;
  title: string;
  description: string;
  features: string[];
  targetUsers: string[];
  createdAt?: string;
}

export interface Concept {
  id: string;
  name: string;
  description: string;
  exampleImage: string;
  promptTemplate: string;
}

export interface GeneratedContent {
  id?: string;
  summaryId?: string;
  conceptId?: string;
  prompt?: string;
  imageUrl?: string;
  textOptions?: string[];
  selectedTextIndex?: number;
  finalImageUrl?: string;
  createdAt?: string;
}

interface FunnelState {
  // Step 1: URL 입력
  url: string;

  // Step 2: 제품 요약
  summary?: ProductSummary;

  // Step 3: 컨셉 선택
  concept?: Concept;

  // Step 4: 이미지 업로드
  imageUrl?: string;

  // Step 5: 텍스트 생성
  textOptions?: string[];
  selectedTextIndex?: number;

  // Step 6: 에디터
  finalImageUrl?: string;

  // Actions
  setUrl: (url: string) => void;
  setSummary: (summary: ProductSummary) => void;
  setConcept: (concept: Concept) => void;
  setImageUrl: (imageUrl: string) => void;
  setTextOptions: (textOptions: string[]) => void;
  setSelectedTextIndex: (index: number) => void;
  setFinalImageUrl: (imageUrl: string) => void;
  reset: () => void;
}

export const useFunnelStore = create<FunnelState>()(
  persist(
    (set) => ({
      url: '',
      summary: undefined,
      concept: undefined,
      imageUrl: undefined,
      textOptions: undefined,
      selectedTextIndex: undefined,
      finalImageUrl: undefined,

      setUrl: (url) => set({ url }),
      setSummary: (summary) => set({ summary }),
      setConcept: (concept) => set({ concept }),
      setImageUrl: (imageUrl) => set({ imageUrl }),
      setTextOptions: (textOptions) => set({ textOptions }),
      setSelectedTextIndex: (selectedTextIndex) => set({ selectedTextIndex }),
      setFinalImageUrl: (finalImageUrl) => set({ finalImageUrl }),
      reset: () =>
        set({
          url: '',
          summary: undefined,
          concept: undefined,
          imageUrl: undefined,
          textOptions: undefined,
          selectedTextIndex: undefined,
          finalImageUrl: undefined,
        }),
    }),
    {
      name: 'hyp-funnel-storage', // localStorage 키 이름
      partialize: (state) => ({
        // 저장할 상태만 선택 (finalImageUrl은 용량 문제로 제외)
        url: state.url,
        summary: state.summary,
        concept: state.concept,
        imageUrl: state.imageUrl,
        textOptions: state.textOptions,
        selectedTextIndex: state.selectedTextIndex,
        // finalImageUrl은 localStorage에서 제외 (용량 초과 방지)
      }),
    }
  )
);
