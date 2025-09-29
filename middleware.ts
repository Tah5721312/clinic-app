import { NextRequest, NextResponse } from "next/server";
import { verifyTokenForPage } from "@/lib/verifyToken";
import { JWTPayload, UserRoles } from "@/lib/types";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("jwtToken")?.value;
  const { pathname } = request.nextUrl;
  
  // تحديد أنواع الصفحات
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isApi = pathname.startsWith("/api");
  const isPublicPage = pathname === "/" || pathname === "/about" || pathname === "/contact";
  
  // المسارات المحمية حسب الأدوار
  const protectedRoutes = {
    admin: ["/admin", "/admin/users", "/admin/settings", "/admin/reports"],
    doctor: ["/doctor", "/doctor/patients", "/doctor/appointments", "/doctor/medical-records"],
    patient: ["/patient", "/patient/profile", "/patient/appointments", "/patient/medical-history"],
    receptionist: ["/receptionist", "/receptionist/appointments", "/receptionist/patients"],
    nurse: ["/nurse", "/nurse/patients", "/nurse/assistance"]
  };

  // 🚨 لو مفيش توكن:
  if (!token) {
    if (isApi) {
      // API protected → رجع JSON بدل redirect
      return NextResponse.json(
        { message: "No token provided, access denied" },
        { status: 401 }
      );
    } else if (!isAuthPage && !isPublicPage) {
      // صفحة محمية (غير login/register/public) → رجعه على login
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // ✅ التحقق من صحة التوكن
  const userPayload: JWTPayload | null = verifyTokenForPage(token);
  
  if (!userPayload) {
    // التوكن غير صالح
    if (isApi) {
      return NextResponse.json(
        { message: "Invalid token, access denied" },
        { status: 401 }
      );
    } else if (!isAuthPage) {
      // امسح الكوكي الفاسد ووجهه للـ login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("jwtToken");
      return response;
    }
  }

  // ✅ لو معاه توكن صالح وحاول يدخل login/register → رجعه على الصفحة المناسبة
  if (userPayload && isAuthPage) {
    const redirectUrl = getDefaultPageForRole(userPayload.roleName || 'USER');
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // ✅ التحقق من صلاحيات الوصول للمسارات المحمية
  if (userPayload && !isAuthPage && !isPublicPage && !isApi) {
    const hasAccess = checkRouteAccess(pathname, userPayload);
    
    if (!hasAccess) {
      // ليس له صلاحية للوصول لهذا المسار
      const redirectUrl = getDefaultPageForRole(userPayload.roleName || 'USER');
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // ✅ إضافة معلومات المستخدم للـ headers للاستخدام في API routes
  if (userPayload && isApi) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', userPayload.id.toString());
    requestHeaders.set('x-user-role', userPayload.roleName || 'USER');
    requestHeaders.set('x-is-admin', userPayload.isAdmin.toString());
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

// دالة للتحقق من صلاحية الوصول للمسار
function checkRouteAccess(pathname: string, user: JWTPayload): boolean {
  const userRole = user.roleName?.toLowerCase() as keyof typeof protectedRoutes;
  
  // Super Admin له صلاحية الوصول لكل حاجة
  if (user.roleName === UserRoles.SUPER_ADMIN) {
    return true;
  }

  // Admin له صلاحية الوصول للمسارات العادية + مسارات الإدارة
  if (user.roleName === UserRoles.ADMIN) {
    const adminRoutes = protectedRoutes.admin || [];
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
    if (isAdminRoute) return true;
  }

  // تحقق من المسارات الخاصة بكل دور
  if (userRole && protectedRoutes[userRole]) {
    const allowedRoutes = protectedRoutes[userRole];
    return allowedRoutes.some(route => pathname.startsWith(route));
  }

  // مسارات عامة مسموحة لكل المستخدمين المسجلين
  const generalRoutes = ["/profile", "/settings", "/help"];
  return generalRoutes.some(route => pathname.startsWith(route));
}

// دالة لتحديد الصفحة الافتراضية حسب الدور
function getDefaultPageForRole(role: string): string {
  switch (role) {
    case UserRoles.SUPER_ADMIN:
    case UserRoles.ADMIN:
      return "/admin";
    case UserRoles.DOCTOR:
      return "/doctor";
    case UserRoles.PATIENT:
      return "/patient";
    case UserRoles.RECEPTIONIST:
      return "/receptionist";
    case UserRoles.NURSE:
      return "/nurse";
    default:
      return "/";
  }
}

// المسارات المحمية حسب الأدوار (مكررة هنا عشان تكون accessible في الدالة)
const protectedRoutes = {
  admin: ["/admin", "/admin/users", "/admin/settings", "/admin/reports"],
  doctor: ["/doctor", "/doctor/patients", "/doctor/appointments", "/doctor/medical-records"],
  patient: ["/patient", "/patient/profile", "/patient/appointments", "/patient/medical-history"],
  receptionist: ["/receptionist", "/receptionist/appointments", "/receptionist/patients"],
  nurse: ["/nurse", "/nurse/patients", "/nurse/assistance"]
};

// ✅ استبعاد ملفات static (JS, CSS, صور...) عشان الميدل وير ما يبطأش
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};