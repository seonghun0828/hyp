// GTM 이벤트 추적 유틸리티

declare global {
  interface Window {
    dataLayer?: Object[];
  }
}

export interface EventParams {
  [key: string]: string | number | undefined;
}

/**
 * GTM에 이벤트 전송
 */
export function trackEvent(eventName: string, eventParams?: EventParams) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...eventParams,
    });
  }
}
