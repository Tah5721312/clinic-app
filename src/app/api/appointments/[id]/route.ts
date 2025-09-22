// app/api/appointments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAppointmentById, updateAppointment, deleteAppointment, updateAppointmentStatus } from '@/lib/db_utils';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET - جلب موعد محدد
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const appointment = await getAppointmentById(Number(id));

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}



// PUT - تحديث موعد
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    // ✅ Await params per Next.js requirement
    const { id } = await params;
    const body = await request.json();

    // ✅ Solution for schedule.toISOString error
    if (body.schedule && typeof body.schedule === 'string') {
      body.schedule = new Date(body.schedule);
    }

    const rowsAffected = await updateAppointment(Number(id), body);

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Appointment updated successfully' });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}



// PATCH - تحديث حالة الموعد (للإلغاء مثلاً)/ PATCH - تحديث حالة الموعد فقط
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    // الحصول على معرف الموعد
    const { id } = await params;

    // التحقق من صحة معرف الموعد
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid appointment ID' },
        { status: 400 }
      );
    }

    // قراءة البيانات من الطلب
    const body = await request.json();

    // التحقق من وجود حالة للتحديث
    if (!body.status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // التحقق من صحة قيمة الحالة
    const validStatuses = ['scheduled', 'pending', 'cancelled', 'completed', 'confirmed'];
    const normalizedStatus = String(body.status).toLowerCase();
    if (!validStatuses.includes(normalizedStatus)) {
      return NextResponse.json(
        { error: 'Invalid status value. Valid values are: scheduled, pending, cancelled, completed, confirmed' },
        { status: 400 }
      );
    }

    // تحقق من وجود الموعد أولاً
    const existing = await getAppointmentById(Number(id));
    if (!existing) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // إذا كانت الحالة المطلوبة مساوية للحالية، أعد نجاح بدون تحديث
    if ((existing.STATUS || '').toLowerCase() === normalizedStatus) {
      return NextResponse.json({
        success: true,
        message: 'Appointment status already set',
        status: normalizedStatus,
        appointmentId: Number(id)
      });
    }

    // تحديث حالة الموعد فقط
    const rowsAffected = await updateAppointmentStatus(Number(id), normalizedStatus);

    return NextResponse.json({
      success: true,
      message: rowsAffected > 0 ? 'Appointment status updated successfully' : 'No changes applied',
      status: normalizedStatus,
      appointmentId: Number(id)
    });

  } catch (error) {
    console.error('Error updating appointment status:', error);
    return NextResponse.json(
      {
        error: 'Failed to update appointment status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


// DELETE - حذف موعد
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const rowsAffected = await deleteAppointment(Number(id));

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}
