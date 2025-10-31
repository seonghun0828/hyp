import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '제품 정보',
  description: 'AI가 분석한 제품 정보를 확인하고 수정해주세요',
};

export default function SummaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
