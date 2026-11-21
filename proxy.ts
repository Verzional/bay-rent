import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'bayrent_session';

/**
 * Lightweight optimistic route guard redirecting requests without a session cookie
 * away from protected `/admin` and `/tenant` portals. Full JWT verification and role
 * authorization are enforced in Server Components and Server Actions.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/tenant/:path*'],
};
