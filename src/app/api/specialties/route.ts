// app/api/specialties/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllSpecialties, createSpecialty } from '@/lib/db_utils';
import { auth } from '@/auth';
import { logAuditEvent } from '@/lib/auditLogger';
import { getClientIP } from '@/lib/rateLimit';

// ✅ قائمة تخصصات احتياطية (Fallback)
const fallbackSpecialties = [
  'طب الباطنة',
  'طب الأطفال',
  'طب النساء والتوليد',
  'طب الجراحة',
  'طب العظام',
  'طب القلب',
  'طب الأعصاب',
  'طب العيون',
  'طب الأنف والأذن والحنجرة',
  'طب الجلدية',
  'طب الأسنان',
  'الطب النفسي',
  'الطب الطبيعي والتأهيل',
  'التخدير والعناية المركزة',
  'الأشعة',
  'المختبرات الطبية'
];

// ✅ GET - جلب التخصصات من جدول SPECIALTIES
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting specialties API call...');

    const specialties = await getAllSpecialties(true); // Get only active specialties
    
    console.log('🎯 Processed specialties:', specialties);

    // ✅ تحويل النتائج إلى مصفوفة أسماء فقط (للتوافق مع الكود الحالي)
    const specialtyNames = specialties.map((spec) => spec.NAME);

    // ✅ إذا لم يتم العثور على نتائج، استخدام fallback
    if (specialtyNames.length === 0) {
      console.warn('⚠️ No specialties found in database. Using fallback list.');
      return NextResponse.json(fallbackSpecialties);
    }

    return NextResponse.json(specialtyNames);

  } catch (error) {
    console.error('❌ Error fetching specialties:', error);
    console.warn('⚠️ Using fallback specialties due to error.');

    return NextResponse.json(fallbackSpecialties);
  }
}

// ✅ POST - إضافة تخصص جديد
export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const ip = getClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'اسم التخصص مطلوب' },
        { status: 400 }
      );
    }

    const id = await createSpecialty(name.trim(), description?.trim());

    // Log successful creation
    await logAuditEvent({
      user_id: userId,
      action: 'create',
      resource: 'Specialty',
      resource_id: Number(id),
      ip_address: ip,
      user_agent: userAgent,
      status: 'success',
      details: `Created specialty: ${name}`,
    });

    return NextResponse.json(
      {
        message: 'تم إضافة التخصص بنجاح',
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
      resource: 'Specialty',
      ip_address: ip,
      user_agent: userAgent,
      status: 'failure',
      error_message: errorMessage,
    });

    console.error('خطأ في إضافة التخصص:', error);
    return NextResponse.json(
      {
        error: 'فشل في إضافة التخصص',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
