import { ProductCategory } from './types';
import {
  INDUSTRY_TEMPLATES,
  INDUSTRY_LABELS,
  FORM_TEMPLATES,
  FORM_LABELS,
  PURPOSE_TEMPLATES,
  PURPOSE_LABELS,
  IndustryType,
  FormType,
  PurposeType,
} from './templates';

/**
 * 대분류(산업) 모듈 반환
 * @param industry 산업 분류 (영어 키 또는 한국어 라벨)
 * @returns 프롬프트 모듈 문자열
 */
export const getIndustryModule = (industry: string): string => {
  // 1. 영어 키로 정확한 매칭 시도
  if (industry in INDUSTRY_TEMPLATES) {
    return INDUSTRY_TEMPLATES[industry as IndustryType];
  }

  // 2. 한국어 라벨로 매칭 시도
  for (const [key, label] of Object.entries(INDUSTRY_LABELS)) {
    if (
      label === industry ||
      industry.includes(label) ||
      label.includes(industry)
    ) {
      return INDUSTRY_TEMPLATES[key as IndustryType];
    }
  }

  // 3. 부분 매칭 시도 (한국어 라벨의 일부로 검색)
  for (const [key, label] of Object.entries(INDUSTRY_LABELS)) {
    const labelParts = label.split(' / ');
    if (
      labelParts.some(
        (part) => part.includes(industry) || industry.includes(part)
      )
    ) {
      return INDUSTRY_TEMPLATES[key as IndustryType];
    }
  }

  // 매칭되지 않으면 빈 문자열 반환
  return '';
};

/**
 * 중분류(형태) 모듈 반환
 * @param form 제품 형태 (영어 키 또는 한국어 라벨)
 * @returns 프롬프트 모듈 문자열
 */
export const getFormModule = (form: string): string => {
  // 1. 영어 키로 정확한 매칭 시도
  if (form in FORM_TEMPLATES) {
    return FORM_TEMPLATES[form as FormType];
  }

  // 2. 한국어 라벨로 매칭 시도
  for (const [key, label] of Object.entries(FORM_LABELS)) {
    if (label === form || form.includes(label) || label.includes(form)) {
      return FORM_TEMPLATES[key as FormType];
    }
  }

  // 3. 부분 매칭 시도 (한국어 라벨의 일부로 검색)
  for (const [key, label] of Object.entries(FORM_LABELS)) {
    const labelParts = label.split('(');
    const mainLabel = labelParts[0].trim();
    if (mainLabel.includes(form) || form.includes(mainLabel)) {
      return FORM_TEMPLATES[key as FormType];
    }
  }

  // 매칭되지 않으면 빈 문자열 반환
  return '';
};

/**
 * 소분류(목적) 모듈 반환
 * @param purpose 제품 목적 (영어 키 또는 한국어 라벨)
 * @returns 프롬프트 모듈 문자열
 */
export const getPurposeModule = (purpose: string): string => {
  // 1. 영어 키로 정확한 매칭 시도
  if (purpose in PURPOSE_TEMPLATES) {
    return PURPOSE_TEMPLATES[purpose as PurposeType];
  }

  // 2. 한국어 라벨로 매칭 시도
  for (const [key, label] of Object.entries(PURPOSE_LABELS)) {
    if (
      label === purpose ||
      purpose.includes(label) ||
      label.includes(purpose)
    ) {
      return PURPOSE_TEMPLATES[key as PurposeType];
    }
  }

  // 3. 부분 매칭 시도 (한국어 라벨의 일부로 검색)
  for (const [key, label] of Object.entries(PURPOSE_LABELS)) {
    const labelParts = label.split('(');
    const mainLabel = labelParts[0].trim();
    if (mainLabel.includes(purpose) || purpose.includes(mainLabel)) {
      return PURPOSE_TEMPLATES[key as PurposeType];
    }
  }

  // 매칭되지 않으면 빈 문자열 반환
  return '';
};

/**
 * 카테고리 전체 모듈 조합
 * @param category 제품 카테고리
 * @returns 조합된 프롬프트 모듈 문자열
 */
export const getCategoryModules = (category: ProductCategory): string => {
  const industryModule = getIndustryModule(category.industry);
  const formModule = getFormModule(category.form);
  const purposeModule = getPurposeModule(category.purpose);

  const modules = [industryModule, formModule, purposeModule]
    .filter((module) => module.trim() !== '')
    .join('\n\n');

  return modules;
};
