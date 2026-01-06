'use client';

import { useEffect } from 'react';
import { useCreditStore } from '@/lib/store';

export default function CreditDisplay() {
  const { credits, fetchCredits, loading } = useCreditStore();

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  if (loading && credits === null) return null;
  if (credits === null) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full shadow-sm border border-gray-200 text-sm font-medium text-gray-700 flex items-center gap-2">
      <span>🪙</span>
      <span>{credits.toLocaleString()}</span>
    </div>
  );
}
