import { Concept } from './store';

export const concepts: Concept[] = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: '깔끔하고 모던한 디자인으로 제품의 핵심을 강조합니다.',
    exampleImage: '/concepts/modern-minimal.jpg',
    promptTemplate:
      'Create a modern, minimal marketing copy that emphasizes the core value of the product. Use clean, professional language with a focus on simplicity and effectiveness.',
  },
  {
    id: 'trendy-bold',
    name: 'Trendy Bold',
    description: '트렌디하고 대담한 스타일로 주목도를 높입니다.',
    exampleImage: '/concepts/trendy-bold.jpg',
    promptTemplate:
      'Create a trendy, bold marketing copy that grabs attention and creates excitement. Use dynamic, energetic language with trendy expressions and strong calls to action.',
  },
  {
    id: 'emotional-soft',
    name: 'Emotional Soft',
    description: '감성적이고 부드러운 톤으로 사용자의 마음을 움직입니다.',
    exampleImage: '/concepts/emotional-soft.jpg',
    promptTemplate:
      'Create an emotional, soft marketing copy that connects with users on a personal level. Use warm, empathetic language that tells a story and creates emotional resonance.',
  },
  {
    id: 'technical-pro',
    name: 'Technical Pro',
    description: '전문적이고 기술적인 접근으로 신뢰성을 강조합니다.',
    exampleImage: '/concepts/technical-pro.jpg',
    promptTemplate:
      'Create a technical, professional marketing copy that emphasizes expertise and reliability. Use precise, technical language with data-driven benefits and professional credibility.',
  },
];

export const getConceptById = (id: string): Concept | undefined => {
  return concepts.find((concept) => concept.id === id);
};
