/**
 * API Helper utilities for consistent error handling, logging, and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClientIP } from './rateLimit';
import { logAuditEvent } from './auditLogger';
import { sanitizeObject } from './sanitize';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Create an error response
 */
export function errorResponse<T = unknown>(
  error: string | Error,
  status: number = 500,
  message?: string
): NextResponse<ApiResponse<T>> {
  const errorMessage = error instanceof Error ? error.message : error;

  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Handle API route with error handling, audit logging, and sanitization
 */
export async function handleApiRoute<T>(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<T>,
  options: {
    action: string;
    resource: string;
    userId?: number;
    requireAuth?: boolean;
    sanitizeInput?: boolean;
  }
): Promise<NextResponse<ApiResponse<T>>> {
  const startTime = Date.now();
  const ip = getClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    // Sanitize request body if needed
    let sanitizedRequest = request;
    if (options.sanitizeInput && request.method !== 'GET') {
      try {
        const body = await request.json();
        const sanitized = sanitizeObject(body);
        // Create new request with sanitized body
        sanitizedRequest = new NextRequest(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(sanitized),
        });
      } catch {
        // If body parsing fails, continue with original request
      }
    }

    // Execute handler
    const result = await handler(sanitizedRequest);

    // Log successful action
    await logAuditEvent({
      user_id: options.userId,
      action: options.action,
      resource: options.resource,
      ip_address: ip,
      user_agent: userAgent,
      status: 'success',
      details: `Action completed in ${Date.now() - startTime}ms`,
    });

    return successResponse(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorToPass: string | Error = error instanceof Error ? error : errorMessage;

    // Log failed action
    await logAuditEvent({
      user_id: options.userId,
      action: options.action,
      resource: options.resource,
      ip_address: ip,
      user_agent: userAgent,
      status: 'failure',
      error_message: errorMessage,
    });

    // Determine status code
    let status = 500;
    if (errorMessage.includes('not found') || errorMessage.includes('Not Found')) {
      status = 404;
    } else if (
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('Unauthorized') ||
      errorMessage.includes('permission')
    ) {
      status = 403;
    } else if (
      errorMessage.includes('validation') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('required')
    ) {
      status = 400;
    }

    return errorResponse<T>(errorToPass, status);
  }
}

/**
 * Get user ID from request (from session or cookies)
 */
export async function getUserIdFromRequest(
  request: NextRequest
): Promise<number | undefined> {
  // Try to get from cookies
  const userIdCookie = request.cookies.get('userId')?.value;
  if (userIdCookie) {
    const userId = Number(userIdCookie);
    if (Number.isFinite(userId) && userId > 0) {
      return userId;
    }
  }

  // Could also check session here if needed
  return undefined;
}

