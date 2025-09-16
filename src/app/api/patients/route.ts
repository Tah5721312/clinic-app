// app/api/patients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllPatients, createPatient } from '@/lib/db_utils';

// GET - جلب جميع المرضى
export async function GET() {
  try {
    const patients = await getAllPatients();
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

        return NextResponse.json(
            {
                message: 'تم إضافة المريض بنجاح',
                id: id
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error('خطأ في إضافة المريض:', error);
        return NextResponse.json(
            {
                error: 'فشل في إضافة المريض',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}