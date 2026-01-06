'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { INITIAL_CREDITS } from '@/lib/constants';

export default function CreditDisplay() {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check if Supabase client is initialized
    if (!supabase) {
      setLoading(false);
      return;
    }

    const fetchCredits = async () => {
      try {
        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        let query = supabase.from('user_credits').select('free_credits, paid_credits');

        if (user) {
          query = query.eq('user_id', user.id);
        } else {
          // If no user, try to find anon token from cookie
          // Call API route which handles anon token extraction and Lazy Creation if needed
          const response = await fetch('/api/credits');
          if (response.ok) {
            const data = await response.json();
            setCredits(data.credits);
          } else {
            // If API fails (e.g. 404 or 500), set 0
            setCredits(0);
          }
          setLoading(false);
          return;
        }

        // Use maybeSingle() instead of single() to avoid PGRST116 (0 rows) or 406 errors
        const { data, error } = await query.maybeSingle();
        
        if (data) {
          setCredits((data.free_credits || 0) + (data.paid_credits || 0));
        } else {
          // If logged in but no credits found, it might be a timing issue or sync issue.
          // Ideally, Auth Callback handles this. For display, we can show 0 or refetch.
          // Let's assume 0 for now.
          setCredits(0);
        }
      } catch (error) {
        console.error('Failed to fetch credits:', error);
        setCredits(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, []);

  if (loading || credits === null) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full shadow-sm border border-gray-200 text-sm font-medium text-gray-700 flex items-center gap-2">
      <span>🪙</span>
      <span>{credits.toLocaleString()}</span>
    </div>
  );
}
