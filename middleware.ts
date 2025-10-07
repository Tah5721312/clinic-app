import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value as any;

  // حماية صفحة الـ Dashboard
  if (request.nextUrl.pathname.startsWith('/Dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // فقط superadmin و admin يمكنهم الوصول للـ Dashboard
    if (role !== 'superadmin' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // السماح للجميع بالوصول للصفحة الرئيسية والـ profiles
  if (request.nextUrl.pathname === '/' || 
      request.nextUrl.pathname.startsWith('/profile/')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/Dashboard/:path*', '/profile/:path*', '/'],
};