// app/api/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getAllInvoices,
  createInvoice,
  getMonthlyRevenue,
  getPatientIdByUserEmail,
  getDoctorIdByUserEmail,
} from '@/lib/db_utils';
import { auth } from '@/auth';
import { logAuditEvent } from '@/lib/auditLogger';
import { getClientIP } from '@/lib/rateLimit';

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
    let finalPatientId = patientId ? Number(patientId) : undefined;
    let finalDoctorId = doctorId ? Number(doctorId) : undefined;

    // If user is a patient (role ID 216), filter invoices to only show their own
    if (session?.user?.roleId === 216 && session?.user?.email) {
      console.log('🔍 Patient user detected for invoices:', session.user.email, 'Role ID:', session.user.roleId);
      const userPatientId = await getPatientIdByUserEmail(session.user.email);
      console.log('🔍 Patient ID lookup result for invoices:', userPatientId);
      if (userPatientId) {
        // Override any patientId parameter to ensure patient only sees their own invoices
        finalPatientId = userPatientId;
        console.log('🔍 Filtering invoices by patient ID:', finalPatientId);
      } else {
        console.log('⚠️ No patient record found for email:', session.user.email);
        console.log('🔍 Returning empty array for patient without record');
        // If patient user has no patient record, return empty array
        return NextResponse.json([]);
      }
    }

    // If user is a doctor (role ID 213), filter invoices to only show their own
    if (session?.user?.roleId === 213 && session?.user?.email) {
      console.log('🔍 Doctor user detected for invoices:', session.user.email, 'Role ID:', session.user.roleId);
      const userDoctorId = await getDoctorIdByUserEmail(session.user.email);
      console.log('🔍 Doctor ID lookup result for invoices:', userDoctorId);
      if (userDoctorId) {
        // Override any doctorId parameter to ensure doctor only sees their own invoices
        finalDoctorId = userDoctorId;
        console.log('🔍 Filtering invoices by doctor ID:', finalDoctorId);
      } else {
        console.log('⚠️ No doctor record found for email:', session.user.email);
        console.log('🔍 Returning empty array for doctor without record');
        // If doctor user has no doctor record, return empty array
        return NextResponse.json([]);
      }
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
      doctor_id: finalDoctorId,
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
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const ip = getClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const body = await request.json();
    console.log('بيانات الفاتورة المستلمة:', body);

    const createdBy = userId !== undefined ? Number(userId) : undefined;
    const invoiceId = await createInvoice(body, createdBy);

    // Log successful creation
    await logAuditEvent({
      user_id: userId,
      action: 'create',
      resource: 'Invoice',
      resource_id: Number(invoiceId),
      ip_address: ip,
      user_agent: userAgent,
      status: 'success',
      details: `Created invoice for patient ${body.patient_id || 'unknown'}`,
    });

    return NextResponse.json(
      {
        message: 'تم إضافة الفاتورة بنجاح',
        id: invoiceId,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log failure
    await logAuditEvent({
      user_id: userId,
      action: 'create',
      resource: 'Invoice',
      ip_address: ip,
      user_agent: userAgent,
      status: 'failure',
      error_message: errorMessage,
    });

    console.error('خطأ في إضافة الفاتورة:', error);
    return NextResponse.json(
      {
        error: 'فشل في إضافة الفاتورة',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
