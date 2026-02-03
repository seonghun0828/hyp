import { NextRequest } from 'next/server';

type Locale = 'ko' | 'en';

const messages: Record<string, Record<Locale, string>> = {
  // Image generation
  imageGenerationFailed: {
    ko: '이미지 생성에 실패했습니다. 잠시 후 다시 시도해주세요.',
    en: 'Image generation failed. Please try again later.',
  },
  imageGenerationError: {
    ko: '이미지 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    en: 'An error occurred during image generation. Please try again later.',
  },

  // Summary/Analysis
  siteBlockedScraping: {
    ko: '해당 사이트는 정보 수집을 차단하고 있습니다. 직접 입력해주세요.',
    en: 'This site blocks automated data collection. Please enter the information manually.',
  },
  serverTemporaryError: {
    ko: '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
    en: 'A temporary server error occurred. Please try again later.',
  },
  unknownError: {
    ko: '알 수 없는 오류가 발생했습니다.',
    en: 'An unknown error occurred.',
  },

  // Credits
  loginRequired: {
    ko: '로그인이 필요합니다.',
    en: 'Login is required.',
  },
  insufficientCredits: {
    ko: '크레딧이 부족합니다.',
    en: 'Insufficient credits.',
  },
  serverError: {
    ko: '서버 에러가 발생했습니다.',
    en: 'A server error occurred.',
  },

  // Payments
  checkoutFailed: {
    ko: '결제 생성에 실패했습니다. 다시 시도해주세요.',
    en: 'Failed to create payment checkout. Please try again.',
  },
  webhookError: {
    ko: '결제 웹훅 처리에 실패했습니다. 고객센터에 문의해주세요.',
    en: 'Payment webhook processing failed. Please contact support.',
  },

  // Fallback
  product: {
    ko: '제품',
    en: 'Product',
  },
};

export function getLocaleFromRequest(request: NextRequest): Locale {
  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') || '';

  // Check referer URL for locale
  const referer = request.headers.get('referer') || '';
  if (referer.includes('/ko/') || referer.includes('/ko?')) {
    return 'ko';
  }
  if (referer.includes('/en/') || referer.includes('/en?')) {
    return 'en';
  }

  // Fallback to Accept-Language header
  if (acceptLanguage.startsWith('ko')) {
    return 'ko';
  }

  return 'en';
}

export function getApiMessage(
  key: keyof typeof messages,
  locale: Locale
): string {
  return messages[key]?.[locale] || messages[key]?.['en'] || key;
}

export function t(request: NextRequest, key: keyof typeof messages): string {
  const locale = getLocaleFromRequest(request);
  return getApiMessage(key, locale);
}
