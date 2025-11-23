import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProductCategory } from './categories/types';

export interface ProductSummary {
  id?: string;
  url: string;
  title?: string; // 제품명
  core_value: string; // 필수
  target_customer: string; // 필수
  competitive_edge: string; // 필수
  customer_benefit: string; // 필수
  emotional_keyword?: string; // 선택
  feature_summary?: string; // 선택
  usage_scenario?: string; // 선택
  category?: ProductCategory; // 카테고리 (industry, form, purpose)
  createdAt?: string;
}

export interface Styles {
  messageType?: string;
  expressionStyle?: string;
  toneMood?: string;
  modelComposition?: string;
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

export interface SuccessTexts {
  simple: string;
  unexpected: string;
  concrete: string;
  credible: string;
  emotional: string;
  story: string;
}

interface FunnelState {
  // Step 1: URL 입력
  url: string;

  // Step 2: 제품 요약
  summary?: ProductSummary;

  // Step 3-6: 스타일 선택 (4단계)
  styles?: Styles;

  // Step 7: 이미지 업로드
  imageUrl?: string;
  imagePrompt?: string; // 이미지 생성에 사용된 프롬프트

  // Step 8: SUCCESs 원칙 홍보문구
  successTexts?: SuccessTexts;

  // Step 9: 에디터
  finalImageUrl?: string;

  // Actions
  setUrl: (url: string) => void;
  setSummary: (summary: ProductSummary) => void;
  setStyles: (styles: Styles) => void;
  setMessageType: (messageType: string) => void;
  setExpressionStyle: (expressionStyle: string) => void;
  setToneMood: (toneMood: string) => void;
  setModelComposition: (modelComposition: string) => void;
  setImageUrl: (imageUrl: string) => void;
  setImagePrompt: (imagePrompt: string | undefined) => void;
  setSuccessTexts: (texts: SuccessTexts | undefined) => void;
  setFinalImageUrl: (imageUrl: string) => void;
  reset: () => void;
}

export const useFunnelStore = create<FunnelState>()(
  persist(
    (set) => ({
      url: '',
      summary: undefined,
      styles: undefined,
      imageUrl: undefined,
      imagePrompt: undefined,
      successTexts: undefined,
      finalImageUrl: undefined,

      setUrl: (url) => set({ url }),
      setSummary: (summary) => set({ summary }),
      setStyles: (styles) => set({ styles }),
      setMessageType: (messageType) =>
        set((state) => ({
          styles: { ...state.styles, messageType },
        })),
      setExpressionStyle: (expressionStyle) =>
        set((state) => ({
          styles: { ...state.styles, expressionStyle },
        })),
      setToneMood: (toneMood) =>
        set((state) => ({
          styles: { ...state.styles, toneMood },
        })),
      setModelComposition: (modelComposition) =>
        set((state) => ({
          styles: { ...state.styles, modelComposition },
        })),
      setImageUrl: (imageUrl) => set({ imageUrl }),
      setImagePrompt: (imagePrompt) => set({ imagePrompt }),
      setSuccessTexts: (successTexts) => set({ successTexts }),
      setFinalImageUrl: (finalImageUrl) => set({ finalImageUrl }),
      reset: () =>
        set({
          url: '',
          summary: undefined,
          styles: undefined,
          imageUrl: undefined,
          imagePrompt: undefined,
          successTexts: undefined,
          finalImageUrl: undefined,
        }),
    }),
    {
      name: 'hyp-funnel-storage', // localStorage 키 이름
      partialize: (state) => ({
        // 저장할 상태만 선택 (finalImageUrl은 용량 문제로 제외)
        url: state.url,
        summary: state.summary,
        styles: state.styles,
        imageUrl: state.imageUrl,
        imagePrompt: state.imagePrompt,
        successTexts: state.successTexts,
        // finalImageUrl은 localStorage에서 제외 (용량 초과 방지)
      }),
    }
  )
);
