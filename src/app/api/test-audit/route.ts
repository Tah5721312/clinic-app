import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/auditLogger';
import { getClientIP } from '@/lib/rateLimit';
import { auth } from '@/auth';

/**
 * Test endpoint to verify audit logging is working
 * GET /api/test-audit
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const ip = getClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    // Test logging
    await logAuditEvent({
      user_id: userId,
      action: 'test',
      resource: 'Test',
      ip_address: ip,
      user_agent: userAgent,
      status: 'success',
      details: 'Testing audit logger functionality',
    });

    return NextResponse.json({
      success: true,
      message: 'Audit log test completed. Check console for details.',
      userId,
      ip,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

