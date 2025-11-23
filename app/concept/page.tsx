'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFunnelStore } from '@/lib/store';

export default function ConceptPage() {
  const router = useRouter();
  const { summary } = useFunnelStore();

  useEffect(() => {
    // 기존 컨셉 페이지는 스타일 선택 첫 페이지로 리다이렉트
    if (summary) {
      router.replace('/styles/messages');
    } else {
      router.replace('/');
    }
  }, [summary, router]);

  return null;
}
