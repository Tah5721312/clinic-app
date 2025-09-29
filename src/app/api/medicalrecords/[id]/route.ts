// app/api/medical-records/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';
import { verifyToken } from '@/lib/verifyToken';
import { UserRoles, PermissionNames } from '@/lib/types';
import oracledb from 'oracledb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = verifyToken(request);
  
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 401 });
  }

  let connection;
  try {
    connection = await getConnection();

    // جلب السجل الطبي الأساسي
    const recordResult = await connection.execute(
      `SELECT mr.*, p.NAME as PATIENT_NAME, d.NAME as DOCTOR_NAME, d.SPECIALTY
       FROM TAH57.MEDICALRECORDS mr
       JOIN TAH57.PATIENTS p ON mr.PATIENT_ID = p.PATIENT_ID
       JOIN TAH57.DOCTORS d ON mr.DOCTOR_ID = d.DOCTOR_ID
       WHERE mr.MEDICALRECORD_ID = :id`,
      { id: parseInt(params.id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const record = recordResult.rows?.[0] as any;
    if (!record) {
      return NextResponse.json({ error: 'السجل الطبي غير موجود' }, { status: 404 });
    }

    // التحقق من الصلاحيات
    const canAccess = await checkMedicalRecordAccess(user, record, connection);
    
    if (!canAccess) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لعرض هذا السجل الطبي' },
        { status: 403 }
      );
    }

    // تحويل البيانات من JSON strings إلى arrays
    const processedRecord = {
      ...record,
      SYMPTOMS: record.SYMPTOMS ? JSON.parse(record.SYMPTOMS) : [],
      MEDICATIONS: record.MEDICATIONS ? JSON.parse(record.MEDICATIONS) : [],
      IMAGES: record.IMAGES ? JSON.parse(record.IMAGES) : []
    };

    return NextResponse.json(processedRecord);

  } catch (error) {
    console.error('Error fetching medical record:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  } finally {
    if (connection) await connection.close();
  }
}

//*********
// PUT
// ******* */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = verifyToken(request);
  
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 401 });
  }

  let connection;
  try {
    const body = await request.json();
    const {
      DIAGNOSIS,
      SYMPTOMS,
      MEDICATIONS,
      TREATMENTPLAN,
      NOTES,
      BLOOD_PRESSURE,
      TEMPERATURE,
      HEIGHT,
      WEIGHT
    } = body;

    connection = await getConnection();

    // التحقق من وجود السجل وأذونات التعديل
    const existingRecordResult = await connection.execute(
      `SELECT PATIENT_ID, DOCTOR_ID FROM TAH57.MEDICALRECORDS WHERE MEDICALRECORD_ID = :id`,
      { id: parseInt(params.id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const existingRecord = existingRecordResult.rows?.[0] as any;
    if (!existingRecord) {
      return NextResponse.json({ error: 'السجل الطبي غير موجود' }, { status: 404 });
    }

    // التحقق من صلاحيات التعديل
    const canEdit = await checkMedicalRecordEditAccess(user, existingRecord, connection);
    
    if (!canEdit) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لتعديل هذا السجل الطبي' },
        { status: 403 }
      );
    }

    // تحديث السجل الطبي
    const updateResult = await connection.execute(
      `UPDATE TAH57.MEDICALRECORDS 
       SET DIAGNOSIS = :DIAGNOSIS,
           SYMPTOMS = :SYMPTOMS,
           MEDICATIONS = :MEDICATIONS,
           TREATMENTPLAN = :TREATMENTPLAN,
           NOTES = :NOTES,
           BLOOD_PRESSURE = :BLOOD_PRESSURE,
           TEMPERATURE = :TEMPERATURE,
           HEIGHT = :HEIGHT,
           WEIGHT = :WEIGHT,
           UPDATED_AT = CURRENT_TIMESTAMP
       WHERE MEDICALRECORD_ID = :id`,
      {
        DIAGNOSIS: DIAGNOSIS?.toUpperCase(),
        SYMPTOMS: SYMPTOMS ? JSON.stringify(SYMPTOMS) : null,
        MEDICATIONS: MEDICATIONS ? JSON.stringify(MEDICATIONS) : null,
        TREATMENTPLAN: TREATMENTPLAN?.toUpperCase(),
        NOTES: NOTES?.toUpperCase(),
        BLOOD_PRESSURE,
        TEMPERATURE,
        HEIGHT,
        WEIGHT,
        id: parseInt(params.id)
      },
      { autoCommit: true }
    );

    if (updateResult.rowsAffected === 0) {
      return NextResponse.json({ error: 'فشل في تحديث السجل الطبي' }, { status: 400 });
    }

    // جلب السجل المحدث
    const updatedRecordResult = await connection.execute(
      `SELECT mr.*, p.NAME as PATIENT_NAME, d.NAME as DOCTOR_NAME, d.SPECIALTY
       FROM TAH57.MEDICALRECORDS mr
       JOIN TAH57.PATIENTS p ON mr.PATIENT_ID = p.PATIENT_ID
       JOIN TAH57.DOCTORS d ON mr.DOCTOR_ID = d.DOCTOR_ID
       WHERE mr.MEDICALRECORD_ID = :id`,
      { id: parseInt(params.id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const updatedRecord = updatedRecordResult.rows?.[0] as any;
    const processedRecord = {
      ...updatedRecord,
      SYMPTOMS: updatedRecord.SYMPTOMS ? JSON.parse(updatedRecord.SYMPTOMS) : [],
      MEDICATIONS: updatedRecord.MEDICATIONS ? JSON.parse(updatedRecord.MEDICATIONS) : [],
      IMAGES: updatedRecord.IMAGES ? JSON.parse(updatedRecord.IMAGES) : []
    };

    return NextResponse.json({
      message: 'تم تحديث السجل الطبي بنجاح',
      record: processedRecord
    });

  } catch (error) {
    console.error('Error updating medical record:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  } finally {
    if (connection) await connection.close();
  }
}




export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = verifyToken(request);
  
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 401 });
  }

  let connection;
  try {
    connection = await getConnection();

    // التحقق من وجود السجل وأذونات الحذف
    const existingRecordResult = await connection.execute(
      `SELECT PATIENT_ID, DOCTOR_ID FROM TAH57.MEDICALRECORDS WHERE MEDICALRECORD_ID = :id`,
      { id: parseInt(params.id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const existingRecord = existingRecordResult.rows?.[0] as any;
    if (!existingRecord) {
      return NextResponse.json({ error: 'السجل الطبي غير موجود' }, { status: 404 });
    }

    // التحقق من صلاحيات الحذف
    const canDelete = await checkMedicalRecordDeleteAccess(user, existingRecord, connection);
    
    if (!canDelete) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية لحذف هذا السجل الطبي' },
        { status: 403 }
      );
    }

    // حذف السجل الطبي
    const deleteResult = await connection.execute(
      `DELETE FROM TAH57.MEDICALRECORDS WHERE MEDICALRECORD_ID = :id`,
      { id: parseInt(params.id) },
      { autoCommit: true }
    );

    if (deleteResult.rowsAffected === 0) {
      return NextResponse.json({ error: 'فشل في حذف السجل الطبي' }, { status: 400 });
    }

    return NextResponse.json({ message: 'تم حذف السجل الطبي بنجاح' });

  } catch (error) {
    console.error('Error deleting medical record:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  } finally {
    if (connection) await connection.close();
  }
}



// دالة التحقق من صلاحيات الوصول للقراءة
async function checkMedicalRecordAccess(user: any, record: any, connection: any): Promise<boolean> {
  // SUPER_ADMIN و ADMIN يمكنهم الوصول لكل شيء
  if (user.roleName === UserRoles.SUPER_ADMIN || user.roleName === UserRoles.ADMIN) {
    return true;
  }

  // المريض يمكنه رؤية سجله فقط
  if (user.roleName === UserRoles.PATIENT) {
    // البحث عن patient_id المرتبط بـ user_id
    const patientResult = await connection.execute(
      `SELECT PATIENT_ID FROM TAH57.PATIENTS WHERE PATIENT_ID = :userId`,
      { userId: user.id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const patient = patientResult.rows?.[0] as any;
    return patient && patient.PATIENT_ID === record.PATIENT_ID;
  }

  // الطبيب يمكنه رؤية السجلات التي كتبها أو إذا كان لديه صلاحية عامة
  if (user.roleName === UserRoles.DOCTOR) {
    // البحث عن doctor_id المرتبط بـ user_id
    const doctorResult = await connection.execute(
      `SELECT DOCTOR_ID FROM TAH57.DOCTORS WHERE DOCTOR_ID = :userId`,
      { userId: user.id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const doctor = doctorResult.rows?.[0] as any;
    
    if (doctor && doctor.DOCTOR_ID === record.DOCTOR_ID) {
      return true;
    }

    // التحقق من الصلاحيات العامة للطبيب
    const hasGeneralAccess = await checkUserPermission(
      user.id, 
      PermissionNames.MEDICAL_RECORDS_READ, 
      connection
    );
    return hasGeneralAccess;
  }

  // الممرض يمكنه الوصول إذا كان لديه الصلاحية
  if (user.roleName === UserRoles.NURSE) {
    return await checkUserPermission(user.id, PermissionNames.MEDICAL_RECORDS_READ, connection);
  }

  // RECEPTIONIST لا يمكنه الوصول للسجلات الطبية عادة
  return false;
}

// دالة التحقق من صلاحيات التعديل
async function checkMedicalRecordEditAccess(user: any, record: any, connection: any): Promise<boolean> {
  // SUPER_ADMIN و ADMIN يمكنهم تعديل كل شيء
  if (user.roleName === UserRoles.SUPER_ADMIN || user.roleName === UserRoles.ADMIN) {
    return true;
  }

  // الطبيب يمكنه تعديل السجلات التي كتبها فقط
  if (user.roleName === UserRoles.DOCTOR) {
    const doctorResult = await connection.execute(
      `SELECT DOCTOR_ID FROM TAH57.DOCTORS WHERE DOCTOR_ID = :userId`,
      { userId: user.id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const doctor = doctorResult.rows?.[0] as any;
    return doctor && doctor.DOCTOR_ID === record.DOCTOR_ID;
  }

  // الممرض يمكنه التعديل إذا كان لديه الصلاحية
  if (user.roleName === UserRoles.NURSE) {
    return await checkUserPermission(user.id, PermissionNames.MEDICAL_RECORDS_UPDATE, connection);
  }

  return false;
}

// دالة التحقق من صلاحيات الحذف
async function checkMedicalRecordDeleteAccess(user: any, record: any, connection: any): Promise<boolean> {
  // فقط SUPER_ADMIN و ADMIN يمكنهم الحذف
  if (user.roleName === UserRoles.SUPER_ADMIN || user.roleName === UserRoles.ADMIN) {
    return true;
  }

  // الطبيب يمكنه حذف السجلات التي كتبها فقط (إذا كان مسموحاً في النظام)
  if (user.roleName === UserRoles.DOCTOR) {
    const doctorResult = await connection.execute(
      `SELECT DOCTOR_ID FROM TAH57.DOCTORS WHERE DOCTOR_ID = :userId`,
      { userId: user.id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const doctor = doctorResult.rows?.[0] as any;
    
    if (doctor && doctor.DOCTOR_ID === record.DOCTOR_ID) {
      // التحقق من أن الطبيب لديه صلاحية الحذف
      return await checkUserPermission(user.id, PermissionNames.MEDICAL_RECORDS_DELETE, connection);
    }
  }

  return false;
}

// دالة مساعدة للتحقق من صلاحية محددة للمستخدم
async function checkUserPermission(userId: number, permissionName: string, connection: any): Promise<boolean> {
  try {
    const permissionResult = await connection.execute(
      `SELECT 1
       FROM TAH57.USERS u
       JOIN TAH57.ROLES r ON u.ROLE_ID = r.ROLES_ID
       JOIN TAH57.ROLE_PERMISSIONS rp ON r.ROLES_ID = rp.ROLE_ID
       JOIN TAH57.PERMISSIONS p ON rp.PERMISSION_ID = p.PERMISSIONS_ID
       WHERE u.ID = :userId 
         AND p.NAME = :permissionName
         AND r.IS_ACTIVE = 1
         AND p.IS_ACTIVE = 1`,
      { userId, permissionName },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return permissionResult.rows && permissionResult.rows.length > 0;
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
}
