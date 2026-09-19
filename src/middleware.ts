import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('cg_session')?.value;
  const session = token ? await verifyTokenEdge(token) : null;

  // Protected Admin Routes
  if (pathname.startsWith('/admin')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/viewer', request.url));
    }
  }

  // Protected Viewer Routes
  if (pathname.startsWith('/viewer')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protected Timetable Routes
  if (pathname.startsWith('/timetable')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protected Admin API Mutation Routes
  if (
    (pathname.startsWith('/api/resources') ||
      pathname.startsWith('/api/departments') ||
      pathname.startsWith('/api/generate') ||
      pathname.includes('/publish')) &&
    ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)
  ) {
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/viewer/:path*', '/timetable/:path*', '/api/resources/:path*', '/api/departments/:path*', '/api/generate', '/api/timetables/:path*'],
};

