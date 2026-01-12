import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { locales } from './i18n';

// Create i18n middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always',
  localeDetection: true,
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.includes('/api/') ||
    pathname.includes('/_next/') ||
    pathname.includes('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Custom locale detection logic
  const detectedLocale = detectLocale(request);

  // If pathname doesn't have a locale, redirect to detected locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    const newUrl = new URL(`/${detectedLocale}${pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  // Apply intl middleware first
  let response = intlMiddleware(request);

  // Get current locale from pathname
  const currentLocale = pathname.split('/')[1];

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            if (response) {
              response.cookies.set(name, value, options);
            }
          });
        },
      },
    }
  );

  // Refresh session (extends cookie expiration)
  await supabase.auth.getUser();

  // Check anon_token cookie
  const anonToken = request.cookies.get('anon_token')?.value;

  if (!anonToken) {
    // Generate new token if doesn't exist
    const newAnonToken = crypto.randomUUID();

    if (!response) {
      response = NextResponse.next();
    }

    // Set cookie (expires in 1 year)
    response.cookies.set('anon_token', newAnonToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

function detectLocale(request: NextRequest): string {
  // 1. Check saved cookie
  const savedLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (savedLocale && locales.includes(savedLocale as any)) {
    return savedLocale;
  }

  // 2. Check Vercel geo header (if deployed on Vercel)
  const country = request.headers.get('x-vercel-ip-country');
  if (country === 'KR') {
    return 'ko';
  }

  // 3. Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage?.includes('ko')) {
    return 'ko';
  }

  // 4. Default to English
  return 'en';
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
