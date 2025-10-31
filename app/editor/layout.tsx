import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '콘텐츠 편집',
  description: '텍스트를 드래그하여 위치를 조정하고 스타일을 변경해보세요',
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
