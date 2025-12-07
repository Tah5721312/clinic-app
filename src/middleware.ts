import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit, getClientIP } from '@/lib/rateLimit';

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
};

// API routes that should be rate limited
const apiRoutes = ['/api'];

// Routes that should have stricter rate limiting (very strict for security)
const veryStrictRateLimitRoutes = ['/api/users/login', '/api/users/register'];

// Routes that should have moderate rate limiting
const moderateRateLimitRoutes = ['/api/auth'];

// Routes that should be excluded from strict rate limiting (but still have normal rate limiting)
const excludedFromStrictRateLimit = ['/api/auth/session'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting to API routes
  if (apiRoutes.some((route) => pathname.startsWith(route))) {
    const ip = getClientIP(request.headers);
    const identifier = `${ip}:${pathname}`;

    // Check if route should be excluded from strict rate limiting
    const isExcluded = excludedFromStrictRateLimit.some((route) =>
      pathname.startsWith(route)
    );

    // Very strict rate limiting for login/register (security critical)
    const isVeryStrictRoute = veryStrictRateLimitRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // Moderate rate limiting for other auth routes (except session endpoint)
    const isModerateRoute = !isExcluded && moderateRateLimitRoutes.some((route) =>
      pathname.startsWith(route)
    );
    
    // Apply appropriate rate limiting based on route type
    const limit = isExcluded
      ? rateLimit(identifier, {
          ...rateLimitConfig,
          maxRequests: 200, // 200 requests per 15 minutes for session checks
        })
      : isVeryStrictRoute
      ? rateLimit(identifier, {
          ...rateLimitConfig,
          maxRequests: 20, // 20 requests per 15 minutes for login/register (security)
        })
      : isModerateRoute
      ? rateLimit(identifier, {
          ...rateLimitConfig,
          maxRequests: 200, // 200 requests per 15 minutes for other auth routes
        })
      : rateLimit(identifier, rateLimitConfig);

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((limit.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((limit.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(rateLimitConfig.maxRequests),
            'X-RateLimit-Remaining': String(limit.remaining),
            'X-RateLimit-Reset': String(limit.resetTime),
          },
        }
      );
    }

    // Add rate limit headers to response
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(rateLimitConfig.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(limit.remaining));
    response.headers.set('X-RateLimit-Reset', String(limit.resetTime));

    return response;
  }

  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

