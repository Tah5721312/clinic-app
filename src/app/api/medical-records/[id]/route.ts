// app/api/medical-records/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMedicalRecordById, updateMedicalRecord, deleteMedicalRecord } from '@/lib/db_utils';
import { auth } from '@/auth';
import { logAuditEvent } from '@/lib/auditLogger';
import { getClientIP } from '@/lib/rateLimit';
import { getPatientIdByUserEmail } from '@/lib/db_utils';

// GET - جلب سجل طبي محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recordId = Number(id);
    const session = await auth();
    const currentUserId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.roleId;
    const isAdmin = (session?.user as any)?.isAdmin;

    const record = await getMedicalRecordById(recordId, currentUserId, userRole, isAdmin);

    if (!record) {
      return NextResponse.json(
        { error: 'Medical record not found' },
        { status: 404 }
      );
    }

    // التحقق الإضافي للمرضى: التأكد من أن السجل خاص بهم
    if (userRole === 216 && currentUserId) {
      const userEmail = (session?.user as any)?.email;
      if (userEmail) {
        try {
          const userPatientId = await getPatientIdByUserEmail(userEmail);
          if (userPatientId && record.PATIENT_ID !== userPatientId) {
            return NextResponse.json(
              { error: 'Unauthorized: You can only view your own medical records' },
              { status: 403 }
            );
          }
        } catch (error) {
          console.error('Error getting patient ID:', error);
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 403 }
          );
        }
      }
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error fetching medical record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medical record' },
      { status: 500 }
    );
  }
}

// PUT - تحديث سجل طبي
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.roleId;
  const isAdmin = (session?.user as any)?.isAdmin;
  const ip = getClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') || undefined;
  const { id } = await params;
  const recordId = Number(id);

  try {
    // التحقق من الصلاحيات: فقط الأطباء والأدمن والسوبر أدمن يمكنهم التعديل
    if (userRole !== 213 && userRole !== 212 && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only doctors and admins can update medical records' },
        { status: 403 }
      );
    }

    const body = await request.json();

    await updateMedicalRecord(recordId, body, userId, userRole, isAdmin);

    // Log successful update
    await logAuditEvent({
      user_id: userId,
      action: 'update',
      resource: 'MedicalRecord',
      resource_id: recordId,
      ip_address: ip,
      user_agent: userAgent,
      status: 'success',
      details: `Updated medical record ID: ${recordId}`,
    });

    return NextResponse.json(
      {
        message: 'تم تحديث السجل الطبي بنجاح'
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log failure
    await logAuditEvent({
      user_id: userId,
      action: 'update',
      resource: 'MedicalRecord',
      resource_id: recordId,
      ip_address: ip,
      user_agent: userAgent,
      status: 'failure',
      error_message: errorMessage,
    });

    console.error('خطأ في تحديث السجل الطبي:', error);
    
    if (errorMessage.includes('Unauthorized')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: 'فشل في تحديث السجل الطبي',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

// DELETE - حذف سجل طبي
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.roleId;
  const isAdmin = (session?.user as any)?.isAdmin;
  const ip = getClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') || undefined;
  const { id } = await params;
  const recordId = Number(id);

  try {
    // التحقق من الصلاحيات: فقط الأطباء والأدمن والسوبر أدمن يمكنهم الحذف
    if (userRole !== 213 && userRole !== 212 && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only doctors and admins can delete medical records' },
        { status: 403 }
      );
    }

    await deleteMedicalRecord(recordId, userId, userRole, isAdmin);

    // Log successful deletion
    await logAuditEvent({
      user_id: userId,
      action: 'delete',
      resource: 'MedicalRecord',
      resource_id: recordId,
      ip_address: ip,
      user_agent: userAgent,
      status: 'success',
      details: `Deleted medical record ID: ${recordId}`,
    });

    return NextResponse.json(
      {
        message: 'تم حذف السجل الطبي بنجاح'
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log failure
    await logAuditEvent({
      user_id: userId,
      action: 'delete',
      resource: 'MedicalRecord',
      resource_id: recordId,
      ip_address: ip,
      user_agent: userAgent,
      status: 'failure',
      error_message: errorMessage,
    });

    console.error('خطأ في حذف السجل الطبي:', error);
    
    if (errorMessage.includes('Unauthorized')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: 'فشل في حذف السجل الطبي',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

