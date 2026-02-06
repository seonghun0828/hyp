import { Styles } from '../store';
import { visualStyles, messageTypes, models } from '../styles';
import { ProductCategory } from '../categories/types';
import {
  INDUSTRY_TEMPLATES,
  FORM_TEMPLATES,
  PURPOSE_TEMPLATES,
  IndustryType,
  FormType,
  PurposeType,
} from '../categories/templates';

/**
 * 배열에서 옵션을 선택하는 헬퍼 함수
 * index가 제공되면 해당 인덱스(modulo)의 아이템을 반환 (순차 선택)
 * randomSeed와 stride(7)를 적용하여 다양성 확보
 */
const selectOption = (
  options: string[],
  index?: number,
  randomSeed?: number
) => {
  if (typeof index === 'number') {
    // seed가 없으면 0
    const start = randomSeed || 0;
    // stride는 적당히 큰 소수 (예: 7) 사용
    // 배열 길이보다 크거나 서로소이면 좋음. 7 정도면 대부분의 짧은 배열에서 잘 섞임
    const stride = 7;

    const finalIndex = (start + index * stride) % options.length;
    return options[finalIndex];
  }
  return options[Math.floor(Math.random() * options.length)];
};

/**
 * Extract visual cues from industry templates
 */
const getIndustryVisualCues = (industry?: string): string => {
  if (!industry) return '';
  const template = INDUSTRY_TEMPLATES[industry as IndustryType];
  if (!template) return '';

  // Extract only the "Visual cues:" portion
  const cuesMatch = template.match(
    /Visual cues: (.+?)(?:\. (?:Emphasize|Use|Show|Convey|Capture)|$)/
  );
  return cuesMatch ? cuesMatch[1] : '';
};

/**
 * Extract visual guidance from form templates
 */
const getFormGuidance = (form?: string): string => {
  if (!form) return '';
  const template = FORM_TEMPLATES[form as FormType];
  if (!template) return '';

  // Extract only the "Visual cue:" portion
  const cueMatch = template.match(/Visual cue: (.+?)$/);
  return cueMatch ? cueMatch[1] : '';
};

/**
 * Extract visual guidance from purpose templates
 */
const getPurposeGuidance = (purpose?: string): string => {
  if (!purpose) return '';
  const template = PURPOSE_TEMPLATES[purpose as PurposeType];
  if (!template) return '';

  // Extract only the "Visual cue:" portion
  const cueMatch = template.match(
    /Visual cue: (.+?)(?:\. (?:Prioritize|Convey|Emphasize)|$)/
  );
  return cueMatch ? cueMatch[1] : '';
};

/**
 * Generate critical constraints that must appear early in the prompt
 */
const getCriticalConstraints = (): string => {
  return `[CRITICAL RULES - MUST FOLLOW:]

1. TEXT PROHIBITION (ABSOLUTE):
   - ZERO readable text anywhere in the image
   - NO words, NO letters, NO numbers that can be read
   - NO brand names, NO logos, NO product labels
   - NO watermarks, NO copyright symbols, NO signatures
   - If UI elements are needed, show them as abstract horizontal lines or simple geometric shapes
   - Replace all text with abstract visual patterns

2. DEVICE SCREEN RULES (ABSOLUTE - READ THIS CAREFULLY):

   UNDERSTAND DEVICE PHYSICS:
   - Every device (phone, tablet, laptop) has TWO surfaces: FRONT surface (has screen) and BACK surface (NO screen)
   - The screen is a physical display panel on the FRONT surface ONLY
   - The BACK surface has: camera module, logo, material texture - NEVER a screen
   - It is PHYSICALLY IMPOSSIBLE for a screen to appear on the back surface

   RULES:
   - IF you are looking at the BACK of a device (camera visible, logo visible, back material): SHOW NO SCREEN AT ALL. Show only camera, logo, device back material.
   - IF you are looking at the FRONT of a device (screen facing viewer): You may show abstract UI (lines, shapes) - NO readable text
   - IF device is at an angle: Show screen ONLY on the surface that has the screen (front), NEVER on the back

   COMMON MISTAKE TO AVOID:
   - DO NOT show glowing screen content on the camera side of a phone
   - DO NOT show UI elements on the back cover of a device
   - DO NOT make the entire back of a device glow like a screen
   - The back is opaque material (metal, glass, plastic) - NOT a display

   When in doubt: If you can see the camera module, you CANNOT see the screen.`;
};

/**
 * Generate negative prompt section to prevent common AI image generation issues
 */
const getNegativePrompt = (): string => {
  return `[Additional Exclusions:]

Device Physics (CRITICAL - REPEAT):
- NEVER show screen content on the back of a device
- NEVER show glowing displays on camera side of phones
- NEVER show UI on the back cover of tablets/laptops
- Device backs are opaque - camera, logo, material ONLY
- If camera module is visible, screen is NOT visible

Anatomical Accuracy (when humans present):
- Humans have exactly 5 fingers per hand, no extra or missing fingers
- No distorted hands, fused fingers, or impossible poses
- No asymmetrical faces or anatomically impossible body proportions

Lighting & Technical:
- No multiple conflicting light sources or shadows
- No excessive lens flare or over-processed HDR effects
- No artificial bokeh or unnatural vignetting

Color & Processing:
- No oversaturated neon colors or garish combinations
- No unnatural skin tones (no orange, grey, or pink-shifted)
- No heavy filters or inconsistent color temperature

Composition:
- No cluttered backgrounds with competing elements
- No random people looking at camera
- No multiple competing products or conflicting brands

Stock Photo Clichés:
- No forced enthusiasm, pointing at nothing, or unnatural interactions
- No generic office workers high-fiving
- No unnecessary dutch angles

Technical Quality:
- No compression artifacts, pixelation, or AI artifacts
- No cropped faces, hands, or critical elements at edges
- Product must be in sharp focus unless intentionally backgrounded`;
};

/**
 * Generate aspect ratio composition guidance
 */
const getAspectRatioGuidance = (aspectRatio: string): string => {
  const guidance: Record<string, string> = {
    '1:1': `Square composition. Center the primary subject with balanced visual weight on all sides. Use symmetrical framing or position the focal point in the center third.`,

    '4:5': `Vertical portrait composition. Position the main subject in the upper 70% of the frame at eye level or above. Reserve the top 15% and bottom 15% with a simple, uncluttered background (gradient or soft focus).`,

    '16:9': `Horizontal cinematic composition. Position the main subject using the rule of thirds - in the left third or right third, NOT centered. Create visual depth with distinct foreground, midground, and background layers. Reserve approximately one-third of the horizontal space (left OR right side) with lower visual complexity and good contrast.`,
  };

  return guidance[aspectRatio] || '';
};

/**
 * Generate lighting direction based on message type and visual style
 */
const getLightingGuidance = (
  messageType: string,
  visualStyle: string
): string => {
  // Only provide lighting guidance for photo-realistic style
  if (visualStyle !== 'photo-realistic') return '';

  const lightingByMessage: Record<string, string> = {
    'problem-solving': `Lighting: Bright, optimistic illumination. Soft diffused light with minimal shadows suggesting clarity and resolution. Clean, even lighting that eliminates tension. Color temperature around 5000K (neutral daylight) conveying openness and problem-solved state.`,

    comparison: `Lighting: Consistent base lighting across both sides for fair comparison. LEFT (before) side: Slightly cooler color temperature (4500K), flatter lighting. RIGHT (after) side: Warmer tone (5500K), subtle rim light adding dimension and appeal. Lighting contrast supports the narrative without being heavy-handed.`,

    benefit: `Lighting: Hero lighting setup. Strong directional key light from 45-degree angle creating dimension and premium feel. Subtle rim light separating subject from background. Fill light controlled to maintain some shadow depth. Emphasize the product with intentional light direction drawing the eye.`,

    story: `Lighting: Consistent lighting across all panels maintaining visual continuity. Natural, documentary-style illumination that feels authentic rather than staged. Lighting should support the narrative progression without calling attention to itself. Avoid dramatic lighting changes between panels unless narrative requires it.`,
  };

  return lightingByMessage[messageType] || '';
};

/**
 * Context(Category)에 따라 Model Prompt를 동적으로 생성하는 함수
 */
const getDynamicModelPrompt = (
  modelId: string,
  visualId: string,
  categoryForm?: string,
  categoryIndustry?: string,
  variationIndex?: number,
  randomSeed?: number
): string => {
  // 기본값 (styles.ts에 정의된 값 사용을 위한 fallback)
  const basePrompts: Record<string, string> = {
    'product-ui-only':
      models.find((m) => m.id === 'product-ui-only')?.aiPrompt ||
      'Show only the product or service interface. No people, no characters, no hands.',
    'hands-only':
      models.find((m) => m.id === 'hands-only')?.aiPrompt ||
      'Show hands interacting with the product. Do not show faces or full bodies.',
    person:
      models.find((m) => m.id === 'person')?.aiPrompt ||
      'Include a human person interacting with the product or service.',
    'character-mascot':
      models.find((m) => m.id === 'character-mascot')?.aiPrompt ||
      'Include a character or mascot instead of a real human.',
  };

  const defaultPrompt = basePrompts[modelId] || '';

  // Visual Style에 따라 "Photography" 같은 용어를 중화시킴
  const isNonPhotorealistic = [
    'cartoon',
    'illustration',
    'line-drawing',
  ].includes(visualId);
  const shotTerm = isNonPhotorealistic ? 'depiction' : 'shot';
  const photoTerm = isNonPhotorealistic ? 'illustration' : 'photography';

  if (!categoryForm) return defaultPrompt;

  switch (modelId) {
    case 'product-ui-only':
      if (['app', 'web_service', 'digital_product'].includes(categoryForm)) {
        return `High-quality digital interface mockup. A sleek, bezel-less modern device (smartphone or laptop) showing FRONT VIEW with screen display. Glowing UI elements, clean digital aesthetic. CRITICAL: If any part of device back is visible (camera module), that surface must show NO screen - only device back material. Screen exists on front surface only. No hands, no people. Focus entirely on the digital content.`;
      }
      if (categoryForm === 'physical_product') {
        return `Professional product ${photoTerm}. Studio lighting, sharp focus on the product texture and details. Minimalist background to highlight the object. No people.`;
      }
      if (
        categoryForm === 'offline_service' ||
        categoryIndustry === 'travel_leisure'
      ) {
        return `Atmospheric interior or location ${shotTerm}. Focus on the space, architecture, and ambiance. Empty of people to emphasize the setting itself.`;
      }
      return `High-quality product ${shotTerm} or interface display, focusing solely on the object. No people.`;

    case 'hands-only':
      if (['app', 'web_service', 'digital_product'].includes(categoryForm)) {
        return `POV ${shotTerm}. Hands holding a smartphone or typing on a keyboard. CRITICAL: Screen visible ONLY when front face of device faces viewer. If showing back of device (camera side visible), show ONLY back cover, camera module, logo - NEVER show screen content on back. Device physics: screen exists on front surface only. Technology-focused context. Clean, modern manicure or natural hands.`;
      }
      if (categoryForm === 'physical_product') {
        return `Close-up of hands holding or touching the product. Emphasizing tactile experience and material quality. Natural lighting. Hands are interacting naturally with the object.`;
      }
      return `Close-up of hands interacting with the subject. No faces visible. Focus on the action of using.`;

    case 'person':
      if (categoryIndustry === 'fashion_beauty') {
        return `A natural lifestyle portrait. A person using or wearing the product in a daily setting. Soft lighting, authentic expression. Beauty-focused but natural, not an exaggerated runway look.`;
      }
      if (['app', 'web_service', 'digital_product'].includes(categoryForm)) {
        return `Lifestyle ${shotTerm} of a user engaging with a device. Happy, focused expression while looking at the screen. CRITICAL: Screen content visible ONLY when device front faces viewer. If back of device visible (camera module visible), show ONLY back cover, camera, logo - NEVER screen on back. Device has screen on front surface only, back is opaque material. Modern environment. The person is clearly enjoying the digital experience.`;
      }
      if (
        [
          'business_productivity',
          'finance_real_estate_law',
          'education_self_development',
        ].includes(categoryIndustry || '')
      ) {
        return `Professional setting. A person working, consulting, or studying in a modern environment. Smart casual or business attire. Trustworthy and confident look.`;
      }
      return `A natural lifestyle scene featuring a person using the product/service. Authentic emotions and context. The person is the protagonist of the scene.`;

    case 'character-mascot':
      const mascotVariations = [
        // 로봇/기계형 캐릭터
        'A friendly robot character with expressive LED eyes and rounded, approachable design. Smooth metallic surfaces with matte finish, subtle panel lines. Soft ambient rim lighting highlights the metallic texture. Modern tech aesthetic with clean geometric forms. Dynamic pose engaging directly with the viewer, friendly wave or welcoming gesture. Cool blue and silver color palette with warm accent lights.',
        'A mechanical mascot with anthropomorphic features and gear-inspired details. Brushed metal texture with visible joints and hinges. Studio lighting with soft shadows emphasizing three-dimensional form. Tech-inspired design with human-like expressions through digital display face or animated features. Confident standing pose with open, friendly body language. Metallic tones with colorful LED accents.',

        // 동물 캐릭터 (다양한 동물)
        'A cute bear mascot with soft fur texture and warm honey-brown color. Large, friendly eyes with subtle highlights. Gentle studio lighting with soft shadows creating depth. Rounded, huggable silhouette with visible fur detail. Sitting or waving pose with approachable body language. Warm earth tone palette with rosy cheeks. Cozy and trustworthy personality.',
        'A playful cat character with sleek fur texture and expressive large eyes. Whiskers detailed, ears perked up attentively. Bright, even lighting emphasizing the smooth coat. Agile, dynamic pose mid-stretch or playful pounce. Curious and energetic personality. Vibrant color options (orange tabby, grey, calico). Clean, modern cartoon styling.',
        'A cheerful dog mascot with fluffy coat texture and happy expression. Bright, loyal eyes and visible tongue in friendly pant. Natural daylight-style lighting with soft highlights on the fur. Sitting or standing with tail wagging motion implied. Approachable and trustworthy appearance. Golden retriever or corgi-inspired features. Warm, inviting color palette.',
        'A wise owl character with detailed feather texture and intelligent gaze. Large, knowing eyes with fine detail in the iris. Soft moonlight-inspired lighting creating gentle shadows. Perched confidently on a minimal branch or geometric stand. Professional yet friendly demeanor. Rich browns, greys, and cream tones. Sophisticated and knowledgeable personality.',
        'A friendly rabbit mascot with soft, fluffy fur texture and alert ears. Bright, curious eyes with gentle expression. Clean studio lighting with subtle bounce light. Energetic standing or hopping pose with visible motion. Playful and approachable design. White, grey, or soft pastel color options. Cottony texture emphasizing softness.',
        'A cute penguin character with smooth, glossy texture simulating feathers. Round body shape with distinctive black and white pattern. Cool-toned lighting with subtle blue ambient glow. Charming waddle pose or wings spread in greeting. Friendly and memorable design. Classic penguin coloring with optional colorful accessories. Clean, polished finish.',

        // 추상/인간형 캐릭터
        'An abstract geometric character composed of simple shapes (spheres, cylinders, rounded cubes). Matte or semi-gloss surface with subtle gradient shading. Balanced three-point lighting creating clear form definition. Expressive features suggested through minimal elements (dots for eyes, simple curve for smile). Dynamic tilted or bouncing pose suggesting movement and energy. Vibrant single-color or complementary two-tone palette. Modern, minimalist design with personality.',
        'A stylized humanoid character with exaggerated proportions (large head, simplified body). Smooth, stylized skin texture with cel-shaded appearance. Bright, evenly distributed lighting with minimal shadows. Friendly and approachable design with oversized expressive eyes. Welcoming open-armed pose or enthusiastic gesture. Warm skin tones or fantasy colors (blue, green, purple). Cartoony and accessible aesthetic.',
      ];
      return selectOption(mascotVariations, variationIndex, randomSeed);

    default:
      return defaultPrompt;
  }
};

/**
 * Context(Category)와 Randomness에 따라 Visual Style Prompt를 동적으로 생성하는 함수
 */
const getDynamicVisualPrompt = (
  visualId: string,
  categoryIndustry?: string,
  variationIndex?: number,
  randomSeed?: number
): string => {
  // 기본값 (styles.ts에 정의된 값 사용을 위한 fallback)
  const basePrompts: Record<string, string> = {
    'photo-realistic':
      visualStyles.find((v) => v.id === 'photo-realistic')?.aiPrompt || '',
    'line-drawing':
      visualStyles.find((v) => v.id === 'line-drawing')?.aiPrompt || '',
    cartoon: visualStyles.find((v) => v.id === 'cartoon')?.aiPrompt || '',
    illustration:
      visualStyles.find((v) => v.id === 'illustration')?.aiPrompt || '',
  };

  const defaultPrompt = basePrompts[visualId] || '';

  switch (visualId) {
    case 'cartoon':
      const cartoonVariations = [
        // 3D Styles
        '3D Pixar/Disney-style animation. Soft lighting, rounded shapes, expressive characters, subsurface scattering, warm and charming atmosphere.',
        'Claymation Style (Aardman style). Stop-motion aesthetic, visible fingerprints, plasticine texture, quirky and handmade feel.',
        'Low Poly 3D Art. Geometric shapes, faceted surfaces, vibrant flat colors, modern digital art style.',
        'Stylized PBR 3D (Overwatch/Fortnite style). Hand-painted textures, bold silhouette, dynamic lighting, vibrant color palette.',

        // 2D Styles
        'Studio Ghibli Style. Hand-painted watercolor backgrounds, detailed nature, soft character lines, nostalgic and emotional atmosphere.',
        'Classic Japanese Anime (90s style). Cel-shading, distinct highlights, dramatic angles, vibrant colors.',
        'American Retro Cartoon (Rubber hose style). 1930s vintage animation, black and white or muted colors, rhythmic and bouncy character design.',
        'Modern Webtoon Style. Clean digital lines, trendy fashion, bright and saturated colors, polished finish.',
        'French Bandes Dessinées (Moebius style). Intricate ink lines, flat pastel colors.',
        'Modern Flat Cartoon. Vector-like clean shapes, bold solid colors, minimalist character design, corporate illustration style.',
      ];
      return selectOption(cartoonVariations, variationIndex, randomSeed);

    case 'illustration':
      // IT/SaaS 산업군은 테크니컬한 일러스트 선호
      if (
        ['electronics_it', 'business_productivity', 'web_service'].includes(
          categoryIndustry || ''
        )
      ) {
        const techVariations = [
          '3D Isometric Illustration. Clean geometric shapes, soft gradient lighting, floating elements, modern tech aesthetic.', // Isometric
          'Minimalist Abstract Tech Art. Fluid shapes, glowing data lines, deep blue and purple palette, futuristic feel.', // Abstract Tech
        ];
        return selectOption(techVariations, variationIndex, randomSeed);
      }
      // 그 외 일반적인 경우
      const illustrationVariations = [
        'Soft Watercolor Painting. Wet-on-wet textures, pastel colors, artistic brush strokes, dreamy atmosphere.', // Watercolor
        'Oil Painting Impasto. Visible thick brush strokes, rich texture, vibrant color blending, fine art aesthetic.', // Oil
        'Modern Vector Art. Clean curves, flat design, vibrant gradients, stylized composition.', // Vector
        'Hand-drawn Pencil Sketch with Color. Rough pencil textures, colored pencil shading, organic and warm feel.', // Colored Pencil
      ];
      return selectOption(illustrationVariations, variationIndex, randomSeed);

    case 'photo-realistic':
      // Industry-specific photo style variations
      if (categoryIndustry === 'food_beverage') {
        const foodPhotoVariations = [
          'Macro Food Photography. Extreme close-up, shallow depth of field f/2.8, sharp focus on texture detail. Steam or moisture droplets visible. Warm 3200K lighting emphasizing appetizing qualities. Dark moody background or bright airy setting based on cuisine type.',
          'Lifestyle Food Photography. Table setting context with human hands reaching or holding utensils. Natural window light from 45-degree angle. Inviting and casual atmosphere. Multiple complementary items in soft focus background. Authentic dining moment captured.',
          'Editorial Food Photography. Clean minimalist backdrop, single dramatic light source creating strong shadows. Artistic plating emphasis with negative space. High contrast, bold composition. Restaurant-quality presentation. Professional culinary magazine aesthetic.',
        ];
        return selectOption(foodPhotoVariations, variationIndex, randomSeed);
      }
      if (categoryIndustry === 'fashion_beauty') {
        const fashionPhotoVariations = [
          'Editorial Fashion Photography. High contrast lighting, dramatic shadows and highlights. Strong directional key light. Model in confident pose with runway-inspired attitude. Bold and striking composition. Emphasis on silhouette and fabric movement. Fashion magazine cover aesthetic.',
          'Lifestyle Beauty Photography. Soft natural window light, minimal makeup look. Authentic candid moment or gentle pose. Approachable and real aesthetic. Skin texture visible and natural. Warm color grading. Relatable everyday beauty.',
          'Studio Product Photography. Clean white seamless backdrop, 360-degree even lighting eliminating all shadows. Product as hero, perfectly lit from all angles. Commercial catalog precision. Sharp focus throughout. Professional e-commerce quality.',
        ];
        return selectOption(fashionPhotoVariations, variationIndex, randomSeed);
      }
      if (
        ['travel_leisure', 'automotive_mobility'].includes(
          categoryIndustry || ''
        )
      ) {
        const wideAngleVariations = [
          'Cinematic Wide Angle. Dynamic 24mm perspective, dramatic golden hour lighting. Capturing the scale and grandeur of the environment. High production value movie still aesthetic. Rich color grading with teal and orange tones. Epic composition.',
          'Documentary Travel Photography. Authentic moment captured with natural available light. Real context and environment. 35mm perspective showing human scale. Genuine and unposed. Photojournalistic approach with emotional storytelling.',
          'Lifestyle Environmental Photography. Person integrated naturally into the scene. Balanced ambient lighting. Medium wide shot showing relationship between subject and environment. Aspirational yet achievable aesthetic. Contemporary travel magazine style.',
        ];
        return selectOption(wideAngleVariations, variationIndex, randomSeed);
      }
      // Default variations for all other industries
      const defaultPhotoVariations = [
        'High-End Commercial Photography. Perfect three-point studio lighting - key, fill, and rim lights balanced precisely. 8k resolution, ultra-realistic material textures. Balanced composition following rule of thirds. Professional catalog quality with sharp focus and clean background.',
        'Environmental Product Photography. Product placed in natural context showing real-world usage. Ambient lighting from scene (window light, practical lamps, outdoor sun). Lifestyle integration. Authentic setting that tells a story. Shallow depth of field isolating subject.',
        'Dramatic Hero Photography. Single powerful key light from 45-degree angle, deep shadows creating mood and dimension. Low-key lighting emphasizing premium quality. Luxury aesthetic with rich blacks and controlled highlights. Editorial sophistication.',
      ];
      return selectOption(defaultPhotoVariations, variationIndex, randomSeed);

    case 'line-drawing':
      if (
        ['electronics_it', 'automotive_mobility', 'construction'].includes(
          categoryIndustry || ''
        )
      ) {
        return 'Technical Schematic Style. Precision black lines on white background, exploded view or wireframe aesthetics, no colors, clean and technical.';
      }
      const lineVariations = [
        'Minimalist Continuous Line Art. Single fluid black line on pure white background, abstract and elegant, no shading.',
        'Simple Hand-drawn Doodle. Loose black ink sketch on white paper, playful and minimal, no fill colors.',
        'Clean Vector Line Art. Uniform black stroke weight, white background, iconographic style, no gradients or colors.',
      ];
      return selectOption(lineVariations, variationIndex, randomSeed);

    default:
      return defaultPrompt;
  }
};

/**
 * Randomness에 따라 Message Type Prompt를 동적으로 생성하는 함수
 */
const getDynamicMessagePrompt = (
  messageId: string,
  modelId: string,
  variationIndex?: number,
  randomSeed?: number
): string => {
  // 기본값 fallback
  const basePrompts: Record<string, string> = {
    'problem-solving':
      messageTypes.find((m) => m.id === 'problem-solving')?.aiPrompt || '',
    benefit: messageTypes.find((m) => m.id === 'benefit')?.aiPrompt || '',
    comparison: messageTypes.find((m) => m.id === 'comparison')?.aiPrompt || '',
    story: messageTypes.find((m) => m.id === 'story')?.aiPrompt || '',
  };

  const defaultPrompt = basePrompts[messageId] || '';

  // 사람 모델이 아닐 경우, 사람의 표정이나 감정을 묘사하는 변주를 제외해야 함
  const hasNoPerson = ['product-ui-only', 'hands-only'].includes(modelId);

  switch (messageId) {
    case 'comparison':
      const comparisonVariations = [
        'Split Screen Composition. The image is divided into two distinct halves by a clean vertical dividing line. LEFT SIDE (before): Desaturated by 40%, cooler color temperature (4200K blue-tinted), flatter lighting with minimal dimension, slightly cluttered or chaotic elements suggesting inefficiency. RIGHT SIDE (after): Full saturation, warm color temperature (5500K), dimensional lighting with highlights, organized and clean elements showing improvement. The product or its benefit is prominently featured on the right side in sharp focus. Strong visual contrast in color, organization, and emotional tone.',
        'Visual Metaphor of Transformation. LEFT: Chaos state - scattered, tangled, or disorganized elements (papers flying, puzzle pieces separated). Muted colors, lower contrast. RIGHT: Order state - same elements now perfectly organized, aligned, or connected (papers stacked neatly, puzzle completed). Vibrant colors, crisp definition. The product acts as the organizing force, either visible in the center or clearly implied. Symmetrical composition emphasizing the transformation.',
        'Side-by-Side Product Comparison. Two distinct options placed next to each other in equal visual weight. LEFT OPTION: The alternative or old way, shown with adequate lighting but no special emphasis. Neutral or slightly dated presentation. RIGHT OPTION (your product): Superior presentation with better lighting creating highlights and dimension, enhanced detail visibility, more modern or appealing setting. "A vs B" clear labeling through visual treatment alone. Neither side should look bad, but the right should look definitively better through lighting, freshness, and appeal.',
      ];
      return selectOption(comparisonVariations, variationIndex, randomSeed);

    case 'problem-solving':
      const problemVariations = [
        'The Ideal Result. A scene showing the perfect state achieved after using the product. Everything is organized, efficient, and working smoothly. A sense of completion and perfection.', // Ideal State
        'Stress-Free Environment. A calm, clean, and pleasant atmosphere where the "problem" is visibly absent. Focus on the positive outcome and the lack of friction or difficulty.', // Stress-free
      ];
      // 사람 표정 옵션은 사람이 있을 때만 추가
      if (!hasNoPerson) {
        problemVariations.push(
          'Expression of Pure Satisfaction. Close-up on a person looking genuinely happy and relieved because their problem is gone. Relaxed posture, smiling face. The product is the cause of this joy.'
        );
      }
      return selectOption(problemVariations, variationIndex, randomSeed);

    case 'benefit':
      const benefitVariations = [
        'Hero Shot Low Angle. The product is placed centrally, shot from a slightly low angle to make it look monumental and important. Rays of light or glow behind it.', // Hero
        'Visualizing the Intangible. Integrate abstract benefit symbols naturally into the scene as visual metaphors. These symbols should blend seamlessly with the composition, not appear as separate floating icons. No text, numbers, or readable labels on any symbols.', // Icons
        'Radiating Benefits. The product at the center with visual benefit elements organically flowing from it through natural connections (light rays, energy waves, or environmental elements). Represent benefits as abstract visual shapes and symbols integrated into the scene, not as separate icon elements. No text, numbers, or readable labels.', // Radiating
      ];
      // 라이프스타일 옵션은 사람이 있을 때 더 자연스러움 (없어도 가능은 하나 맥락상)
      if (!hasNoPerson) {
        benefitVariations.push(
          'Lifestyle Bliss. A wide shot showing the "ideal life" achieved through the product. Pure enjoyment, leisure, and lack of stress. The product is the subtle enabler.'
        );
      } else {
        benefitVariations.push(
          'Perfect Environment. The product is placed in an ideal, stress-free environment (e.g., a perfect desk setup, a sunny window). Symbolizing the result of using the product.'
        );
      }
      return selectOption(benefitVariations, variationIndex, randomSeed);

    case 'story':
      const storyVariations = [
        'Before/After Diptych. Two rectangular panels side by side. LEFT PANEL: The situation without the product - show subtle tension, incompleteness, or mild frustration in the scene (cluttered desk, stressed expression, incomplete task). RIGHT PANEL: The improved situation with/after the product - show resolution, satisfaction, organized state (clean workspace, relaxed expression, completed result). Clear visual transformation between panels through color, composition, and subject state.',
        'User Journey Triptych. Three rectangular panels showing progression from left to right. PANEL 1: Discovery - person noticing a problem or finding the product (looking at phone, examining item, moment of realization). PANEL 2: Engagement - actively using the product (hands interacting, focused attention, mid-action). PANEL 3: Success - enjoying the benefit with satisfied expression or visible positive outcome (smile, thumbs up, completed goal). Natural narrative flow with consistent character and setting.',
        'Day in Life Diptych. Two circular vignette panels showing product integration into daily routine. FIRST CIRCLE: Morning or start of activity with the product (coffee cup on desk with laptop, morning workout setup, commute beginning). SECOND CIRCLE: Evening or end of activity showing continued use or benefit (same workspace now clean, post-workout relaxation, arrived destination). Warm, lifestyle aesthetic emphasizing natural habit formation. Same location or character shown at different times.',
        'Problem to Solution Triptych. Three circular panels in sequence. PANEL 1: The pain point visualized without text - show frustration or obstacle through visual metaphor (overflowing inbox, empty wallet). PANEL 2: Introduction of the solution - product appearing or being discovered (hand reaching for product, spotlight on solution, aha moment). PANEL 3: Resolution - problem solved with visible positive change (cleared inbox, satisfied user). Comic-strip storytelling with clear cause and effect.',
        'Zoom Sequence Triptych. Three rectangular panels showing progressive zoom. PANEL 1: Wide establishing shot providing context (full room, outdoor scene, workspace overview showing the setting). PANEL 2: Medium shot focusing on product in use (person using product, closer view of interaction, environment still visible). PANEL 3: Close-up detail highlighting key feature or benefit (product detail, interface element, texture or quality feature). Cinematic storytelling technique guiding viewer from context to detail.',
      ];
      return selectOption(storyVariations, variationIndex, randomSeed);

    default:
      return defaultPrompt;
  }
};

export const getImagePrompt = (
  styles: Styles,
  summary: {
    core_value: string;
    target_customer: string;
    competitive_edge: string;
    customer_benefit: string;
    emotional_keyword?: string;
    feature_summary?: string;
    usage_scenario?: string;
  },
  category?: ProductCategory,
  variationIndex?: number,
  randomSeed?: number
): string => {
  // 동적 Model Prompt 생성
  const modelPrompt = getDynamicModelPrompt(
    styles.model,
    styles.visualStyle,
    category?.form,
    category?.industry,
    variationIndex,
    randomSeed
  );

  // 동적 Visual Style Prompt 생성
  const visualPrompt = getDynamicVisualPrompt(
    styles.visualStyle,
    category?.industry,
    variationIndex,
    randomSeed
  );

  // 동적 Message Prompt 생성 (Model 유무 고려)
  const messagePrompt = getDynamicMessagePrompt(
    styles.messageType,
    styles.model,
    variationIndex,
    randomSeed
  );

  // Extract context-specific visual guidance from templates
  const industryVisualCues = getIndustryVisualCues(category?.industry);
  const formGuidance = getFormGuidance(category?.form);
  const purposeGuidance = getPurposeGuidance(category?.purpose);

  // Get aspect ratio composition guidance
  const aspectRatioGuidance = getAspectRatioGuidance(styles.aspectRatio);

  // Get lighting guidance based on message type and visual style
  const lightingGuidance = getLightingGuidance(
    styles.messageType,
    styles.visualStyle
  );

  // Get critical constraints and negative prompt sections
  const criticalConstraints = getCriticalConstraints();
  const negativePrompt = getNegativePrompt();

  // Line-drawing style specific constraint (overrides all color guidance)
  const lineDrawingConstraint =
    styles.visualStyle === 'line-drawing'
      ? `
[LINE-DRAWING STYLE ABSOLUTE CONSTRAINT:]

This is a LINE-DRAWING style image. The following rules are ABSOLUTE and override ANY color guidance mentioned in other sections:

1. COLOR PROHIBITION (ABSOLUTE):
   - ONLY black lines on white background
   - NO colored subjects, NO colored elements, NO colored fills of any kind
   - If any section mentions colors (vibrant, warm, cool, etc.), IGNORE that guidance completely
   - Subject matter should be represented ONLY through black line work
   - Background must remain pure white

2. LINE-ONLY REPRESENTATION:
   - All forms, shapes, and subjects must be depicted using black lines only
   - No color fills, no shading with color, no colored highlights
   - Texture and depth achieved through line weight, density, and pattern only
   - Even if the actual subject is colorful (food, fashion, etc.), represent it in black lines

3. TECHNIQUE:
   - Use line weight variation, cross-hatching, stippling, or contour lines to suggest form
   - White background must remain clean and uncolored
   - The entire image is a black-and-white line drawing, period

IMPORTANT: Any mention of "vibrant colors," "warm tones," "color palette," etc. in subsequent sections applies to the CONCEPTUAL mood only, NOT to actual colors in the image. Execute everything in black lines on white background.
`
      : '';

  return `[Core Concept Summary]
${summary.core_value}

[Product Context]
Industry: ${category?.industry || 'general'}
Product Form: ${category?.form || 'general'}
Advertising Purpose: ${category?.purpose || 'general'}

${criticalConstraints}
${lineDrawingConstraint}
[Industry-Specific Visual Direction]
${industryVisualCues}

[Product Form Direction]
${formGuidance}

[Advertising Goal Direction]
${purposeGuidance}

[Composition Requirements for ${styles.aspectRatio} Format]
${aspectRatioGuidance}

${
  lightingGuidance ? `[Lighting Direction]\n${lightingGuidance}\n\n` : ''
}[Style Package]
Apply the following style package as a single unified direction:
– Message Type: ${messagePrompt}
– Visual Style: ${visualPrompt}
– Model Composition: ${modelPrompt}

[Output Requirements]
Generate one high-quality SNS advertisement image.
Commercially professional quality appropriate for social media advertising.
Color balance should be appropriate for the selected style.
Focus on visual communication through imagery, composition, and color - NOT through text or words.

${negativePrompt}

REMINDER: Absolutely NO readable text anywhere in the image. Replace all text with abstract visual elements.

DEVICE REMINDER: If showing devices (phones, tablets, laptops) - BACK of device = camera + logo + material (NO SCREEN). FRONT of device = screen with abstract UI (no readable text). A device cannot have a screen on both sides. When camera is visible, screen is NOT visible.${
    styles.visualStyle === 'line-drawing'
      ? '\n\nFINAL REMINDER FOR LINE-DRAWING: This MUST be pure black lines on white background ONLY. No colors whatsoever, regardless of any color mentions in earlier sections. All subject matter rendered in black line work only.'
      : ''
  }`;
};
