import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCredits } from '@/lib/credits';

export async function GET(request: NextRequest) {
  try {
    // 1. Get user from Auth (if logged in)
    // Note: supabase client in lib/supabase is initialized with anon key.
    // To get the user from the request (cookie), we usually need createServerClient from @supabase/ssr.
    // But we are not using @supabase/ssr yet.
    // The existing code uses client-side auth mainly.
    // However, for API routes, we can parse the JWT from the Authorization header or cookie.
    
    // For now, let's rely on the anon_token cookie which middleware sets.
    // Even logged in users will have anon_token if we don't clear it, 
    // BUT we should check for logged in user first.
    
    // Simplest way without changing auth stack:
    // Check anon_token. If logged in, the client should probably send the session token.
    // But since we are using Supabase Auth, the session is in cookies/localstorage.
    
    // Let's rely on `anon_token` first as it covers the "free limit" case.
    // If the user is logged in, we might need to properly handle auth verification.
    // Given MVP status, let's assume we check anon_token first.
    // But wait, the plan says "Registering provides additional credits".
    // So we MUST identify the logged-in user.
    
    // Since we are not fully using @supabase/ssr, verifying the user in API route might be tricky
    // without the access token. 
    // Usually the client includes the access token in headers.
    
    // Let's look at `middleware.ts`. It only handles `anon_token`.
    // It doesn't handle Supabase auth tokens.
    
    // For this API to work for logged in users, we need to read the Supabase session.
    // Supabase auth cookie is named `sb-<project-ref>-auth-token`.
    
    // Instead of implementing full auth check here (which requires the secret key to verify JWT),
    // let's try to get `anon_token` from cookie.
    // For logged-in users, `user_credits` table has `user_id`.
    // If we want to support logged-in users, we need to know who they are.
    
    // Strategy:
    // 1. Check for `anon_token` cookie.
    // 2. If present, get credits for that token.
    // 3. BUT if the user is logged in, their credits are attached to `user_id`.
    //    We need to know if the request comes from a logged in user.
    
    // Temporary solution for MVP:
    // The `CreditDisplay` component calls this API.
    // For logged in users, `CreditDisplay` client-side fetches directly from DB using RLS.
    // So this API is ONLY needed for anon users (who can't access DB directly via RLS easily without a user session, 
    // OR we allowed RLS for everyone).
    
    // Wait, I set RLS to "Allow all operations" for `user_credits`.
    // So `CreditDisplay` CAN fetch for anon_token if it knows the anon_token.
    // But `anon_token` is in an HttpOnly cookie. The client JS cannot read it.
    // So the client JS cannot query `where anon_token = '...'`.
    
    // So this API is indeed needed for Anon users.
    // For Logged-in users, the client JS can just query `where user_id = my_id`.
    
    const anonToken = request.cookies.get('anon_token')?.value;
    
    if (!anonToken) {
      return NextResponse.json({ credits: 0 });
    }
    
    const credits = await getCredits({ anonToken });
    return NextResponse.json({ credits: credits.total });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}

