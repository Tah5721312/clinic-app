// app/api/invoices/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  updateInvoicePayment,
} from '@/lib/db_utils';
import { auth } from '@/auth';

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
  try {
    const { id } = await params;
    const invoiceId = Number(id);

    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('بيانات تحديث الفاتورة المستلمة:', body);

    const rowsAffected = await updateInvoice(invoiceId, body);

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'Invoice not found or no changes made' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'تم تحديث الفاتورة بنجاح',
      rowsAffected,
    });
  } catch (error: unknown) {
    console.error('خطأ في تحديث الفاتورة:', error);
    return NextResponse.json(
      {
        error: 'فشل في تحديث الفاتورة',
        details: error instanceof Error ? error.message : 'Unknown error',
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
  try {
    const { id } = await params;
    const invoiceId = Number(id);

    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    const rowsAffected = await deleteInvoice(invoiceId);

    if (rowsAffected === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'تم حذف الفاتورة بنجاح',
      rowsAffected,
    });
  } catch (error: unknown) {
    console.error('خطأ في حذف الفاتورة:', error);
    return NextResponse.json(
      {
        error: 'فشل في حذف الفاتورة',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
