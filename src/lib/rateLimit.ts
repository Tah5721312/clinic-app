/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated rate limiting service
 */

import type { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
}

const defaultOptions: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
};

/**
 * Rate limit middleware
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param options - Rate limit options
 * @returns Object with allowed status and remaining requests
 */
export function rateLimit(
  identifier: string,
  options: RateLimitOptions = defaultOptions
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  const record = store[key];

  // Clean up expired records periodically (every 1000 requests)
  if (Math.random() < 0.001) {
    Object.keys(store).forEach((k) => {
      if (store[k].resetTime < now) {
        delete store[k];
      }
    });
  }

  if (!record || record.resetTime < now) {
    // Create new record or reset expired one
    store[key] = {
      count: 1,
      resetTime: now + options.windowMs,
    };
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetTime: now + options.windowMs,
    };
  }

  if (record.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: options.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Get client IP address from request headers
 * Handles IPv4, IPv6, and localhost addresses
 */
export function getClientIP(headers: Headers): string {
  // Check various headers for IP address (in order of preference)
  
  // 1. X-Forwarded-For (most common in proxies/load balancers)
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    // Get the first non-localhost IP
    for (const ip of ips) {
      if (ip && ip !== '::1' && ip !== '127.0.0.1' && ip !== 'localhost') {
        return ip;
      }
    }
    // If all are localhost, return 'localhost' instead of ::1
    return 'localhost';
  }

  // 2. X-Real-IP (nginx proxy)
  const realIP = headers.get('x-real-ip');
  if (realIP && realIP !== '::1' && realIP !== '127.0.0.1') {
    return realIP;
  }

  // 3. CF-Connecting-IP (Cloudflare)
  const cfIP = headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP;
  }

  // 4. X-Client-IP
  const clientIP = headers.get('x-client-ip');
  if (clientIP && clientIP !== '::1' && clientIP !== '127.0.0.1') {
    return clientIP;
  }

  // 5. Check if any header contains localhost values
  // Check all headers for localhost patterns
  const allHeaders = Array.from(headers.entries());
  for (const [key, value] of allHeaders) {
    if (value && (value.includes('::1') || value.includes('127.0.0.1') || value.includes('localhost'))) {
      // If we find localhost in headers, return 'localhost'
      return 'localhost';
    }
  }

  // 6. For localhost/development, return a more descriptive value
  // ::1 is IPv6 localhost, 127.0.0.1 is IPv4 localhost
  return 'localhost';
}

