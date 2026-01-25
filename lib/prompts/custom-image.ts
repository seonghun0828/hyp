import { ProductSummary } from '../store';
import { ProductCategory } from '../categories/types';

/**
 * 커스텀 프롬프트와 제품 컨텍스트를 결합하여 이미지 생성 프롬프트를 생성
 * 사용자의 창의적인 요청을 반영하면서도 제품의 핵심 가치를 유지
 */
export const getCustomImagePrompt = (
  customPrompt: string,
  summary: ProductSummary,
  aspectRatio?: string,
  category?: ProductCategory
): string => {
  // 비율에 따른 레이아웃 가이드
  const aspectRatioGuide =
    aspectRatio === '1:1'
      ? 'Square composition (1:1 aspect ratio). Balanced and centered layout.'
      : aspectRatio === '4:5'
        ? 'Vertical portrait composition (4:5 aspect ratio). Ideal for mobile-first social media.'
        : aspectRatio === '16:9'
          ? 'Horizontal landscape composition (16:9 aspect ratio). Cinematic and wide format.'
          : 'Flexible composition.';

  return `[User's Creative Direction]
${customPrompt}

[Product Context]
This is a promotional image for: ${summary.title || 'a product/service'}
Core Value: ${summary.core_value}
Target Customer: ${summary.target_customer}
Key Benefit: ${summary.customer_benefit}
${summary.emotional_keyword ? `Emotional Tone: ${summary.emotional_keyword}` : ''}
${category ? `Category: ${category.industry} - ${category.form}` : ''}

[Image Requirements]
${aspectRatioGuide}

Modify the provided image to:
1. Apply the user's creative direction described above
2. Maintain the original composition and aspect ratio
3. Keep the same visual structure while applying requested changes
4. Preserve the product's core value and appeal to the target customer
5. Ensure natural transitions and avoid artifacts
6. Create a cohesive result that looks intentional, not pasted
7. Maintain realistic, clear, and visually appealing quality

IMPORTANT: This is an image MODIFICATION, not generation from scratch.
Preserve the existing image structure and only apply the requested changes.

[Device Screen Display Rules]
When showing devices (smartphones, tablets, laptops, monitors):
- If the front face of the device is visible, screen content can be shown
- If only the back of the device is visible, NO screen content should appear (only device back cover, camera module, logo, etc.)
- If the device is at an angle where screen is partially visible, only show screen content on visible portion
- Never show screen content on the back of a device

Focus on creating a visually compelling image that balances the user's creative vision with effective product marketing.
`;
};
