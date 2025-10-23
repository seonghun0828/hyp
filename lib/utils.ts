import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export function generateFileName(title: string): string {
  const sanitizedTitle = title
    .replace(/[^a-zA-Z0-9가-힣\s]/g, '') // 특수문자 제거
    .replace(/\s+/g, '_') // 공백을 언더스코어로 변경
    .substring(0, 30); // 30자로 제한

  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD 형식
  return `hyp_${sanitizedTitle}_${timestamp}.png`;
}
