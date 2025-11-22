// app/api/doctors/route.ts - النسخة المحسنة
import { NextRequest, NextResponse } from 'next/server';
import { createDoctor, getAllDoctors } from '@/lib/db_utils';
import { logAuditEvent } from '@/lib/auditLogger';
import { getClientIP } from '@/lib/rateLimit';
import { auth } from '@/auth';

// GET - جلب جميع الأطباء
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty') || undefined;
    const doctors = await getAllDoctors(specialty);
    return NextResponse.json(doctors);
  } catch (error: unknown) {
    console.error('Error fetching doctors:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch doctors: ' + errorMessage },
      { status: 500 }
    );
  }
}

// POST - إضافة طبيب جديد
export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const ip = getClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const body = await request.json();

    // التحقق من البيانات المطلوبة
    if (!body.name || !body.email || !body.phone || !body.specialty) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: 'Name, email, phone, and specialty are required'
        },
        { status: 400 }
      );
    }

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // التحقق من صحة سعر الكشف إذا تم توفيره
    if (body.consultation_fee !== undefined && (isNaN(body.consultation_fee) || body.consultation_fee < 0)) {
      return NextResponse.json(
        { error: 'Invalid consultation fee. Must be a positive number.' },
        { status: 400 }
      );
    }

    // التحقق من صحة حالة التوفر إذا تم توفيرها
    if (body.is_available !== undefined && ![0, 1].includes(body.is_available)) {
      return NextResponse.json(
        { error: 'Invalid availability status. Must be 0 or 1.' },
        { status: 400 }
      );
    }

    const id = await createDoctor(body);

    // Log successful creation
    await logAuditEvent({
      user_id: userId,
      action: 'create',
      resource: 'Doctor',
      resource_id: Number(id),
      ip_address: ip,
      user_agent: userAgent,
      status: 'success',
      details: `Created doctor: ${body.name || 'unknown'}`,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Doctor added successfully',
        id: id,
        data: body
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log failure
    await logAuditEvent({
      user_id: userId,
      action: 'create',
      resource: 'Doctor',
      ip_address: ip,
      user_agent: userAgent,
      status: 'failure',
      error_message: errorMessage,
    });

    console.error('Error adding doctor:', error);

    // التحقق إذا كان الخطأ بسبب تكرار بيانات
    if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate')) {
      return NextResponse.json(
        {
          error: 'Duplicate entry',
          details: 'A doctor with this email or phone already exists'
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to add doctor',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}