import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '완성',
  description: 'AI와 함께 만든 멋진 홍보 콘텐츠가 완성되었습니다',
};

export default function ResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
