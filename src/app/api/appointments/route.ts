// app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllAppointments, createAppointment, getPatientAppointments } from '@/lib/db_utils';

// GET - جلب جميع المواعيد أو مواعيد طبيب/مريض معين
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const patientId = searchParams.get('patientId');
    
    let appointments;
    
    if (doctorId) {
      // جلب مواعيد طبيب معين
      appointments = await getAllAppointments(Number(doctorId));
    } else
      
    if (patientId) {
      // جلب مواعيد مريض معين
      appointments = await getPatientAppointments(Number(patientId));
    } else {
      // جلب جميع المواعيد
      appointments = await getAllAppointments();
    }
    
    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}


// POST - إنشاء موعد جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ✅ Add this line to convert the schedule string to a Date object
    if (body.schedule && typeof body.schedule === 'string') {
      body.schedule = new Date(body.schedule);
    }
    
    const result = await createAppointment(body);
    const id = result.outBinds.id[0];
    
    return NextResponse.json(
      { message: 'Appointment created successfully', id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}