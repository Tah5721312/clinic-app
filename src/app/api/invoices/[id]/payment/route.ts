// app/api/invoices/[id]/payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateInvoicePayment, getInvoiceById } from '@/lib/db_utils';
import { auth } from '@/auth';

// PUT - تحديث حالة الدفع للفاتورة
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
    const { paid_amount, payment_method } = body;

    if (paid_amount === undefined || paid_amount < 0) {
      return NextResponse.json(
        { error: 'Invalid paid amount' },
        { status: 400 }
      );
    }

    // Get current invoice to validate
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Validate paid amount doesn't exceed total amount
    if (paid_amount > invoice.TOTAL_AMOUNT) {
      return NextResponse.json(
        { error: 'Paid amount cannot exceed total amount' },
        { status: 400 }
      );
    }

    const rowsAffected = await updateInvoicePayment(
      invoiceId,
      paid_amount,
      payment_method
    );

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'Failed to update payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'تم تحديث حالة الدفع بنجاح',
      rowsAffected,
    });
  } catch (error: unknown) {
    console.error('خطأ في تحديث حالة الدفع:', error);
    return NextResponse.json(
      {
        error: 'فشل في تحديث حالة الدفع',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
