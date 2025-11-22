// app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllAppointments, createAppointment, getPatientAppointments, getDoctorIdByUserEmail, getPatientIdByUserEmail } from '@/lib/db_utils';
import { auth } from '@/auth';
import { logAuditEvent } from '@/lib/auditLogger';
import { getClientIP } from '@/lib/rateLimit';

// GET - جلب جميع المواعيد أو مواعيد طبيب/مريض معين
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const patientId = searchParams.get('patientId');
    const specialty = searchParams.get('specialty') || undefined;
    const identificationNumber = searchParams.get('identificationNumber') || undefined;
    const invoiceNumber = searchParams.get('invoiceNumber') || undefined;
    const scheduleDate = searchParams.get('scheduleDate') || undefined;

    // Get current user session
    const session = await auth();
    let finalDoctorId = doctorId ? Number(doctorId) : undefined;
    let finalPatientId = patientId ? Number(patientId) : undefined;

    // If user is a patient (role ID 216), filter appointments to only show their own
    if (session?.user?.roleId === 216 && session?.user?.email) {
      console.log('🔍 Patient user detected for appointments:', session.user.email, 'Role ID:', session.user.roleId);
      const userPatientId = await getPatientIdByUserEmail(session.user.email);
      console.log('🔍 Patient ID lookup result for appointments:', userPatientId);
      if (userPatientId) {
        // Override any patientId parameter to ensure patient only sees their own appointments
        finalPatientId = userPatientId;
        console.log('🔍 Filtering appointments by patient ID:', finalPatientId);
      } else {
        console.log('⚠️ No patient record found for email:', session.user.email);
        console.log('🔍 Returning empty array for patient without record');
        // If patient user has no patient record, return empty array
        return NextResponse.json([]);
      }
    }

    // If user is a doctor (role ID 213), filter appointments to only show their own
    if (session?.user?.roleId === 213 && session?.user?.email) {
      const userDoctorId = await getDoctorIdByUserEmail(session.user.email);
      if (userDoctorId) {
        // Override any doctorId parameter to ensure doctor only sees their own appointments
        finalDoctorId = userDoctorId;
      }
    }

    let appointments;

    if (finalPatientId) {
      // جلب مواعيد مريض معين
      appointments = await getPatientAppointments(finalPatientId);
      console.log('🔍 Retrieved appointments for patient ID:', finalPatientId, 'Count:', appointments?.length || 0);
    } else {
      // جلب جميع المواعيد مع الفلاتر
      appointments = await getAllAppointments({
        doctorId: finalDoctorId,
        specialty,
        identificationNumber,
        invoiceNumber,
        scheduleDate,
      });
      console.log('🔍 Retrieved all appointments. Count:', appointments?.length || 0);
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
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const ip = getClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') || undefined;

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
      // Log failure
      await logAuditEvent({
        user_id: userId,
        action: 'create',
        resource: 'Appointment',
        ip_address: ip,
        user_agent: userAgent,
        status: 'failure',
        error_message: 'Invalid response from database: missing ID',
      });

      return NextResponse.json(
        { error: 'Invalid response from database: missing ID' },
        { status: 500 }
      );
    }

    const id = result.outBinds.id[0];

    // Log successful creation
    await logAuditEvent({
      user_id: userId,
      action: 'create',
      resource: 'Appointment',
      resource_id: Number(id), // Ensure it's a number
      ip_address: ip,
      user_agent: userAgent,
      status: 'success',
      details: `Created appointment for patient ${body.patientId || 'unknown'} with doctor ${body.doctorId || 'unknown'}`,
    });

    return NextResponse.json(
      { message: 'Appointment created successfully', id },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log failure
    await logAuditEvent({
      user_id: userId,
      action: 'create',
      resource: 'Appointment',
      ip_address: ip,
      user_agent: userAgent,
      status: 'failure',
      error_message: errorMessage,
    });

    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}