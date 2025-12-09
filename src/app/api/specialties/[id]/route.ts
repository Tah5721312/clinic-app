// app/api/specialties/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateSpecialty, deleteSpecialty, getAllSpecialties } from '@/lib/db_utils';
import { auth } from '@/auth';
import { logAuditEvent } from '@/lib/auditLogger';
import { getClientIP } from '@/lib/rateLimit';

// PUT - تحديث تخصص
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const ip = getClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') || undefined;
  const { id } = await params;
  const specialtyId = Number(id);

  try {
    const body = await request.json();
    const { name, description, isActive } = body;

    await updateSpecialty(
      specialtyId,
      name,
      description,
      isActive
    );

    // Log successful update
    await logAuditEvent({
      user_id: userId,
      action: 'update',
      resource: 'Specialty',
      resource_id: specialtyId,
      ip_address: ip,
      user_agent: userAgent,
      status: 'success',
      details: `Updated specialty ID: ${specialtyId}`,
    });

    return NextResponse.json(
      {
        message: 'تم تحديث التخصص بنجاح'
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log failure
    await logAuditEvent({
      user_id: userId,
      action: 'update',
      resource: 'Specialty',
      resource_id: specialtyId,
      ip_address: ip,
      user_agent: userAgent,
      status: 'failure',
      error_message: errorMessage,
    });

    console.error('خطأ في تحديث التخصص:', error);
    return NextResponse.json(
      {
        error: 'فشل في تحديث التخصص',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

// DELETE - حذف تخصص (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const ip = getClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') || undefined;
  const { id } = await params;
  const specialtyId = Number(id);

  try {
    await deleteSpecialty(specialtyId);

    // Log successful deletion
    await logAuditEvent({
      user_id: userId,
      action: 'delete',
      resource: 'Specialty',
      resource_id: specialtyId,
      ip_address: ip,
      user_agent: userAgent,
      status: 'success',
      details: `Deleted specialty ID: ${specialtyId}`,
    });

    return NextResponse.json(
      {
        message: 'تم حذف التخصص بنجاح'
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log failure
    await logAuditEvent({
      user_id: userId,
      action: 'delete',
      resource: 'Specialty',
      resource_id: specialtyId,
      ip_address: ip,
      user_agent: userAgent,
      status: 'failure',
      error_message: errorMessage,
    });

    console.error('خطأ في حذف التخصص:', error);
    return NextResponse.json(
      {
        error: 'فشل في حذف التخصص',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

// GET - جلب تخصص محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const specialtyId = Number(id);
    const specialties = await getAllSpecialties(false); // Get all including inactive
    const specialty = specialties.find(s => s.SPECIALTY_ID === specialtyId);

    if (!specialty) {
      return NextResponse.json(
        { error: 'التخصص غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(specialty);
  } catch (error) {
    console.error('Error fetching specialty:', error);
    return NextResponse.json(
      { error: 'Failed to fetch specialty' },
      { status: 500 }
    );
  }
}

