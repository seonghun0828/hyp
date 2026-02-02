'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useFunnelStore, ProductSummary } from '@/lib/store';
import { trackEvent } from '@/lib/analytics';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';

export default function SummaryPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('summary');
  const tSteps = useTranslations('steps');
  const tCommon = useTranslations('common');

  const { summary, setSummary, url } = useFunnelStore();
  const [formData, setFormData] = useState<ProductSummary>({
    url: '',
    title: '',
    core_value: '',
    target_customer: '',
    competitive_edge: '',
    customer_benefit: '',
    emotional_keyword: '',
    feature_summary: '',
    usage_scenario: '',
  });
  const [loading, setLoading] = useState(false);

  const stepNames = [
    tSteps('linkInput'),
    tSteps('productSummary'),
    tSteps('messageType'),
    tSteps('expressionStyle'),
    tSteps('modelComposition'),
    tSteps('aspectRatio'),
    tSteps('imageUpload'),
    tSteps('editor'),
    tSteps('result'),
  ];

  useEffect(() => {
    if (!url) {
      router.push(`/${locale}`);
      return;
    }

    if (summary) {
      setFormData(summary);
    }
  }, [url, summary, router, locale]);

  const handleInputChange = (field: keyof ProductSummary, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 필수 필드 검증
    const requiredFields = [
      formData.core_value,
      formData.target_customer,
      formData.competitive_edge,
      formData.customer_benefit,
    ];

    const hasEmptyRequired = requiredFields.some(
      (field) => !field || field.trim() === ''
    );

    if (hasEmptyRequired) {
      alert(t('errorRequired'));
      setLoading(false);
      return;
    }

    try {
      // 1. Zustand store에 저장 (localStorage)
      setSummary(formData);

      // 2. DB에 유저가 수정한 데이터 저장
      const response = await fetch('/api/summary/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, locale }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save to database');
      }

      // 이벤트 추적
      trackEvent('summary_next', {
        step: 2,
        page: 'summary',
        locale,
      });

      router.push(`/${locale}/styles/messages`);
    } catch (err) {
      alert(
        `${t('errorSaving')}: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStepClick = (stepNumber: number) => {
    const stepRoutes: Record<number, string> = {
      1: `/${locale}`,
      2: `/${locale}/summary`,
      3: `/${locale}/styles/messages`,
      4: `/${locale}/styles/expressions`,
      5: `/${locale}/styles/models`,
      6: `/${locale}/styles/aspect-ratio`,
      7: `/${locale}/upload`,
      8: `/${locale}/editor`,
      9: `/${locale}/result`,
    };

    const route = stepRoutes[stepNumber];
    if (route && route !== window.location.pathname) {
      router.push(route);
    }
  };

  if (!url) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <ProgressBar
        currentStep={2}
        totalSteps={9}
        stepNames={stepNames}
        onStepClick={handleStepClick}
      />

      <div className="container mx-auto px-4 pb-12 md:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t('title')}
            </h1>
            <p className="text-gray-600">{t('description')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 필수 필드 섹션 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('requiredSection')}
              </h2>

              {/* 제품 핵심 가치 */}
              <div className="mb-6">
                <label
                  htmlFor="core_value"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t('coreValueLabel')}
                </label>
                <textarea
                  id="core_value"
                  value={formData.core_value}
                  onChange={(e) =>
                    handleInputChange('core_value', e.target.value)
                  }
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder={t('placeholder')}
                  required
                />
              </div>

              {/* 타겟 고객 */}
              <div className="mb-6">
                <label
                  htmlFor="target_customer"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t('targetCustomerLabel')}
                </label>
                <input
                  type="text"
                  id="target_customer"
                  value={formData.target_customer}
                  onChange={(e) =>
                    handleInputChange('target_customer', e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder={t('placeholder')}
                  required
                />
              </div>

              {/* 주요 경쟁 우위 */}
              <div className="mb-6">
                <label
                  htmlFor="competitive_edge"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t('competitiveEdgeLabel')}
                </label>
                <textarea
                  id="competitive_edge"
                  value={formData.competitive_edge}
                  onChange={(e) =>
                    handleInputChange('competitive_edge', e.target.value)
                  }
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder={t('placeholder')}
                  required
                />
              </div>

              {/* 고객이 느낄 이점 */}
              <div>
                <label
                  htmlFor="customer_benefit"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t('customerBenefitLabel')}
                </label>
                <textarea
                  id="customer_benefit"
                  value={formData.customer_benefit}
                  onChange={(e) =>
                    handleInputChange('customer_benefit', e.target.value)
                  }
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder={t('placeholder')}
                  required
                />
              </div>
            </div>

            {/* 선택 필드 섹션 */}
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-gray-300">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('optionalSection')}{' '}
                <span className="text-sm font-normal text-gray-500">
                  {t('optionalHint')}
                </span>
              </h2>

              {/* 주요 기능 요약 */}
              <div className="mb-6">
                <label
                  htmlFor="feature_summary"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t('featureSummaryLabel')}
                </label>
                <textarea
                  id="feature_summary"
                  value={formData.feature_summary}
                  onChange={(e) =>
                    handleInputChange('feature_summary', e.target.value)
                  }
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder={t('placeholder')}
                />
              </div>

              {/* 감정 키워드 */}
              <div className="mb-6">
                <label
                  htmlFor="emotional_keyword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t('emotionalKeywordLabel')}
                </label>
                <input
                  type="text"
                  id="emotional_keyword"
                  value={formData.emotional_keyword}
                  onChange={(e) =>
                    handleInputChange('emotional_keyword', e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder={t('placeholder')}
                />
              </div>

              {/* 사용 시나리오 */}
              <div>
                <label
                  htmlFor="usage_scenario"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t('usageScenarioLabel')}
                </label>
                <textarea
                  id="usage_scenario"
                  value={formData.usage_scenario}
                  onChange={(e) =>
                    handleInputChange('usage_scenario', e.target.value)
                  }
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder={t('placeholder')}
                />
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                {tCommon('back')}
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                {tCommon('next')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
