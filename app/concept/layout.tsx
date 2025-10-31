import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '컨셉 선택',
  description: '제품에 어울리는 홍보 스타일을 선택해주세요',
};

export default function ConceptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
