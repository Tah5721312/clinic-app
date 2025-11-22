// app/api/invoices/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  updateInvoicePayment,
} from '@/lib/db_utils';
import { auth } from '@/auth';
import { logAuditEvent } from '@/lib/auditLogger';
import { getClientIP } from '@/lib/rateLimit';

// GET - جلب فاتورة محددة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoiceId = Number(id);

    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    const invoice = await getInvoiceById(invoiceId);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

// PUT - تحديث فاتورة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const ip = getClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const { id } = await params;
    const invoiceId = Number(id);

    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    // Get current invoice to check payment status
    const currentInvoice = await getInvoiceById(invoiceId);
    
    if (!currentInvoice) {
      // Log failure
      await logAuditEvent({
        user_id: userId,
        action: 'update',
        resource: 'Invoice',
        resource_id: invoiceId,
        ip_address: ip,
        user_agent: userAgent,
        status: 'failure',
        error_message: 'Invoice not found',
      });

      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Get session to check if user is super admin
    const isSuperAdmin = session?.user?.isAdmin || session?.user?.roleId === 211;

    // Prevent editing if invoice is paid (unless super admin)
    if (currentInvoice.PAYMENT_STATUS === 'paid' && !isSuperAdmin) {
      // Log failure - permission denied
      await logAuditEvent({
        user_id: userId,
        action: 'update',
        resource: 'Invoice',
        resource_id: invoiceId,
        ip_address: ip,
        user_agent: userAgent,
        status: 'failure',
        error_message: 'Cannot edit a fully paid invoice',
      });

      return NextResponse.json(
        { error: 'Cannot edit a fully paid invoice' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('بيانات تحديث الفاتورة المستلمة:', body);

    const rowsAffected = await updateInvoice(invoiceId, body);

    if (rowsAffected === 0) {
      // Log failure
      await logAuditEvent({
        user_id: userId,
        action: 'update',
        resource: 'Invoice',
        resource_id: invoiceId,
        ip_address: ip,
        user_agent: userAgent,
        status: 'failure',
        error_message: 'Invoice not found or no changes made',
      });

      return NextResponse.json(
        { error: 'Invoice not found or no changes made' },
        { status: 404 }
      );
    }

    // Log successful update
    await logAuditEvent({
      user_id: userId,
      action: 'update',
      resource: 'Invoice',
      resource_id: invoiceId,
      ip_address: ip,
      user_agent: userAgent,
      status: 'success',
      details: `Updated invoice: ${Object.keys(body).join(', ')}`,
    });

    return NextResponse.json({
      message: 'تم تحديث الفاتورة بنجاح',
      rowsAffected,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log failure
    await logAuditEvent({
      user_id: userId,
      action: 'update',
      resource: 'Invoice',
      resource_id: Number((await params).id),
      ip_address: ip,
      user_agent: userAgent,
      status: 'failure',
      error_message: errorMessage,
    });

    console.error('خطأ في تحديث الفاتورة:', error);
    return NextResponse.json(
      {
        error: 'فشل في تحديث الفاتورة',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// DELETE - حذف فاتورة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const ip = getClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const { id } = await params;
    const invoiceId = Number(id);

    if (isNaN(invoiceId)) {
      // Log failure
      await logAuditEvent({
        user_id: userId,
        action: 'delete',
        resource: 'Invoice',
        resource_id: invoiceId,
        ip_address: ip,
        user_agent: userAgent,
        status: 'failure',
        error_message: 'Invalid invoice ID',
      });

      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    // Get session to check if user is super admin
    const isSuperAdmin = session?.user?.isAdmin || (session?.user as any)?.roleId === 211;

    // Only Super Admin can delete invoices
    if (!isSuperAdmin) {
      // Log failure - permission denied
      await logAuditEvent({
        user_id: userId,
        action: 'delete',
        resource: 'Invoice',
        resource_id: invoiceId,
        ip_address: ip,
        user_agent: userAgent,
        status: 'failure',
        error_message: 'Only Super Admin can delete invoices',
      });

      return NextResponse.json(
        { error: 'Only Super Admin can delete invoices' },
        { status: 403 }
      );
    }

    // Get invoice info before deletion
    const invoice = await getInvoiceById(invoiceId);

    const rowsAffected = await deleteInvoice(invoiceId);

    if (rowsAffected === 0) {
      // Log failure
      await logAuditEvent({
        user_id: userId,
        action: 'delete',
        resource: 'Invoice',
        resource_id: invoiceId,
        ip_address: ip,
        user_agent: userAgent,
        status: 'failure',
        error_message: 'Invoice not found',
      });

      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Log successful deletion
    await logAuditEvent({
      user_id: userId,
      action: 'delete',
      resource: 'Invoice',
      resource_id: invoiceId,
      ip_address: ip,
      user_agent: userAgent,
      status: 'success',
      details: `Deleted invoice for patient ${invoice?.PATIENT_ID || 'unknown'}`,
    });

    return NextResponse.json({
      message: 'تم حذف الفاتورة بنجاح',
      rowsAffected,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log failure
    await logAuditEvent({
      user_id: userId,
      action: 'delete',
      resource: 'Invoice',
      resource_id: Number((await params).id),
      ip_address: ip,
      user_agent: userAgent,
      status: 'failure',
      error_message: errorMessage,
    });

    console.error('خطأ في حذف الفاتورة:', error);
    return NextResponse.json(
      {
        error: 'فشل في حذف الفاتورة',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
