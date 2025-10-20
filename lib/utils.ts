// URL 유효성 검사
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// URL에서 도메인 추출
export const getDomainFromUrl = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

// 파일명 생성 (다운로드용)
export const generateFileName = (productName: string): string => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const cleanName = productName.replace(/[^a-zA-Z0-9가-힣]/g, '-');
  return `hyp-${cleanName}-${timestamp}.png`;
};

// 텍스트 길이 제한
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// 색상 유틸리티
export const hexToRgba = (hex: string, alpha: number = 1): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Canvas 유틸리티
export const downloadCanvasAsPNG = (
  canvas: HTMLCanvasElement,
  filename: string
): void => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
