// app/api/patients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPatientById, updatePatient, deletePatient } from '@/lib/db_utils';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET - جلب مريض محدد
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
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

// PUT - تحديث مريض// 

// PUT - تحديث مريض - نسخة محسنة مع التحقق من الأخطاء

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('Received update request for patient ID:', id);
    console.log('Request body:', JSON.stringify(body, null, 2));

    if (isNaN(Number(id))) {
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
    }

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // ✅ تنظيف البيانات الواردة
    const cleanedBody = { ...body };

    // إزالة أي حقول فارغة أو null
    Object.keys(cleanedBody).forEach(key => {
      if (cleanedBody[key] === null || cleanedBody[key] === '') {
        delete cleanedBody[key];
      }
    });

    console.log('Cleaned body:', JSON.stringify(cleanedBody, null, 2));

    // ✅ تحويل التاريخ إذا موجود
    if (cleanedBody.DATEOFBIRTH && typeof cleanedBody.DATEOFBIRTH === 'string') {
      cleanedBody.DATEOFBIRTH = new Date(cleanedBody.DATEOFBIRTH);
    }

    // التحقق من وجود المريض أولاً
    try {
      const existingPatient = await getPatientById(Number(id));
      if (!existingPatient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }
    } catch (error) {
      console.error('Error checking patient existence:', error);
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // محاولة التحديث
    const rowsAffected = await updatePatient(Number(id), cleanedBody);

    if (rowsAffected === 0) {
      return NextResponse.json({
        error: 'No rows were updated',
        details: 'Patient may not exist or no changes detected'
      }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Patient updated successfully',
      rowsAffected,
      updatedFields: Object.keys(cleanedBody)
    });

  } catch (error) {
    console.error('Error updating patient:', error);

    let errorMessage = 'Unknown error';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // معالجة أخطاء Oracle المحددة
      if (error.message.includes('ORA-00904')) {
        errorMessage = 'Invalid column name in database query';
        statusCode = 400;
      } else if (error.message.includes('ORA-00001')) {
        errorMessage = 'Duplicate value for unique field';
        statusCode = 409;
      } else if (error.message.includes('ORA-01400')) {
        errorMessage = 'Required field cannot be null';
        statusCode = 400;
      }
    }

    if (errorMessage.includes('No fields to update') || errorMessage.includes('No valid fields')) {
      return NextResponse.json({
        error: 'No valid fields to update',
        details: 'Please provide at least one valid field to update',
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to update patient',
      details: errorMessage
    }, { status: statusCode });
  }
}


// تغيير دالة DELETE لتصبح مثل دالة الأطباء تماماً
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const rowsAffected = await deletePatient(Number(id));

    if (rowsAffected === 0) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Patient deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting patient:', error);

    // Handle Foreign Key Constraint Error (Oracle error 2292)
    if (error?.errorNum === 2292) {
      return NextResponse.json(
        {
          success: false,
          cannotDelete: true,
          message: 'لا يمكن حذف المريض قبل حذف أو نقل المواعيد المرتبطة به'
        },
        { status: 200 } // Return 200 instead of error status
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete patient'
      },
      { status: 500 }
    );
  }
}