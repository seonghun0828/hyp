// import { Concept } from './store';

// export const concepts: Concept[] = [
//   {
//     id: 'ProblemSolving',
//     name: '문제해결형',
//     description:
//       '고객이 겪는 불편함이나 과제를 명확히 제시하고, 제품이 그것을 어떻게 해결하는지를 강조합니다. 실용적이고 논리적인 어조를 사용하며, 제품의 구체적 기능과 효용에 초점을 맞춥니다.',
//     tone: '실용적, 명료한, 솔루션 중심',
//     structure: '문제 제시 → 해결 제안 → 결과 강조',
//     template:
//       '[Problem] 당신은 ___ 때문에 불편함을 느낀 적 있나요?\n[Solution] 이제 ___이 그 문제를 해결합니다.\n[Benefit] 단 몇 분 만에 ___이 가능해집니다.',
//     example:
//       '매번 SNS 홍보 문구를 고민하시나요?\nHYP가 대신 만들어드립니다.\n이제 개발자는 개발에만 집중하세요.',
//     exampleImage: '/concepts/problem-solving.jpg',
//     promptTemplate:
//       "Create a problem-solving marketing copy using this structure: 1) Present the user's pain point with empathy, 2) Propose your product as the solution, 3) Emphasize the concrete benefits. Use practical, clear, solution-focused language.",
//     imageStyle: {
//       name: '프로페셔널 테크',
//       description:
//         '명확하고 신뢰감 있는 비즈니스/테크 스타일. 파란색과 흰색 중심의 깨끗한 시각 디자인.',
//       promptTemplate:
//         'Create a professional, clean tech-style marketing image with modern business aesthetics. Use blue and white tones, geometric composition, and subtle gradients to convey clarity and reliability.',
//     },
//   },
//   {
//     id: 'Empathy',
//     name: '공감형',
//     description:
//       "고객의 감정과 상황을 이해하고, '당신의 고민을 이해한다'는 메시지를 전달합니다. 따뜻하고 인간적인 어조로 신뢰와 친근감을 형성합니다.",
//     tone: '따뜻한, 공감 어린, 진정성 있는',
//     structure: '감정 공감 → 연결 → 희망적인 변화 제시',
//     template:
//       '[Empathy] 당신도 ___하고 싶은 순간이 있죠.\n[Connection] 우리도 그 마음을 잘 알아요.\n[Resolution] 그래서 ___을 만들었어요.',
//     example:
//       '당신의 아이디어가 더 많은 사람에게 닿길 바라죠.\n우리도 같은 마음이에요.\nHYP는 그 시작을 함께합니다.',
//     exampleImage: '/concepts/empathy.jpg',
//     promptTemplate:
//       "Create an empathetic marketing copy using this structure: 1) Show understanding of user's emotions, 2) Build connection by sharing similar feelings, 3) Present your product as the resolution. Use warm, genuine, emotionally resonant language.",
//     imageStyle: {
//       name: '라이프스타일 포토',
//       description:
//         '사람 중심의 현실적인 장면. 자연광, 따뜻한 색감, 일상적인 배경.',
//       promptTemplate:
//         'Create a realistic lifestyle photo-style image showing human connection and empathy. Use natural light, warm tones, and everyday environments to evoke trust and relatability.',
//     },
//   },
//   {
//     id: 'Insight',
//     name: '통찰형',
//     description:
//       '당연한 것을 새롭게 보게 만들어, 고객이 "이 브랜드는 깊이가 있다"고 느끼게 합니다. 즉각적 자극보다 사고의 여운으로 브랜드 신뢰와 철학적 매력을 쌓습니다.',
//     tone: '차분한, 사려 깊은, 진중한, 철학적인',
//     structure: '일상적 전제 → 새로운 관점 → 브랜드 철학 연결',
//     template:
//       '[Setup] 모두가 ___를 중요하게 생각하지만,\n[Twist] 우리는 ___가 진짜 본질이라고 믿습니다.\n[Philosophy] 그래서 ___을(를) 이렇게 만듭니다.',
//     example:
//       '"좋은 홍보는 자극이 아니라, 공감에서 시작됩니다. HYP는 제품의 철학이 더 멀리 닿도록 돕습니다."',
//     exampleImage: '/concepts/insight.jpg',
//     promptTemplate:
//       "Create an insight-driven marketing copy. Follow this structure: 1) Present a common assumption or trend, 2) Offer a reflective or philosophical twist, 3) Connect that insight to the product's philosophy or purpose. The tone should be calm, thoughtful, and sincere.",
//     imageStyle: {
//       name: '미니멀 철학 아트',
//       description:
//         '사색적이고 상징적인 미니멀 일러스트. 여백과 단순한 색조 사용.',
//       promptTemplate:
//         'Create a minimalist conceptual art-style marketing image that conveys insight and reflection. Use subtle colors, symbolic shapes, and negative space to create a calm and thoughtful atmosphere.',
//     },
//   },
//   {
//     id: 'Trust',
//     name: '신뢰형',
//     description:
//       '제품의 안정성, 전문성, 혹은 사회적 증거를 강조합니다. 수치, 인증, 후기 등을 활용해 객관적인 신뢰를 형성하며, 안정감 있는 어조를 유지합니다.',
//     tone: '객관적, 전문적, 신뢰감 있는',
//     structure: '증거 제시 → 안정성 강조 → 안심 유도',
//     template:
//       '[Proof] 이미 ___명이 사용 중입니다.\n[Authority] 전문가들이 인정한 ___.\n[Trust] 당신의 제품도 지금 시작하세요.',
//     example:
//       '이미 10,000개 이상의 스타트업이 HYP를 선택했습니다.\n당신의 제품도 더 많은 사람에게 닿을 시간입니다.',
//     exampleImage: '/concepts/trust.jpg',
//     promptTemplate:
//       'Create a trust-focused marketing copy using this structure: 1) Present social proof and numbers, 2) Highlight authority and expertise, 3) Encourage immediate action with confidence. Use objective, professional, trustworthy language with data and testimonials.',
//     imageStyle: {
//       name: '프리미엄 코퍼레이트',
//       description:
//         '고급스럽고 안정감 있는 기업 이미지. 짙은 네이비와 골드 포인트.',
//       promptTemplate:
//         'Create a premium corporate-style marketing image. Use deep navy and gold accents, elegant layout, and high-end aesthetics to express credibility, stability, and authority.',
//     },
//   },
//   {
//     id: 'Emotion',
//     name: '감성형',
//     description:
//       '고객의 감정에 직접 호소하며, 따뜻하거나 서정적인 표현을 사용합니다. 스토리텔링 구조를 활용해 제품이 일상에 주는 감정적 변화를 표현합니다.',
//     tone: '감성적, 서정적, 따뜻한',
//     structure: '감정 유발 → 경험 묘사 → 감정적 결말',
//     template:
//       '[Emotion] 당신의 제품이 전하고 싶은 마음은 무엇인가요?\n[Story] 그 이야기를 HYP가 세상에 전해드립니다.\n[Inspire] 누군가의 하루가 바뀔지도 몰라요.',
//     example:
//       '당신의 제품은 작은 아이디어에서 시작했죠.\nHYP가 그 진심을 세상에 전합니다.',
//     exampleImage: '/concepts/emotion.jpg',
//     promptTemplate:
//       'Create an emotional marketing copy using this structure: 1) Connect with the emotional core of the product, 2) Tell the story of how it makes a difference, 3) Inspire hope for positive change. Use warm, poetic expressions and storytelling.',
//     imageStyle: {
//       name: '소프트 감성 일러스트',
//       description: '따뜻한 파스텔톤과 부드러운 터치의 감성 일러스트.',
//       promptTemplate:
//         'Create a soft emotional illustration-style image using pastel colors, gentle lighting, and poetic atmosphere. Focus on warmth, sincerity, and emotional storytelling.',
//     },
//   },
//   {
//     id: 'Action',
//     name: '행동유도형',
//     description:
//       '주의를 끌고 즉각적인 행동(구매, 클릭, 시도 등)을 유도합니다. 명확한 혜택 제시와 강렬한 CTA(Call to Action)를 포함합니다.',
//     tone: '직설적, 강렬한, 동기부여적',
//     structure: '문제 인식 → 기회 제시 → 행동 촉구',
//     template:
//       '[Attention] 한 줄의 문구로 시선을 끄세요.\n[Interest] AI가 당신의 제품을 돋보이게 만듭니다.\n[Action] 지금 바로 시작하세요 — 무료로.',
//     example:
//       '한 문장으로 더 많은 사람의 시선을 끌고 싶다면,\n지금 바로 HYP에서 시작하세요.',
//     exampleImage: '/concepts/action.jpg',
//     promptTemplate:
//       'Create an action-driven marketing copy using this structure: 1) Grab attention with a compelling hook, 2) Build interest by highlighting AI benefits, 3) Drive immediate action with a strong CTA. Use direct, powerful, motivational language.',
//     imageStyle: {
//       name: '네온 에너지',
//       description:
//         '강렬한 네온 라이트와 다이내믹한 구도의 에너지 넘치는 스타일.',
//       promptTemplate:
//         'Create a high-energy neon-style marketing image. Use dynamic composition, glowing lights, and bold color contrast (blue, magenta, cyan). Express excitement, motion, and innovation.',
//     },
//   },
// ];

// export const getConceptById = (id: string): Concept | undefined => {
//   return concepts.find((concept) => concept.id === id);
// };
