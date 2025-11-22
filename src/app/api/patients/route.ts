// app/api/patients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllPatients, createPatient, getPatientIdByUserEmail } from '@/lib/db_utils';
import { auth } from '@/auth';
import { logAuditEvent } from '@/lib/auditLogger';
import { getClientIP } from '@/lib/rateLimit';

// GET - جلب جميع المرضى
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const specialty = searchParams.get('specialty') || undefined;
    const identificationNumber = searchParams.get('identificationNumber') || undefined;

    // Get current user session
    const session = await auth();
    let finalDoctorId = doctorId ? Number(doctorId) : undefined;
    let patientId = undefined;

    // If user is a patient (role ID 216), filter patients to only show their own data
    if (session?.user?.roleId === 216 && session?.user?.email) {
      console.log('🔍 Patient user detected:', session.user.email, 'Role ID:', session.user.roleId);
      const userPatientId = await getPatientIdByUserEmail(session.user.email);
      console.log('🔍 Patient ID lookup result:', userPatientId);
      if (userPatientId) {
        // For patients, we need to get their own patient record
        // We'll modify the getAllPatients function to support filtering by patient ID
        patientId = userPatientId;
        console.log('🔍 Filtering by patient ID:', patientId);
      } else {
        console.log('⚠️ No patient record found for email:', session.user.email);
        console.log('🔍 Returning empty array for patient without record');
        // If patient user has no patient record, return empty array
        return NextResponse.json([]);
      }
    } else {
      console.log('🔍 User is not a patient. Role ID:', session?.user?.roleId, 'Email:', session?.user?.email);
    }

    const patients = await getAllPatients({
      doctorId: finalDoctorId,
      specialty,
      identificationNumber,
      patientId, // Add patientId filter
    });
    
    console.log('🔍 Retrieved patients count:', patients?.length || 0);
    if (session?.user?.roleId === 216) {
      console.log('🔍 Patient user should see only their own data. Filter applied:', !!patientId);
    }
    
    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

// POST - إضافة مريض جديد (مصحح)

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const ip = getClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const body = await request.json();
    console.log('بيانات المريض المستلمة:', body);

    // قم بمعالجة التاريخ هنا قبل تمريره إلى دالة createPatient
    if (body.dateOfBirth) {
      // تحويل السلسلة النصية إلى كائن Date
      // هذا لضمان أن الكائن لديه النوع الصحيح للمتغير
      body.dateOfBirth = new Date(body.dateOfBirth);
    }

    const id = await createPatient(body);

    // Log successful creation
    await logAuditEvent({
      user_id: userId,
      action: 'create',
      resource: 'Patient',
      resource_id: Number(id), // Ensure it's a number
      ip_address: ip,
      user_agent: userAgent,
      status: 'success',
      details: `Created patient: ${body.name || body.NAME || 'unknown'}`,
    });

    return NextResponse.json(
      {
        message: 'تم إضافة المريض بنجاح',
        id: id
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log failure
    await logAuditEvent({
      user_id: userId,
      action: 'create',
      resource: 'Patient',
      ip_address: ip,
      user_agent: userAgent,
      status: 'failure',
      error_message: errorMessage,
    });

    console.error('خطأ في إضافة المريض:', error);
    return NextResponse.json(
      {
        error: 'فشل في إضافة المريض',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}