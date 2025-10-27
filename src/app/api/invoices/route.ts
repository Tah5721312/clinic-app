// app/api/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getAllInvoices,
  createInvoice,
  getMonthlyRevenue,
} from '@/lib/db_utils';
import { auth } from '@/auth';

// GET - جلب جميع الفواتير
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');
    const paymentStatus = searchParams.get('payment_status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const doctorId = searchParams.get('doctor_id');
    const identificationNumber = searchParams.get('identificationNumber');
    const monthlyRevenue = searchParams.get('monthly_revenue') === 'true';

    // Get current user session
    const session = await auth();

    // If user is a patient (role ID 216), filter invoices to only show their own data
    let finalPatientId = patientId ? Number(patientId) : undefined;
    if (session?.user?.roleId === 216 && session?.user?.email) {
      // For patients, we need to get their patient ID from their email
      // This would require a function to get patient ID by user email
      // For now, we'll handle this in the frontend by passing the patient ID
      console.log(
        '🔍 Patient user detected:',
        session.user.email,
        'Role ID:',
        session.user.roleId
      );
    }

    // If requesting monthly revenue data
    if (monthlyRevenue) {
      const revenue = await getMonthlyRevenue();
      return NextResponse.json(revenue);
    }

    const filters = {
      patient_id: finalPatientId,
      payment_status: paymentStatus || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      doctor_id: doctorId ? Number(doctorId) : undefined,
      identificationNumber: identificationNumber || undefined,
    };

    const invoices = await getAllInvoices(filters);

    console.log('🔍 Retrieved invoices count:', invoices?.length || 0);

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

// POST - إضافة فاتورة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('بيانات الفاتورة المستلمة:', body);

    // Get current user session
    const session = await auth();
    const createdBy = session?.user?.id !== undefined ? Number(session.user.id) : undefined;

    const invoiceId = await createInvoice(body, createdBy);

    return NextResponse.json(
      {
        message: 'تم إضافة الفاتورة بنجاح',
        id: invoiceId,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('خطأ في إضافة الفاتورة:', error);
    return NextResponse.json(
      {
        error: 'فشل في إضافة الفاتورة',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
