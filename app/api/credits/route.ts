import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCredits } from '@/lib/credits';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const anonToken = request.cookies.get('anon_token')?.value;
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!anonToken && !user) {
      return NextResponse.json({ credits: 0 });
    }
    
    const credits = await getCredits({ 
      userId: user?.id, 
      anonToken 
    }, supabase);
    
    return NextResponse.json({ credits: credits.total });

  } catch (error) {
    console.error('Failed to fetch credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}
