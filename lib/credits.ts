import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as globalSupabase } from './supabase';
import { INITIAL_CREDITS } from './constants';

export async function getCredits(
  identifier: { userId?: string; anonToken?: string },
  client?: SupabaseClient
) {
  const supabase = client || globalSupabase;
  if (!supabase) throw new Error('Supabase client not initialized');

  const { userId, anonToken } = identifier;
  let query = supabase
    .from('user_credits')
    .select('free_credits, paid_credits');

  if (userId) {
    query = query.eq('user_id', userId);
  } else if (anonToken) {
    query = query.eq('anon_token', anonToken);
  } else {
    throw new Error('User ID or Anon Token required');
  }

  // Use simple select() array return to avoid 406 or JSON errors when 0 or >1 rows
  // Also limit(1) for safety
  const { data: list, error } = await query.limit(1);

  if (error) {
    throw error;
  }

  const data = list?.[0] || null;

  // If data exists, return it
  if (data) {
    return {
      free: data.free_credits,
      paid: data.paid_credits,
      total: data.free_credits + data.paid_credits,
    };
  }

  // If no data found AND we have an anonToken, create it now (Lazy Creation)
  // But ONLY if userId is NOT provided (logged-in users handled by Auth Callback)
  if (!data && anonToken && !userId) {
    // Try to insert new credits for this anon token
    const { data: newData, error: insertError } = await supabase
      .from('user_credits')
      .insert({
        anon_token: anonToken,
        free_credits: INITIAL_CREDITS.ANON,
      })
      .select('free_credits, paid_credits')
      .single(); // insert returns single row so single() is fine here usually, or change to maybeSingle

    if (insertError) {
      // If insert failed (e.g. duplicate key race condition), try fetching again
      if (insertError.code === '23505') {
        // unique_violation
        const { data: retryList, error: retryError } = await query.limit(1);
        const retryData = retryList?.[0] || null;

        if (retryError || !retryData) {
          throw (
            retryError || new Error('Failed to retrieve credits after conflict')
          );
        }
        return {
          free: retryData.free_credits,
          paid: retryData.paid_credits,
          total: retryData.free_credits + retryData.paid_credits,
        };
      }
      throw insertError;
    }

    return {
      free: newData.free_credits,
      paid: newData.paid_credits,
      total: newData.free_credits + newData.paid_credits,
    };
  }

  // If no data found for userId (should not happen if Auth Callback works, but fallback just in case)
  if (!data && userId) {
    return { free: 0, paid: 0, total: 0 };
  }

  return { free: 0, paid: 0, total: 0 };
}

export async function checkCredits(
  identifier: { userId?: string; anonToken?: string },
  cost: number,
  client?: SupabaseClient
): Promise<boolean> {
  const credits = await getCredits(identifier, client);
  return credits.total >= cost;
}

export async function deductCredits(
  identifier: { userId?: string; anonToken?: string },
  cost: number,
  client?: SupabaseClient
) {
  const supabase = client || globalSupabase;
  if (!supabase) throw new Error('Supabase client not initialized');

  const { userId, anonToken } = identifier;

  // getCredits handles creation if needed
  const credits = await getCredits(identifier, supabase);

  if (credits.total < cost) {
    throw new Error('Insufficient credits');
  }

  let newFree = credits.free;
  let newPaid = credits.paid;
  let remainingCost = cost;

  // Deduct from free first
  if (newFree >= remainingCost) {
    newFree -= remainingCost;
    remainingCost = 0;
  } else {
    remainingCost -= newFree;
    newFree = 0;

    // Then deduct from paid
    if (newPaid >= remainingCost) {
      newPaid -= remainingCost;
      remainingCost = 0;
    } else {
      // Should not happen due to check above
      throw new Error('Insufficient credits during deduction');
    }
  }

  let query = supabase.from('user_credits').update({
    free_credits: newFree,
    paid_credits: newPaid,
    updated_at: new Date().toISOString(),
  });

  if (userId) {
    query = query.eq('user_id', userId);
  } else if (anonToken) {
    query = query.eq('anon_token', anonToken);
  }

  const { error } = await query;
  if (error) throw error;

  return { free: newFree, paid: newPaid, total: newFree + newPaid };
}

export async function createAnonCredits(anonToken: string, client?: SupabaseClient) {
  const supabase = client || globalSupabase;
  if (!supabase) throw new Error('Supabase client not initialized');

  const { error } = await supabase.from('user_credits').insert({
    anon_token: anonToken,
    free_credits: INITIAL_CREDITS.ANON,
  });

  if (error) throw error;
}
