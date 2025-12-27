import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { ProductCategory } from './categories/types';

// Custom storage object using IndexedDB
const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

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
  messageType: string;
  visualStyle: string;
  toneMood: string;
  model: string;
  aspectRatio: '1:1' | '4:5' | '16:9';
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
  // Hydration Status
  hasHydrated: boolean;

  // Step 1: URL 입력
  url: string;

  // Step 2: 제품 요약
  summary?: ProductSummary;

  // Step 3-6: 스타일 선택 (4단계)
  styles?: Styles;

  // Step 7: 이미지 업로드
  imageUrl?: string;
  imagePrompt?: string; // 이미지 생성에 사용된 프롬프트
  generatedImages: Array<{ url: string; prompt: string }>; // 생성된 이미지 리스트

  // Step 8: SUCCESs 원칙 홍보문구
  successTexts?: SuccessTexts;

  // Step 9: 에디터
  finalImageUrl?: string;

  // Actions
  setHasHydrated: (state: boolean) => void;
  setUrl: (url: string) => void;
  setSummary: (summary: ProductSummary) => void;
  setStyles: (styles: Styles) => void;
  setMessageType: (messageType: string) => void;
  setVisualStyle: (visualStyle: string) => void;
  setToneMood: (toneMood: string) => void;
  setModel: (model: string) => void;
  setAspectRatio: (aspectRatio: string) => void;
  setImageUrl: (imageUrl: string) => void;
  setImagePrompt: (imagePrompt: string | undefined) => void;
  addGeneratedImage: (image: { url: string; prompt: string }) => void;
  setGeneratedImages: (images: Array<{ url: string; prompt: string }>) => void;
  setSuccessTexts: (texts: SuccessTexts | undefined) => void;
  setFinalImageUrl: (imageUrl: string) => void;
  reset: () => void;
}

export const useFunnelStore = create<FunnelState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      url: '',
      summary: undefined,
      styles: undefined,
      imageUrl: undefined,
      imagePrompt: undefined,
      generatedImages: [],
      successTexts: undefined,
      finalImageUrl: undefined,

      setHasHydrated: (state) => set({ hasHydrated: state }),
      setUrl: (url) => set({ url }),
      setSummary: (summary) => set({ summary }),
      setStyles: (styles) => set({ styles }),
      setMessageType: (messageType) =>
        set((state) => ({
          styles: {
            ...(state.styles || {}),
            messageType,
          } as Styles,
        })),
      setVisualStyle: (visualStyle) =>
        set((state) => ({
          styles: {
            ...(state.styles || {}),
            visualStyle,
          } as Styles,
        })),
      setToneMood: (toneMood) =>
        set((state) => ({
          styles: {
            ...(state.styles || {}),
            toneMood,
          } as Styles,
        })),
      setModel: (model) =>
        set((state) => ({
          styles: {
            ...(state.styles || {}),
            model,
          } as Styles,
        })),
      setAspectRatio: (aspectRatio) =>
        set((state) => ({
          styles: {
            ...(state.styles || {}),
            aspectRatio,
          } as Styles,
        })),
      setImageUrl: (imageUrl) => set({ imageUrl }),
      setImagePrompt: (imagePrompt) => set({ imagePrompt }),
      addGeneratedImage: (image) =>
        set((state) => ({
          generatedImages: [...state.generatedImages, image],
        })),
      setGeneratedImages: (images) => set({ generatedImages: images }),
      setSuccessTexts: (successTexts) => set({ successTexts }),
      setFinalImageUrl: (finalImageUrl) => set({ finalImageUrl }),
      reset: () =>
        set({
          url: '',
          summary: undefined,
          styles: undefined,
          imageUrl: undefined,
          imagePrompt: undefined,
          generatedImages: [],
          successTexts: undefined,
          finalImageUrl: undefined,
        }),
    }),
    {
      name: 'hyp-funnel-storage', // DB name
      storage: createJSONStorage(() => storage), // IndexedDB 사용
      onRehydrateStorage: () => (state) => {
        // Hydration 완료 시 호출됨
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        // 저장할 상태만 선택
        url: state.url,
        summary: state.summary,
        styles: state.styles,
        imageUrl: state.imageUrl,
        imagePrompt: state.imagePrompt,
        generatedImages: state.generatedImages,
        successTexts: state.successTexts,
        // hasHydrated는 저장하지 않음 (항상 false로 시작)
      }),
    }
  )
);
