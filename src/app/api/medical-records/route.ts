// app/api/medical-records/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllMedicalRecords, createMedicalRecord } from '@/lib/db_utils';
import { auth } from '@/auth';
import { logAuditEvent } from '@/lib/auditLogger';
import { getClientIP } from '@/lib/rateLimit';
import { getPatientIdByUserEmail } from '@/lib/db_utils';

// GET - جلب جميع السجلات الطبية
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId') ? Number(searchParams.get('patientId')) : undefined;
    const doctorId = searchParams.get('doctorId') ? Number(searchParams.get('doctorId')) : undefined;

    const session = await auth();
    const currentUserId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.roleId;
    const isAdmin = (session?.user as any)?.isAdmin;

    let finalPatientId = patientId;

    // إذا كان المستخدم مريض، احصل على patient_id من user_id
    if (userRole === 216 && currentUserId) {
      const userEmail = (session?.user as any)?.email;
      if (userEmail) {
        try {
          const userPatientId = await getPatientIdByUserEmail(userEmail);
          if (userPatientId) {
            finalPatientId = userPatientId;
          } else {
            // إذا لم يكن للمريض سجل، أرجع مصفوفة فارغة
            return NextResponse.json([]);
          }
        } catch (error) {
          console.error('Error getting patient ID:', error);
          return NextResponse.json([]);
        }
      } else {
        return NextResponse.json([]);
      }
    }

    const records = await getAllMedicalRecords({
      patientId: finalPatientId,
      doctorId,
      currentUserId,
      userRole,
      isAdmin,
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching medical records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medical records' },
      { status: 500 }
    );
  }
}

// POST - إضافة سجل طبي جديد
export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.roleId;
  const isAdmin = (session?.user as any)?.isAdmin;
  const ip = getClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const body = await request.json();

    // التحقق من الصلاحيات: فقط الأطباء والأدمن والسوبر أدمن يمكنهم إضافة سجلات
    if (userRole !== 213 && userRole !== 212 && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only doctors and admins can create medical records' },
        { status: 403 }
      );
    }

    // إذا كان المستخدم دكتور، استخدم ID الخاص به كـ doctor_id
    const doctorId = userRole === 213 ? Number(userId) : Number(body.doctor_id);

    if (!body.patient_id) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    const id = await createMedicalRecord({
      ...body,
      doctor_id: doctorId,
    });

    // Log successful creation
    await logAuditEvent({
      user_id: userId,
      action: 'create',
      resource: 'MedicalRecord',
      resource_id: Number(id),
      ip_address: ip,
      user_agent: userAgent,
      status: 'success',
      details: `Created medical record for patient ID: ${body.patient_id}`,
    });

    return NextResponse.json(
      {
        message: 'تم إضافة السجل الطبي بنجاح',
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
      resource: 'MedicalRecord',
      ip_address: ip,
      user_agent: userAgent,
      status: 'failure',
      error_message: errorMessage,
    });

    console.error('خطأ في إضافة السجل الطبي:', error);
    return NextResponse.json(
      {
        error: 'فشل في إضافة السجل الطبي',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

