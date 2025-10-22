'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFunnelStore, ProductSummary } from '@/lib/store';
import { isValidUrl } from '@/lib/utils';
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

export default function HomePage() {
  const router = useRouter();
  const { url, setUrl, setSummary } = useFunnelStore();
  const [inputUrl, setInputUrl] = useState(url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!inputUrl.trim()) {
      setError('링크를 입력해주세요.');
      return;
    }

    if (!isValidUrl(inputUrl)) {
      setError('올바른 URL 형식이 아닙니다.');
      return;
    }

    setLoading(true);
    setUrl(inputUrl);

    try {
      // API 호출하여 제품 요약 생성
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: inputUrl }),
      });

      if (!response.ok) {
        throw new Error('제품 분석에 실패했습니다.');
      }

      const data = await response.json();

      // Zustand 스토어에 제품 요약 데이터 저장
      const summaryData: ProductSummary = {
        id: data.id,
        url: inputUrl,
        core_value: data.core_value,
        target_customer: data.target_customer,
        competitive_edge: data.competitive_edge,
        customer_benefit: data.customer_benefit,
        emotional_keyword: data.emotional_keyword,
        feature_summary: data.feature_summary,
        usage_scenario: data.usage_scenario,
      };
      setSummary(summaryData);

      // 제품 요약 페이지로 이동
      router.push('/summary');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <ProgressBar currentStep={1} totalSteps={6} stepNames={stepNames} />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* 헤더 */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">HYP</h1>
            <p className="text-xl text-gray-600 mb-2">Highlight Your Product</p>
            <p className="text-gray-500">
              제품 링크만 입력하면 AI가 홍보 콘텐츠를 자동 생성해드립니다
            </p>
          </div>

          {/* 입력 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                홍보할 제품의 링크를 입력하세요
              </label>
              <input
                type="url"
                id="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://example.com/product"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                disabled={loading}
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              disabled={!inputUrl.trim()}
              className="w-full"
            >
              {loading ? '제품을 분석하고 있습니다...' : '다음'}
            </Button>
          </form>

          {/* 예시 */}
          <div className="mt-12 p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              지원하는 링크 예시
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• 제품 웹사이트</p>
              <p>• 앱스토어 링크</p>
              <p>• GitHub 프로젝트</p>
              <p>• 온라인 쇼핑몰 상품</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
