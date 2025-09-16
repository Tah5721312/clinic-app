// app/api/patients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPatientById, updatePatient, deletePatient } from '@/lib/db_utils';

interface Params {
  params: {
    id: string;
  };
}

// GET - جلب مريض محدد
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const patient = await getPatientById(Number(id));
    
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}
// PUT - تحديث مريض

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();

    // التحقق من أن الـ ID صحيح
    if (isNaN(Number(id))) {
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
    }

    // التحقق من وجود حقول للتحديث
    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // ⭐ الخطوة الجديدة: معالجة البيانات قبل إرسالها إلى دالة التحديث
    const transformedBody: any = {};
    for (const key in body) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        // تحويل المفاتيح إلى camelCase لتتوافق مع دالة updatePatient
        const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        transformedBody[camelCaseKey] = body[key];
      }
    }

    // ⭐ تحويل سلسلة التاريخ إلى كائن Date
    if (transformedBody.dateOfBirth && typeof transformedBody.dateOfBirth === 'string') {
      transformedBody.dateOfBirth = new Date(transformedBody.dateOfBirth);
    }

    const rowsAffected = await updatePatient(Number(id), transformedBody);

    if (rowsAffected === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Patient updated successfully', rowsAffected });
  } catch (error) {
    console.error('Error updating patient:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // إضافة فحص للخطأ الخاص بعدم وجود حقول للتحديث
    if (errorMessage.includes('No fields to update')) {
        return NextResponse.json({ error: 'No fields to update', details: 'Please provide at least one field to update' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to update patient', details: errorMessage }, { status: 500 });
  }
}


// DELETE - حذف مريض
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    
    const rowsAffected = await deletePatient(Number(id));
    
    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { error: 'Failed to delete patient' },
      { status: 500 }
    );
  }
}