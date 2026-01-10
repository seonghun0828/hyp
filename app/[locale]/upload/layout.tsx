import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이미지 업로드',
  description: '제품 이미지를 업로드하거나 AI로 생성해보세요',
};

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
