/**
 * 대분류(산업) 카테고리 타입
 */
export type IndustryType =
  | 'fashion_beauty'
  | 'food_beverage'
  | 'electronics_it'
  | 'living_interior'
  | 'travel_leisure'
  | 'health_fitness'
  | 'education_self_development'
  | 'culture_arts_hobby'
  | 'game_entertainment'
  | 'pet'
  | 'finance_real_estate_law'
  | 'business_productivity'
  | 'automotive_mobility'
  | 'publishing';

/**
 * 대분류(산업) 카테고리 한국어 라벨
 * 영어 키에 대응하는 한국어 라벨 매핑
 */
export const INDUSTRY_LABELS: Record<IndustryType, string> = {
  fashion_beauty: '패션 / 뷰티',
  food_beverage: '푸드 / 음료',
  electronics_it: '전자제품 / IT 기기',
  living_interior: '리빙 / 인테리어',
  travel_leisure: '여행 / 레저',
  health_fitness: '헬스 / 피트니스',
  education_self_development: '교육 / 자기계발',
  culture_arts_hobby: '문화 / 예술 / 취미',
  game_entertainment: '게임 / 엔터테인먼트(영화/OTT/웹툰)',
  pet: '반려동물',
  finance_real_estate_law: '금융 / 부동산 / 법률',
  business_productivity: '비즈니스 / 업무툴 / 생산성',
  automotive_mobility: '자동차 / 모빌리티',
  publishing: '출판(책, 전자책)',
};

/**
 * 대분류(산업) 카테고리별 프롬프트 템플릿
 * 각 카테고리별로 이미지 생성용 프롬프트 모듈을 정의
 */
export const INDUSTRY_TEMPLATES: Record<IndustryType, string> = {
  fashion_beauty: `Industry: Fashion / Beauty. Visual cues: runway or stylish urban street, well-styled models, focus on silhouette, fabric movement, texture and accessories. Emphasize confident poses and expressive styling. Use polished, editorial composition; show the product integrated into an outfit or beauty ritual. Convey trendiness and aspirational style.`,
  food_beverage: `Industry: Food / Beverage. Visual cues: appetizing close-ups, steam/condensation/shine details, natural textures and vibrant colors. Table setting or hands interacting with food for warmth. Use warm, tactile lighting that emphasizes freshness and taste. Convey deliciousness and comfort.`,
  electronics_it: `Industry: Electronics / IT Device. Visual cues: clean modern surfaces, device UI glow, precise materials (metal, glass, matte), reflections and rim-lighting. Emphasize product ergonomics and sleek design. Optionally include human interaction (fingers, hands) to show scale and use. Convey innovation and premium quality.`,
  living_interior: `Industry: Living / Interior. Visual cues: well-styled interior vignette, balanced negative space, textured materials (wood, fabric, ceramics). Natural daylight or warm ambient light. Show product as part of a harmonious home scene. Convey comfort, tastefulness, and daily beauty.`,
  travel_leisure: `Industry: Travel / Leisure. Visual cues: expansive landscapes, dynamic motion, authentic candid moments. People engaging with surroundings (walking, photographing, relaxing). Use vivid natural light and wide composition. Convey freedom, adventure, and discovery.`,
  health_fitness: `Industry: Health / Fitness. Visual cues: action, movement, energetic postures, clear muscle definition or equipment detail. High-contrast lighting and vibrant, motivating colors. Capture exertion, progress, and vitality. Convey performance and inspiration.`,
  education_self_development: `Industry: Education / Self-Development. Visual cues: focused learners, study setups, subtle UI elements (if digital), books or devices, calm productive lighting. Convey clarity, growth, and approachable expertise. Use clean, organized composition with human focus.`,
  culture_arts_hobby: `Industry: Culture / Art / Hobby. Visual cues: creative tools, hands-on activity, textured materials, studio or gallery ambiance. Emphasize craft, detail, and personal expression. Use mood lighting to evoke inspiration and curiosity.`,
  game_entertainment: `Industry: Games / Entertainment. Visual cues: cinematic framing, dynamic poses or immersive screens, stylized color grading, props referencing genre (controller, popcorn, sketchpads). Convey excitement, immersion, and storytelling energy. Use bold contrast and saturated accents.`,
  pet: `Industry: Pet. Visual cues: warm, affectionate interactions between people and pets, clear focus on pet expressions and textures (fur). Natural, comfortable settings (home, park). Convey care, joy, and trust.`,
  finance_real_estate_law: `Industry: Finance / Real Estate / Legal. Visual cues: professional settings, trustworthy composition, subtle corporate palette, confident individuals in real contexts (office, property). Use crisp, neutral lighting and clean geometry. Convey trust, credibility, and clarity.`,
  business_productivity: `Industry: Business / Productivity Tools. Visual cues: modern workspaces, collaborative scenes, dashboard/UI hints, focused users. Use precise, minimal composition and cool-toned accent colors. Convey efficiency, reliability, and modern professionalism.`,
  automotive_mobility: `Industry: Automotive / Mobility. Visual cues: vehicle forms, motion blur or road perspective, reflections on metal, environment that matches use-case (urban, highway, nature). Emphasize design lines and lifestyle integration. Convey freedom, performance, and style.`,
  publishing: `Industry: Publishing / Books. Visual cues: tactile pages, readers in cozy spots, stacked books or e-readers, warm reading light. Emphasize storytelling, intimacy, and intellectual appeal. Convey curiosity and immersion.`,
};

/**
 * 중분류(형태) 카테고리 타입
 */
export type FormType =
  | 'physical_product'
  | 'digital_product'
  | 'web_service'
  | 'app'
  | 'offline_service';

/**
 * 중분류(형태) 카테고리 한국어 라벨
 * 영어 키에 대응하는 한국어 라벨 매핑
 */
export const FORM_LABELS: Record<FormType, string> = {
  physical_product: '실물 상품',
  digital_product: '디지털 상품(콘텐츠 포함)',
  web_service: '웹서비스(SaaS 포함)',
  app: '앱',
  offline_service: '오프라인 서비스',
};

/**
 * 중분류(형태) 카테고리별 프롬프트 템플릿
 * 각 형태별로 이미지 생성용 프롬프트 모듈을 정의
 */
export const FORM_TEMPLATES: Record<FormType, string> = {
  physical_product: `Form: Physical product. Visual cue: product as a tangible object — emphasize texture, scale, material, and how a person physically interacts with it. Use close-ups and lifestyle contexts combined.`,
  digital_product: `Form: Digital product / Content. Visual cue: show screens, thumbnails, or devices presenting content; use layered semi-abstract backgrounds to suggest digital consumption. Prioritize mood and engagement over material texture.`,
  web_service: `Form: Web service / SaaS. Visual cue: focus on interface metaphors — screens, simplified UI elements, users collaborating, dashboard-like overlays (non-readable). Use clean, trustworthy palettes and subtle tech accents to imply functionality.`,
  app: `Form: Mobile app. Visual cue: handset in hand, app screen visible but unreadable, finger interactions, app flow implied by sequence or gestures. Emphasize convenience and immediacy.`,
  offline_service: `Form: Offline service. Visual cue: real-world interactions — staff-customer moments, facility environment, hands-on service expressions. Use human warmth and situational context to show the experience.`,
};

/**
 * 소분류(목적) 카테고리 타입
 */
export type PurposeType =
  | 'information_delivery'
  | 'purchase_conversion'
  | 'subscription_signup'
  | 'app_installation'
  | 'lead_generation'
  | 'reservation_visit';

/**
 * 소분류(목적) 카테고리 한국어 라벨
 * 영어 키에 대응하는 한국어 라벨 매핑
 */
export const PURPOSE_LABELS: Record<PurposeType, string> = {
  information_delivery: '정보 전달',
  purchase_conversion: '구매 전환',
  subscription_signup: '구독/가입',
  app_installation: '앱 설치',
  lead_generation: '리드(잠재고객) 수집',
  reservation_visit: '예약/방문',
};

/**
 * 소분류(목적) 카테고리별 프롬프트 템플릿
 * 각 목적별로 이미지 생성용 프롬프트 모듈을 정의
 */
export const PURPOSE_TEMPLATES: Record<PurposeType, string> = {
  information_delivery: `Goal: Information delivery. Visual cue: clear, uncluttered composition focused on demonstrating a key feature or concept visually (use props or staged scenes). Prioritize clarity and explanatory posture in the image.`,
  purchase_conversion: `Goal: Purchase conversion. Visual cue: strong product emphasis, aspirational setting, tactile or appetizing detail, clear hero composition that draws eyes to product. Convey desirability and immediate value.`,
  subscription_signup: `Goal: Subscription / Signup. Visual cue: trust-building scene (smiling users, routines), subtle hint of recurring value (multiple screens, repeated moments). Convey continuity and benefit over time.`,
  app_installation: `Goal: App install. Visual cue: mobile in-hand with action gesture, clear contextual use (on-the-go, quick task), energetic and immediate vibe. Emphasize quick value and convenience.`,
  lead_generation: `Goal: Lead generation. Visual cue: approachable, professional scene showing value exchange (consultation, demo), soft but credible lighting. Convey trust and low-friction engagement.`,
  reservation_visit: `Goal: Reservation / Visit. Visual cue: location-centered imagery (interior or storefront) with people happily arriving or being welcomed. Convey atmosphere and ease of visit.`,
};
