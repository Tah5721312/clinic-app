import { NextResponse } from 'next/server';

export async function GET() {
  // Return 204 No Content to indicate no service worker
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}


