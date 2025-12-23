export interface StyleOption {
  id: string;
  label: string;
  description: string;
  src: string;
}

export interface StyleCategory {
  id: string;
  name: string;
  options: StyleOption[];
}

export interface StyleOption {
  id: string;
  label: string; // 화면용 한국어
  description: string; // 화면용 한국어
  aiPrompt?: string; // AI 이미지 생성용 영어 설명
  src: string;
}

// 메시지 타입
export const messageTypes: StyleOption[] = [
  {
    id: 'problem-solving',
    label: '문제 해결',
    description: '사용자가 겪는 불편함을 강조해 해결책 이미지',
    aiPrompt:
      'Show a positive, improved outcome enabled by the product, with subtle visual cues that imply the original problem without explicitly showing it.',
    src: '/images/style-options/메시지 타입 - 문제 해결.png',
  },
  {
    id: 'benefit',
    label: '혜택',
    description: '이 제품을 쓰면 얻는 이점이 한눈에 보이는 이미지',
    aiPrompt:
      'Clearly highlight the key benefits the user gains from using the product.',
    src: '/images/style-options/메시지 타입 - 이점과 혜택.png',
  },
  {
    id: 'proof',
    label: '증거',
    description: '신뢰를 주는 결과나 데이터가 뒷받침 되는 이미지',
    aiPrompt:
      'Show visual evidence such as metrics, results, or indicators that build trust.',
    src: '/images/style-options/메시지 타입 - 증거.png',
  },
  {
    id: 'comparison',
    label: '비교',
    description: '기존 vs 지금, 또는 A vs B 차이가 명확한 이미지',
    aiPrompt:
      'Present a clear visual comparison highlighting the difference between two states or options.',
    src: '/images/style-options/메시지 타입 - 비교.png',
  },
  {
    id: 'story',
    label: '스토리',
    description: '상황 변화가 흐름처럼 느껴지는 이미지',
    aiPrompt:
      'Illustrate a simple sequence showing how the situation changes through product usage.',
    src: '/images/style-options/메시지 타입 - 스토리텔링.png',
  },
];

export const visualStyles: StyleOption[] = [
  {
    id: 'photo-realistic',
    label: '사진 같은',
    description: '실제 사진처럼 보이는 현실적인 이미지',
    aiPrompt:
      'Photo-realistic style, shot on 35mm lens, hyper-realistic textures, natural cinematic lighting, deep focus with sharp details, 8k resolution, authentic photography aesthetic.',
    src: '/images/style-options/visual styles - photo realistic.png',
  },

  {
    id: 'line-drawing',
    label: '라인 드로잉',
    description: '선 위주의 심플하고 미니멀한 표현',
    aiPrompt:
      'Minimalist professional line art, solid black outlines on a pure white background, consistent medium stroke weight, clean vector style, no shading, no colors, all lines connected and closed.',
    src: '/images/style-options/visual styles - line drawing.png',
  },
  {
    id: 'cartoon',
    label: '만화 스타일',
    description: '만화처럼 단순화되고 개성 있는 표현',
    aiPrompt:
      'Vibrant 2D cartoon style, bold thick outlines, flat cel-shading, playful proportions, 2D animation background aesthetic, bright and cheerful colors, high-quality character and environment design.',
    src: '/images/style-options/visual styles - cartoon.png',
  },
  {
    id: 'illustration',
    label: '일러스트',
    description: '사람이 그린 듯한 부드러운 일러스트 스타일',
    aiPrompt:
      'Artistic painterly illustration style, visible organic brushstrokes, rich oil paint textures, natural color blending, emotive and hand-drawn feel, impressionistic fine art aesthetic.',
    src: '/images/style-options/visual styles - illustration.png',
  },
];

// 표현 방식
// export const expressionStyles: StyleOption[] = [
//   {
//     id: 'product-focused',
//     label: '제품 중심',
//     description: '제품(또는 UI 화면)이 중심 포인트인 이미지',
//     aiPrompt: 'Center the image on the product or its UI as the focal point.',
//     src: '/images/style-options/표현 방식 - 제품 중심.png',
//   },
//   {
//     id: 'usage-scene',
//     label: '사용 장면',
//     description: '실제 사용하는 상황을 보여주는 이미지',
//     aiPrompt: 'Show the product being used in a realistic context.',
//     src: '/images/style-options/표현 방식 - 사용 장면.png',
//   },
//   {
//     id: 'screen-demo',
//     label: '화면 시연',
//     description: '앱·웹 화면이 어떻게 쓰이는지 보여주는 시연 이미지',
//     aiPrompt: 'Demonstrate the app or website screen in use.',
//     src: '/images/style-options/표현 방식 - 화면 시연.png',
//   },
//   {
//     id: 'illustration',
//     label: '그림 스타일',
//     description: '그림/일러스트 기반의 부드럽고 창의적인 시각 표현',
//     aiPrompt:
//       'Use illustration or artistic style for soft and creative visuals.',
//     src: '/images/style-options/표현 방식 - 그림 스타일.png',
//   },
// ];

// 톤 & 무드
export const toneMoods: StyleOption[] = [
  {
    id: 'warm-comfortable',
    label: '따뜻함·편안함',
    description: '부드럽고 안정적인 분위기의 이미지',
    aiPrompt: 'Create a warm, cozy, and comforting atmosphere.',
    src: '/images/style-options/톤&무드 - 편안하고 따뜻한.png',
  },
  {
    id: 'trust-serious',
    label: '신뢰·진지함',
    description: '견고하고 믿음직한 느낌을 주는 이미지',
    aiPrompt: 'Convey reliability, seriousness, and professional trust.',
    src: '/images/style-options/톤&무드 - 신뢰감 있고 진지한.png',
  },
  {
    id: 'humor-light',
    label: '유머·가벼움',
    description: '재치 있고 가볍게 다가오는 이미지',
    aiPrompt: 'Add a light-hearted, witty, and playful mood.',
    src: '/images/style-options/톤&무드 - 유머러스하고 가벼운.png',
  },
  {
    id: 'premium-sophisticated',
    label: '고급·세련됨',
    description: '감각적이고 고급스러운 스타일의 이미지',
    aiPrompt: 'Evoke luxury, elegance, and refined sophistication.',
    src: '/images/style-options/톤&무드 - 고급지고 세련된.png',
  },
  {
    id: 'energetic-vibrant',
    label: '활기·에너지',
    description: '역동적이고 생기 넘치는 이미지',
    aiPrompt: 'Infuse energy, liveliness, and vibrancy into the scene.',
    src: '/images/style-options/톤&무드 - 활기차고 에너지.png',
  },
];

export const models: StyleOption[] = [
  {
    id: 'product-ui-only',
    label: '제품 / UI만',
    description: '사람 없이 제품 또는 서비스 화면만 보여주는 구성',
    aiPrompt:
      'Show only the product or service interface. No people, no characters, no hands.',
    src: '/images/style-options/모델 구성 - 제품만.png',
  },
  {
    id: 'hands-only',
    label: '손만',
    description: '사람의 손만 등장해 제품을 사용하는 장면',
    aiPrompt:
      'Show hands interacting with the product. Do not show faces or full bodies.',
    src: '/images/style-options/모델 구성 - 손만.png',
  },
  {
    id: 'person',
    label: '사람',
    description: '일반 사용자 또는 모델이 등장하는 장면',
    aiPrompt: 'Include a human person interacting with the product or service.',
    src: '/images/style-options/모델 구성 - 일반인.png',
  },
  {
    id: 'character-mascot',
    label: '캐릭터 / 마스코트',
    description: '사람 대신 캐릭터나 마스코트가 등장하는 구성',
    aiPrompt: 'Include a character or mascot instead of a real human.',
    src: '/images/style-options/모델 구성 - 캐릭터.png',
  },
];

// 모델 구성
// export const modelCompositions: StyleOption[] = [
//   {
//     id: 'product-only',
//     label: '제품만(UI 포함)',
//     description: '사람 없이 제품 또는 화면 UI만 보여주는 구성',
//     aiPrompt:
//       'Show only the product or interface. Do not include any people, hands, or human parts. Focus solely on the product itself and its interface.',
//     src: '/images/style-options/모델 구성 - 제품만.png',
//   },
//   {
//     id: 'hands-only',
//     label: '손만',
//     description: '사람 전체 대신 손만 등장하는 사용 장면',
//     aiPrompt: 'Depict only hands interacting with the product.',
//     src: '/images/style-options/모델 구성 - 손만.png',
//   },
//   {
//     id: 'general-model',
//     label: '일반 모델',
//     description: '자연스러운 일반인 사용자가 등장하는 이미지',
//     aiPrompt: 'Include natural, everyday users interacting with the product.',
//     src: '/images/style-options/모델 구성 - 일반인.png',
//   },
//   {
//     id: 'professional-model',
//     label: '전문 모델',
//     description: '전문직 혹은 특정 역할을 가진 모델이 등장하는 이미지',
//     aiPrompt: 'Show professionals or role-specific users using the product.',
//     src: '/images/style-options/모델 구성 - 전문 모델.png',
//   },
//   {
//     id: 'character',
//     label: '캐릭터',
//     description: '일러스트 또는 캐릭터가 등장하는 이미지',
//     aiPrompt: 'Feature illustrated characters or stylized figures.',
//     src: '/images/style-options/모델 구성 - 캐릭터.png',
//   },
// ];

// 스타일 카테고리 목록
export const styleCategories: StyleCategory[] = [
  {
    id: 'messages',
    name: '메시지 타입',
    options: messageTypes,
  },
  {
    id: 'visuals',
    name: '비주얼 표현 방식',
    options: visualStyles,
  },
  {
    id: 'tones-moods',
    name: '톤 & 무드',
    options: toneMoods,
  },
  {
    id: 'models',
    name: '모델 구성',
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

// 스타일 ID로 라벨 찾기
export const getStyleLabel = (categoryId: string, optionId: string): string => {
  const option = getStyleOptionById(categoryId, optionId);
  return option?.id || optionId;
};
