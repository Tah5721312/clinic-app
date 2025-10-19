// app/api/doctors/[id]/schedule/[scheduleId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateDoctorSchedule, deleteDoctorSchedule } from '@/lib/db_utils';
import { auth } from '@/auth';

interface Params {
  params: Promise<{
    id: string;
    scheduleId: string;
  }>;
}

// PUT - تحديث جدول زمني للطبيب
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id, scheduleId } = await params;
    const doctorId = Number(id);
    const scheduleIdNum = Number(scheduleId);
    const body = await request.json();

    if (isNaN(doctorId) || isNaN(scheduleIdNum)) {
      return NextResponse.json(
        { error: 'Invalid doctor ID or schedule ID' },
        { status: 400 }
      );
    }

    // Check if user has permission to update schedules
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin or the doctor themselves
    const isAdmin = session.user.roleId === 211 || session.user.roleId === 212;
    const isDoctor = session.user.roleId === 213;
    
    if (!isAdmin && !isDoctor) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Validate fields if provided
    if (body.day_of_week !== undefined && (body.day_of_week < 1 || body.day_of_week > 7)) {
      return NextResponse.json(
        { error: 'Invalid day_of_week. Must be between 1-7' },
        { status: 400 }
      );
    }

    // Validate time format if provided
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (body.start_time && !timeRegex.test(body.start_time)) {
      return NextResponse.json(
        { error: 'Invalid start_time format. Use HH:MM format' },
        { status: 400 }
      );
    }
    if (body.end_time && !timeRegex.test(body.end_time)) {
      return NextResponse.json(
        { error: 'Invalid end_time format. Use HH:MM format' },
        { status: 400 }
      );
    }

    // Validate time order if both times are provided
    if (body.start_time && body.end_time && body.start_time >= body.end_time) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      );
    }

    // Validate slot duration
    if (body.slot_duration !== undefined && (body.slot_duration <= 0 || body.slot_duration > 480)) {
      return NextResponse.json(
        { error: 'Invalid slot_duration. Must be between 1-480 minutes' },
        { status: 400 }
      );
    }

    // Validate is_available
    if (body.is_available !== undefined && ![0, 1].includes(body.is_available)) {
      return NextResponse.json(
        { error: 'Invalid is_available. Must be 0 or 1' },
        { status: 400 }
      );
    }

    const updateData = {
      day_of_week: body.day_of_week,
      start_time: body.start_time,
      end_time: body.end_time,
      slot_duration: body.slot_duration,
      is_available: body.is_available
    };

    console.log('Updating schedule:', scheduleIdNum, 'with data:', updateData);
    const rowsAffected = await updateDoctorSchedule(scheduleIdNum, updateData);
    console.log('Rows affected:', rowsAffected);

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'Schedule not found or no changes made' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule updated successfully',
      rowsAffected
    });

  } catch (error) {
    console.error('Error updating doctor schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update doctor schedule' },
      { status: 500 }
    );
  }
}

// DELETE - حذف جدول زمني للطبيب
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id, scheduleId } = await params;
    const doctorId = Number(id);
    const scheduleIdNum = Number(scheduleId);

    if (isNaN(doctorId) || isNaN(scheduleIdNum)) {
      return NextResponse.json(
        { error: 'Invalid doctor ID or schedule ID' },
        { status: 400 }
      );
    }

    // Check if user has permission to delete schedules
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin or the doctor themselves
    const isAdmin = session.user.roleId === 211 || session.user.roleId === 212;
    const isDoctor = session.user.roleId === 213;
    
    if (!isAdmin && !isDoctor) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const rowsAffected = await deleteDoctorSchedule(scheduleIdNum);

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting doctor schedule:', error);
    return NextResponse.json(
      { error: 'Failed to delete doctor schedule' },
      { status: 500 }
    );
  }
}
