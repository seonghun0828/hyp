export interface StyleOption {
  id: string;
  aiPrompt: string; // AI 이미지 생성용 영어 프롬프트
  src: string;
}

export interface StyleCategory {
  id: string;
  options: StyleOption[];
}

// 메시지 타입
export const messageTypes: StyleOption[] = [
  {
    id: 'problem-solving',
    aiPrompt:
      'Show a positive, improved outcome enabled by the product, with subtle visual cues that imply the original problem without explicitly showing it.',
    src: '/images/style-options/message-type-problem-solving.png',
  },
  {
    id: 'benefit',
    aiPrompt:
      'Clearly highlight the key benefits the user gains from using the product.',
    src: '/images/style-options/message-type-benefit.png',
  },
  {
    id: 'proof',
    aiPrompt:
      'Show visual evidence such as metrics, results, or indicators that build trust.',
    src: '/images/style-options/message-type-proof.png',
  },
  {
    id: 'comparison',
    aiPrompt:
      'Present a clear visual comparison highlighting the difference between two states or options.',
    src: '/images/style-options/message-type-comparison.png',
  },
  {
    id: 'story',
    aiPrompt:
      'Illustrate a simple sequence showing how the situation changes through product usage.',
    src: '/images/style-options/message-type-storytelling.png',
  },
];

// 비주얼 스타일
export const visualStyles: StyleOption[] = [
  {
    id: 'photo-realistic',
    aiPrompt:
      'Photo-realistic style, shot on 35mm lens, hyper-realistic textures, natural cinematic lighting, deep focus with sharp details, 8k resolution, authentic photography aesthetic.',
    src: '/images/style-options/visual-style-photorealistic.png',
  },
  {
    id: 'line-drawing',
    aiPrompt:
      'Minimalist professional line art, solid black outlines on a pure white background, consistent medium stroke weight, clean vector style, no shading, no colors, all lines connected and closed.',
    src: '/images/style-options/visual-style-line-drawing.png',
  },
  {
    id: 'cartoon',
    aiPrompt:
      'Vibrant 2D cartoon style, bold thick outlines, flat cel-shading, playful proportions, 2D animation background aesthetic, bright and cheerful colors, high-quality character and environment design.',
    src: '/images/style-options/visual-style-cartoon.png',
  },
  {
    id: 'illustration',
    aiPrompt:
      'Artistic painterly illustration style, visible organic brushstrokes, rich oil paint textures, natural color blending, emotive and hand-drawn feel, impressionistic fine art aesthetic.',
    src: '/images/style-options/visual-style-illustration.png',
  },
];

// 모델 구성
export const models: StyleOption[] = [
  {
    id: 'product-ui-only',
    aiPrompt:
      'Show only the product or service interface. No people, no characters, no hands.',
    src: '/images/style-options/model-composition-product-only.png',
  },
  {
    id: 'hands-only',
    aiPrompt:
      'Show hands interacting with the product. Do not show faces or full bodies.',
    src: '/images/style-options/model-composition-hands-only.png',
  },
  {
    id: 'person',
    aiPrompt: 'Include a human person interacting with the product or service.',
    src: '/images/style-options/model-composition-person.png',
  },
  {
    id: 'character-mascot',
    aiPrompt: 'Include a character or mascot instead of a real human.',
    src: '/images/style-options/model-composition-character.png',
  },
];

// 스타일 카테고리 목록
export const styleCategories: StyleCategory[] = [
  {
    id: 'messages',
    options: messageTypes,
  },
  {
    id: 'visuals',
    options: visualStyles,
  },
  {
    id: 'models',
    options: models,
  },
];

// 유틸 함수
export const getStyleCategoryById = (id: string): StyleCategory | undefined => {
  return styleCategories.find((category) => category.id === id);
};

export const getStyleOptionById = (
  categoryId: string,
  optionId: string
): StyleOption | undefined => {
  const category = getStyleCategoryById(categoryId);
  return category?.options.find((option) => option.id === optionId);
};

// 스타일 ID로 AI 프롬프트 찾기
export const getStylePrompt = (categoryId: string, optionId: string): string => {
  const option = getStyleOptionById(categoryId, optionId);
  return option?.aiPrompt || '';
};
