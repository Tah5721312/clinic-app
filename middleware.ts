import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // حماية صفحة الـ Dashboard
  if (nextUrl.pathname.startsWith('/Dashboard')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', nextUrl));
    }
    
    // يمكن إضافة فحص الأدوار هنا إذا لزم الأمر
    // const userRole = req.auth?.user?.roleId;
    // if (userRole !== 211 && userRole !== 1) { // superadmin و admin
    //   return NextResponse.redirect(new URL('/', nextUrl));
    // }
  }

  // السماح للجميع بالوصول للصفحة الرئيسية والـ profiles
  if (nextUrl.pathname === '/' || 
      nextUrl.pathname.startsWith('/profile/')) {
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/Dashboard/:path*', '/profile/:path*', '/'],
};