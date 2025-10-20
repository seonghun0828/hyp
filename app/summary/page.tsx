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
    title: '',
    description: '',
    features: ['', '', ''],
    targetUsers: ['', ''],
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

  const handleInputChange = (
    field: keyof ProductSummary,
    value: string | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData((prev) => ({
      ...prev,
      features: newFeatures,
    }));
  };

  const handleTargetUserChange = (index: number, value: string) => {
    const newTargetUsers = [...formData.targetUsers];
    newTargetUsers[index] = value;
    setFormData((prev) => ({
      ...prev,
      targetUsers: newTargetUsers,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
            {/* 제품명 */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                제품명
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="제품명을 입력하세요"
                required
              />
            </div>

            {/* 제품 설명 */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                제품 설명
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="제품에 대한 간단한 설명을 입력하세요"
                required
              />
            </div>

            {/* 주요 기능 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주요 기능 (3개)
              </label>
              <div className="space-y-3">
                {formData.features.map((feature, index) => (
                  <input
                    key={index}
                    type="text"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`주요 기능 ${index + 1}`}
                    required
                  />
                ))}
              </div>
            </div>

            {/* 타겟 고객 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                타겟 고객 (2개)
              </label>
              <div className="space-y-3">
                {formData.targetUsers.map((targetUser, index) => (
                  <input
                    key={index}
                    type="text"
                    value={targetUser}
                    onChange={(e) =>
                      handleTargetUserChange(index, e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`타겟 고객 ${index + 1}`}
                    required
                  />
                ))}
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
