// app/api/appointments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAppointmentById, updateAppointment, deleteAppointment } from '@/lib/db_utils';

interface Params {
  params: {
    id: string;
  };
}

// GET - جلب موعد محدد
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
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
    // ✅ Solution for Next.js params warning
    const id = params.id; 
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
// DELETE - حذف موعد
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    
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