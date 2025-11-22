// app/api/appointments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAppointmentById, updateAppointment, deleteAppointment, updateAppointmentStatus } from '@/lib/db_utils';
import { auth } from '@/auth';
import { logAuditEvent } from '@/lib/auditLogger';
import { getClientIP } from '@/lib/rateLimit';

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
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const ip = getClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    // ✅ Await params per Next.js requirement
    const { id } = await params;
    const body = await request.json();

    // ✅ Solution for schedule.toISOString error
    if (body.schedule && typeof body.schedule === 'string') {
      body.schedule = new Date(body.schedule);
    }

    // Get current appointment to compare with update data
    const currentAppointment = await getAppointmentById(Number(id));
    if (!currentAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Get session to check if user is super admin
    const session = await auth();
    const isSuperAdmin = session?.user?.isAdmin || session?.user?.roleId === 211;

    // Prevent editing if appointment payment status is paid (unless super admin)
    if (currentAppointment.PAYMENT_STATUS === 'paid' && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Cannot edit a fully paid appointment' },
        { status: 403 }
      );
    }

    // Only include fields that have actually changed
    const updateData: any = {};
    
    if (body.patient_id !== undefined && body.patient_id !== currentAppointment.PATIENT_ID) {
      updateData.patient_id = body.patient_id;
    }
    
    if (body.doctor_id !== undefined && body.doctor_id !== currentAppointment.DOCTOR_ID) {
      updateData.doctor_id = body.doctor_id;
    }
    
    if (body.schedule !== undefined) {
      const currentSchedule = new Date(currentAppointment.SCHEDULE);
      const newSchedule = new Date(body.schedule);
      if (currentSchedule.getTime() !== newSchedule.getTime()) {
        updateData.schedule = body.schedule;
      }
    }
    
    if (body.reason !== undefined && body.reason !== currentAppointment.REASON) {
      updateData.reason = body.reason;
    }
    
    if (body.note !== undefined && body.note !== (currentAppointment.NOTE || '')) {
      updateData.note = body.note;
    }
    
    if (body.status !== undefined && body.status !== currentAppointment.STATUS) {
      updateData.status = body.status;
    }
    
    if (body.cancellationReason !== undefined && body.cancellationReason !== (currentAppointment.CANCELLATIONREASON || '')) {
      updateData.cancellationReason = body.cancellationReason;
    }
    
    if (body.appointment_type !== undefined && body.appointment_type !== (currentAppointment.APPOINTMENT_TYPE || 'consultation')) {
      updateData.appointment_type = body.appointment_type;
    }
    
    if (body.payment_status !== undefined && body.payment_status !== (currentAppointment.PAYMENT_STATUS || 'unpaid')) {
      updateData.payment_status = body.payment_status;
    }
    
    if (body.payment_amount !== undefined && body.payment_amount !== (currentAppointment.PAYMENT_AMOUNT || 0)) {
      updateData.payment_amount = body.payment_amount;
    }

    console.log('Filtered update data:', updateData);

    // If no fields to update, return success
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No changes to update' });
    }

    const rowsAffected = await updateAppointment(Number(id), updateData);

    if (rowsAffected === 0) {
      // Log failure - appointment not found
      await logAuditEvent({
        user_id: userId,
        action: 'update',
        resource: 'Appointment',
        resource_id: Number(id),
        ip_address: ip,
        user_agent: userAgent,
        status: 'failure',
        error_message: 'Appointment not found',
      });

      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Log successful update
    await logAuditEvent({
      user_id: userId,
      action: 'update',
      resource: 'Appointment',
      resource_id: Number(id),
      ip_address: ip,
      user_agent: userAgent,
      status: 'success',
      details: `Updated appointment: ${Object.keys(updateData).join(', ')}`,
    });

    return NextResponse.json({ message: 'Appointment updated successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log failure
    await logAuditEvent({
      user_id: userId,
      action: 'update',
      resource: 'Appointment',
      resource_id: Number((await params).id),
      ip_address: ip,
      user_agent: userAgent,
      status: 'failure',
      error_message: errorMessage,
    });

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
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const ip = getClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const { id } = await params;
    const appointmentId = Number(id);

    // Get current appointment to check status and payment
    const currentAppointment = await getAppointmentById(appointmentId);
    
    if (!currentAppointment) {
      // Log failure - appointment not found
      await logAuditEvent({
        user_id: userId,
        action: 'delete',
        resource: 'Appointment',
        resource_id: appointmentId,
        ip_address: ip,
        user_agent: userAgent,
        status: 'failure',
        error_message: 'Appointment not found',
      });

      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Get session to check if user is super admin
    const isSuperAdmin = session?.user?.isAdmin || (session?.user as any)?.roleId === 211;

    // Check if appointment can be deleted
    const canDelete =
      isSuperAdmin ||
      currentAppointment.STATUS === 'cancelled' ||
      (currentAppointment.STATUS === 'pending' && (currentAppointment.PAYMENT_STATUS || 'unpaid') === 'unpaid');

    if (!canDelete) {
      // Log failure - permission denied
      await logAuditEvent({
        user_id: userId,
        action: 'delete',
        resource: 'Appointment',
        resource_id: appointmentId,
        ip_address: ip,
        user_agent: userAgent,
        status: 'failure',
        error_message: 'Cannot delete this appointment. Only cancelled appointments or unpaid pending appointments can be deleted.',
      });

      return NextResponse.json(
        { error: 'Cannot delete this appointment. Only cancelled appointments or unpaid pending appointments can be deleted.' },
        { status: 403 }
      );
    }

    const rowsAffected = await deleteAppointment(appointmentId);

    if (rowsAffected === 0) {
      // Log failure - deletion failed
      await logAuditEvent({
        user_id: userId,
        action: 'delete',
        resource: 'Appointment',
        resource_id: appointmentId,
        ip_address: ip,
        user_agent: userAgent,
        status: 'failure',
        error_message: 'Deletion failed - no rows affected',
      });

      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Log successful deletion
    await logAuditEvent({
      user_id: userId,
      action: 'delete',
      resource: 'Appointment',
      resource_id: appointmentId,
      ip_address: ip,
      user_agent: userAgent,
      status: 'success',
      details: `Deleted appointment for patient ${currentAppointment.PATIENT_ID} with doctor ${currentAppointment.DOCTOR_ID}`,
    });

    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log failure
    await logAuditEvent({
      user_id: userId,
      action: 'delete',
      resource: 'Appointment',
      resource_id: Number((await params).id),
      ip_address: ip,
      user_agent: userAgent,
      status: 'failure',
      error_message: errorMessage,
    });

    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}
