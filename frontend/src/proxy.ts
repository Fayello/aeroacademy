import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token =
    request.cookies.get('access_token')?.value ||
    request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/dashboard'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  const authRoutes = ['/login', '/register'];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  const urlToken = request.nextUrl.searchParams.get('token');
  if (isProtectedRoute && !token && !urlToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
