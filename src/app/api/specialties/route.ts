// app/api/specialties/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';

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

// ✅ GET - جلب التخصصات الفريدة من قاعدة البيانات أو fallback
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting specialties API call...');

    const connection = await getConnection();
    console.log('✅ Database connection established');

    const result = await connection.execute(`
      SELECT DISTINCT SPECIALTY 
      FROM TAH57.DOCTORS 
      WHERE SPECIALTY IS NOT NULL 
      ORDER BY SPECIALTY
    `);

    console.log('📊 Raw database result:', result);

    await connection.close();
    console.log('✅ Database connection closed');

    // ✅ تحويل النتائج إلى مصفوفة تخصصات
    const specialties = result.rows?.map((row: any) => row.SPECIALTY?.trim())
      .filter((spec: string) => spec && spec !== '') || [];

    console.log('🎯 Processed specialties:', specialties);

    // ✅ إذا لم يتم العثور على نتائج، استخدام fallback
    if (specialties.length === 0) {
      console.warn('⚠️ No specialties found in database. Using fallback list.');
      return NextResponse.json(fallbackSpecialties);
    }

    return NextResponse.json(specialties);

  } catch (error) {
    console.error('❌ Error fetching specialties:', error);
    console.warn('⚠️ Using fallback specialties due to error.');

    return NextResponse.json(fallbackSpecialties);
  }
}
