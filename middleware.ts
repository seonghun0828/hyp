import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // anon_token 쿠키 확인
  const anonToken = request.cookies.get('anon_token')?.value;

  if (!anonToken) {
    // 토큰이 없으면 새로 생성
    const newAnonToken = crypto.randomUUID();
    
    // 쿠키 설정 (만료 기간: 1년)
    response.cookies.set('anon_token', newAnonToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });

    // DB Insert 로직 제거 (Lazy Creation으로 변경)
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) -> API routes might need the cookie, so we SHOULD match them or handle it. 
     *   Actually, if I visit /api/..., middleware runs.
     *   But usually we want this for page visits.
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
