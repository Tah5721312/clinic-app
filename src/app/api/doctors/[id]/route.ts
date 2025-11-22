// app/api/doctors/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDoctorById, updateDoctor, deleteDoctor, deleteDoctorWithTransaction } from '@/lib/db_utils';
import { executeQuery } from '@/lib/database';
import { logAuditEvent } from '@/lib/auditLogger';
import { getClientIP } from '@/lib/rateLimit';
import { auth } from '@/auth';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET - جلب طبيب محدد
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const doctor = await getDoctorById(Number(id));

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(doctor);
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctor' },
      { status: 500 }
    );
  }
}


// PUT - تحديث طبيب
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const ip = getClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const { id } = await params;
    const body = await request.json();

    // التحقق من أن الـ ID صحيح
    if (isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid doctor ID' },
        { status: 400 }
      );
    }

    // التحقق من وجود حقول للتحديث
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // التحقق من صحة البريد الإلكتروني إذا كان موجوداً
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    const rowsAffected = await updateDoctor(Number(id), body);

    if (rowsAffected === 0) {
      // Log failure
      await logAuditEvent({
        user_id: userId,
        action: 'update',
        resource: 'Doctor',
        resource_id: Number(id),
        ip_address: ip,
        user_agent: userAgent,
        status: 'failure',
        error_message: 'Doctor not found or no changes made',
      });

      return NextResponse.json(
        { error: 'Doctor not found or no changes made' },
        { status: 404 }
      );
    }

    // Log successful update
    await logAuditEvent({
      user_id: userId,
      action: 'update',
      resource: 'Doctor',
      resource_id: Number(id),
      ip_address: ip,
      user_agent: userAgent,
      status: 'success',
      details: `Updated doctor: ${Object.keys(body).join(', ')}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Doctor updated successfully',
      rowsAffected
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log failure
    await logAuditEvent({
      user_id: userId,
      action: 'update',
      resource: 'Doctor',
      resource_id: Number((await params).id),
      ip_address: ip,
      user_agent: userAgent,
      status: 'failure',
      error_message: errorMessage,
    });

    console.error('Error updating doctor:', error);

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

    // التحقق إذا كان الخطأ بسبب عدم وجود حقول للتحديث
    if (errorMessage.includes('No fields to update')) {
      return NextResponse.json(
        {
          error: 'No fields to update',
          details: 'Please provide at least one field to update'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to update doctor',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

// DELETE - حذف طبيب
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const ip = getClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const { id } = await params;
    const doctorId = Number(id);

    // Get doctor info before deletion
    const doctor = await getDoctorById(doctorId);

    const rowsAffected = await deleteDoctor(doctorId);

    if (rowsAffected === 0) {
      // Log failure
      await logAuditEvent({
        user_id: userId,
        action: 'delete',
        resource: 'Doctor',
        resource_id: doctorId,
        ip_address: ip,
        user_agent: userAgent,
        status: 'failure',
        error_message: 'Doctor not found',
      });

      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Log successful deletion
    await logAuditEvent({
      user_id: userId,
      action: 'delete',
      resource: 'Doctor',
      resource_id: doctorId,
      ip_address: ip,
      user_agent: userAgent,
      status: 'success',
      details: `Deleted doctor: ${doctor?.NAME || doctorId}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Doctor deleted successfully'
    });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log failure
    await logAuditEvent({
      user_id: userId,
      action: 'delete',
      resource: 'Doctor',
      resource_id: Number((await params).id),
      ip_address: ip,
      user_agent: userAgent,
      status: 'failure',
      error_message: error?.errorNum === 2292 
        ? 'Cannot delete doctor with associated appointments'
        : errorMessage,
    });

    console.error('Error deleting doctor:', error);

    if (error?.errorNum === 2292) {
      return NextResponse.json(
        {
          success: false,
          cannotDelete: true,
          message: 'لا يمكن الحذف قبل حذف المواعيد المرتبطة بالدكتور'
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete doctor'
      },
      { status: 500 }
    );
  }
}