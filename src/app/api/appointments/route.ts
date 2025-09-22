// app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllAppointments, createAppointment, getPatientAppointments } from '@/lib/db_utils';

// GET - جلب جميع المواعيد أو مواعيد طبيب/مريض معين
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const patientId = searchParams.get('patientId');
    const specialty = searchParams.get('specialty') || undefined;
    const identificationNumber = searchParams.get('identificationNumber') || undefined;

    let appointments;

    if (patientId) {
      // جلب مواعيد مريض معين
      appointments = await getPatientAppointments(Number(patientId));
    } else {
      // جلب جميع المواعيد مع الفلاتر
      appointments = await getAllAppointments({
        doctorId: doctorId ? Number(doctorId) : undefined,
        specialty,
        identificationNumber,
      });
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

    if (body.schedule && typeof body.schedule === 'string') {
      body.schedule = new Date(body.schedule);
    }

    const result = await createAppointment(body) as {
      outBinds?: {
        id?: number[];
      };
    };

    if (!result.outBinds?.id || result.outBinds.id.length === 0) {
      return NextResponse.json(
        { error: 'Invalid response from database: missing ID' },
        { status: 500 }
      );
    }

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