'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFunnelStore, ProductSummary } from '@/lib/store';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';

const stepNames = [
  '링크 입력',
  '제품 요약',
  '컨셉 선택',
  '이미지 업로드',
  '에디터',
  '결과',
];

export default function SummaryPage() {
  const router = useRouter();
  const { summary, setSummary, url } = useFunnelStore();
  const [formData, setFormData] = useState<ProductSummary>({
    url: '',
    core_value: '',
    target_customer: '',
    competitive_edge: '',
    customer_benefit: '',
    emotional_keyword: '',
    feature_summary: '',
    usage_scenario: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) {
      router.push('/');
      return;
    }

    if (summary) {
      setFormData(summary);
    }
  }, [url, summary, router]);

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
      (field) => !field || field === '정보 부족'
    );

    if (hasEmptyRequired) {
      alert('필수 항목을 모두 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      setSummary(formData);
      router.push('/concept');
    } catch (err) {
      console.error('Error saving summary:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!url) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <ProgressBar currentStep={2} totalSteps={6} stepNames={stepNames} />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              제품 정보 확인
            </h1>
            <p className="text-gray-600">
              AI가 분석한 제품 정보를 확인하고 수정해주세요
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 필수 필드 섹션 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                필수 정보
              </h2>

              {/* 제품 핵심 가치 */}
              <div className="mb-6">
                <label
                  htmlFor="core_value"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  제품 핵심 가치 *
                </label>
                <textarea
                  id="core_value"
                  value={formData.core_value}
                  onChange={(e) =>
                    handleInputChange('core_value', e.target.value)
                  }
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="제품의 핵심 가치를 한 문장으로 설명해주세요"
                  required
                />
              </div>

              {/* 타겟 고객 */}
              <div className="mb-6">
                <label
                  htmlFor="target_customer"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  타겟 고객 *
                </label>
                <input
                  type="text"
                  id="target_customer"
                  value={formData.target_customer}
                  onChange={(e) =>
                    handleInputChange('target_customer', e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="주요 고객층을 입력해주세요"
                  required
                />
              </div>

              {/* 주요 경쟁 우위 */}
              <div className="mb-6">
                <label
                  htmlFor="competitive_edge"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  주요 경쟁 우위 *
                </label>
                <textarea
                  id="competitive_edge"
                  value={formData.competitive_edge}
                  onChange={(e) =>
                    handleInputChange('competitive_edge', e.target.value)
                  }
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="경쟁사 대비 차별화 포인트를 설명해주세요"
                  required
                />
              </div>

              {/* 고객이 느낄 이득 */}
              <div>
                <label
                  htmlFor="customer_benefit"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  고객이 느낄 이득 *
                </label>
                <textarea
                  id="customer_benefit"
                  value={formData.customer_benefit}
                  onChange={(e) =>
                    handleInputChange('customer_benefit', e.target.value)
                  }
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="고객이 얻을 수 있는 구체적인 이득을 설명해주세요"
                  required
                />
              </div>
            </div>

            {/* 선택 필드 섹션 */}
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-gray-300">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                추가 정보{' '}
                <span className="text-sm font-normal text-gray-500">
                  (입력하시면 더 정확한 결과를 얻을 수 있습니다.)
                </span>
              </h2>

              {/* 주요 기능 요약 */}
              <div className="mb-6">
                <label
                  htmlFor="feature_summary"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  주요 기능 요약
                </label>
                <textarea
                  id="feature_summary"
                  value={formData.feature_summary}
                  onChange={(e) =>
                    handleInputChange('feature_summary', e.target.value)
                  }
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="주요 기능들을 간단히 요약해주세요"
                />
              </div>

              {/* 감정 키워드 */}
              <div className="mb-6">
                <label
                  htmlFor="emotional_keyword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  감정 키워드
                </label>
                <input
                  type="text"
                  id="emotional_keyword"
                  value={formData.emotional_keyword}
                  onChange={(e) =>
                    handleInputChange('emotional_keyword', e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="고객이 느낄 감정을 키워드로 입력해주세요 (예: 효율적, 자신감, 혁신적)"
                />
              </div>

              {/* 사용 시나리오 */}
              <div>
                <label
                  htmlFor="usage_scenario"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  사용 시나리오
                </label>
                <textarea
                  id="usage_scenario"
                  value={formData.usage_scenario}
                  onChange={(e) =>
                    handleInputChange('usage_scenario', e.target.value)
                  }
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="언제, 어떤 상황에서 사용하는지 설명해주세요"
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
                뒤로가기
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                다음
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
