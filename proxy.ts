import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COMPLETELY_PUBLIC_PATHS = ['/login', '/apply'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (COMPLETELY_PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith('/api/auth'))) {
    return NextResponse.next();
  }

  // Check for token in cookies or Authorization header
  const token =
    request.cookies.get('token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  // Allow requests without token to public API endpoints (like apply)
  if (
    pathname.startsWith('/api/recruitment/forms/link/') ||
    pathname.startsWith('/api/recruitment/campaigns/link/') ||
    pathname === '/api/recruitment/apply' ||
    pathname === '/api/recruitment/public/stores' ||
    pathname === '/api/recruitment/public/positions'
  ) {
    return NextResponse.next();
  }

  // If no token and trying to access protected route, redirect to login
  if (!token && pathname !== '/login') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If has token and trying to access login page, redirect to dashboard
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/recruitment/dashboard', request.url));
  }

  // If has token and accessing root, redirect to recruitment
  if (token && pathname === '/') {
    return NextResponse.redirect(new URL('/recruitment/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|icons|.*\\..*).*)',
  ],
};