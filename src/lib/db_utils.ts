import oracledb from 'oracledb';

// دوال مساعدة للتعامل مع الجداول مباشرة
import { executeQuery, executeReturningQuery, getConnection } from '@/lib/database';
import { Patient, DoctorSchedule, CreateScheduleDto, UpdateScheduleDto, TimeSlot } from '@/lib/types';

/**
 * جلب جميع الأطباء
 */
export async function getAllDoctors(specialty?: string) {
  let query = `
    SELECT DOCTOR_ID, NAME, EMAIL, PHONE, SPECIALTY, 
           EXPERIENCE, QUALIFICATION, IMAGE, BIO,
           CONSULTATION_FEE, IS_AVAILABLE, AVAILABILITY_UPDATED_AT
    FROM TAH57.DOCTORS`;

  const params: oracledb.BindParameters = {};

  if (specialty && specialty.trim()) {
    query += ' WHERE LOWER(SPECIALTY) = :specialty';
    params.specialty = specialty.toLowerCase();
  }

  query += ' ORDER BY name';

  return executeQuery<{
    DOCTOR_ID: number;
    NAME: string;
    EMAIL: string;
    PHONE: string;
    SPECIALTY: string;
    EXPERIENCE: number;
    QUALIFICATION: string;
    IMAGE: string;
    BIO: string;
    CONSULTATION_FEE: number;
    IS_AVAILABLE: number;
    AVAILABILITY_UPDATED_AT: Date;
  }>(query, params).then((result) => result.rows);
}

/**
 * جلب طبيب by ID
 */
export async function getDoctorById(id: number) {
  return executeQuery<{
    DOCTOR_ID: number;
    NAME: string;
    EMAIL: string;
    PHONE: string;
    SPECIALTY: string;
    EXPERIENCE: number;
    QUALIFICATION: string;
    IMAGE: string;
    BIO: string;
    CONSULTATION_FEE: number;
    IS_AVAILABLE: number;
    AVAILABILITY_UPDATED_AT: Date;
  }>(
    `
    SELECT DOCTOR_ID, NAME, EMAIL, PHONE, SPECIALTY, 
           EXPERIENCE, QUALIFICATION, IMAGE, BIO,
           CONSULTATION_FEE, IS_AVAILABLE, AVAILABILITY_UPDATED_AT
    FROM TAH57.DOCTORS 
    WHERE DOCTOR_ID = :id`,
    { id }
  ).then((result) => result.rows[0] || null);
}

/**
 * إضافة طبيب جديد
 */
export async function createDoctor(doctor: {
  name: string;
  email: string;
  phone: string;
  specialty: string;
  experience?: number;
  qualification?: string;
  image?: string;
  bio?: string;
  consultation_fee?: number;
  is_available?: number;
}) {
  const result = await executeReturningQuery<{ doctor_id: number }>(
    `
    INSERT INTO TAH57.DOCTORS (name, email, phone, specialty, experience, qualification, image, bio, consultation_fee, is_available) 
    VALUES (:name, :email, :phone, :specialty, :experience, :qualification, :image, :bio, :consultation_fee, :is_available) 
    RETURNING doctor_id INTO :id`,
    {
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialty: doctor.specialty,
      experience: doctor.experience || null,
      qualification: doctor.qualification || null,
      image: doctor.image || null,
      bio: doctor.bio || null,
      consultation_fee: doctor.consultation_fee || 0,
      is_available: doctor.is_available || 1,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    }
  );

  // الحصول على ID من outBinds بشكل آمن
  const outBinds = result.outBinds as { id: number[] } | undefined;
  const newDoctorId = outBinds?.id?.[0];

  if (!newDoctorId) {
    throw new Error('Failed to retrieve the new doctor ID');
  }

  return newDoctorId;
}

/**
 * تحديث طبيب
 */
export async function updateDoctor(
  id: number,
  doctor: {
    name?: string;
    email?: string;
    phone?: string;
    specialty?: string;
    experience?: number;
    qualification?: string;
    image?: string;
    bio?: string;
    consultation_fee?: number;
    is_available?: number;
    availability_updated_at?: Date;
  }
) {
  // إنشاء كائن للربط بين اسم الجدول في DB واسم الحقل في JS
  const fieldMappings: Record<string, string> = {
    name: 'NAME',
    email: 'EMAIL',
    phone: 'PHONE',
    specialty: 'SPECIALTY',
    experience: 'EXPERIENCE',
    qualification: 'QUALIFICATION',
    image: 'IMAGE',
    bio: 'BIO',
    consultation_fee: 'CONSULTATION_FEE',
    is_available: 'IS_AVAILABLE',
    availability_updated_at: 'AVAILABILITY_UPDATED_AT',
  };

  const setClauses: string[] = [];
  const bindParams: oracledb.BindParameters = { id }; // إصلاح المشكلة

  // بناء جمل SET وعوامل الربط
  Object.entries(doctor).forEach(([key, value]) => {
    if (value !== undefined && fieldMappings[key]) {
      const dbFieldName = fieldMappings[key];
      const bindParamName = key.toLowerCase();

      setClauses.push(`${dbFieldName} = :${bindParamName}`);
      bindParams[bindParamName] = value;
    }
  });

  if (setClauses.length === 0) {
    throw new Error('No fields to update');
  }

  const query = `UPDATE TAH57.DOCTORS SET ${setClauses.join(
    ', '
  )} WHERE DOCTOR_ID = :id`;

  const result = await executeQuery(query, bindParams);
  return result.rowsAffected || 0;
}

/**
 * حذف طبيب
 */
export async function deleteDoctor(id: number) {
  return executeQuery(
    `
    DELETE FROM TAH57.DOCTORS 
    WHERE doctor_id = :id`,
    { id }
  ).then((result) => result.rowsAffected || 0);
}



/**
 *    حذف طبيب مرتبط بمواعيد
 */
// Enhanced deleteDoctor function that handles cascading within a transaction
export async function deleteDoctorWithTransaction(id: number, cascade: boolean = false) {
  let connection;

  try {
    connection = await getConnection();

    if (cascade) {
      // Start transaction by disabling autoCommit
      // Delete appointments first
      const deleteAppointmentsResult = await connection.execute(
        `DELETE FROM TAH57.APPOINTMENTS WHERE DOCTOR_ID = :id`,
        { id },
        { autoCommit: false }
      );

      console.log(`Deleted ${deleteAppointmentsResult.rowsAffected} appointments for doctor ${id}`);

      // Add other related table deletions here if needed
      // Example: DELETE FROM DOCTOR_SCHEDULES, DOCTOR_RATINGS, etc.

      // Now delete the doctor
      const deleteDoctorResult = await connection.execute(
        `DELETE FROM TAH57.DOCTORS WHERE DOCTOR_ID = :id`,
        { id },
        { autoCommit: false }
      );

      // Commit the transaction
      await connection.commit();

      return {
        rowsAffected: deleteDoctorResult.rowsAffected || 0,
        appointmentsDeleted: deleteAppointmentsResult.rowsAffected || 0
      };

    } else {
      // Simple delete without cascade
      const result = await connection.execute(
        `DELETE FROM TAH57.DOCTORS WHERE DOCTOR_ID = :id`,
        { id },
        { autoCommit: true }
      );

      return {
        rowsAffected: result.rowsAffected || 0,
        appointmentsDeleted: 0
      };
    }

  } catch (error) {
    // Rollback on error
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Connection close failed:', closeError);
      }
    }
  }
}


/**
 * جلب جميع المرضى
 */

export async function getAllPatients(filters?: { doctorId?: number; specialty?: string; identificationNumber?: string; patientId?: number }) {
  let query = `
    SELECT p.*, d.name as PRIMARYPHYSICIANNAME 
    FROM TAH57.PATIENTS p 
    LEFT JOIN TAH57.DOCTORS d ON p.primaryphysician = d.doctor_id`;

  const params: oracledb.BindParameters = {};
  const where: string[] = [];

  if (filters?.patientId) {
    where.push('p.patient_id = :patientId');
    params.patientId = Number(filters.patientId);
  }

  if (filters?.doctorId) {
    where.push('p.primaryphysician = :doctorId');
    params.doctorId = Number(filters.doctorId);
  }

  if (filters?.specialty && filters.specialty.trim()) {
    where.push('LOWER(d.specialty) = :specialty');
    params.specialty = filters.specialty.toLowerCase();
  }

  if (filters?.identificationNumber && filters.identificationNumber.trim()) {
    where.push('p.identificationnumber LIKE :identificationNumber');
    params.identificationNumber = `%${filters.identificationNumber}%`;
  }

  if (where.length > 0) {
    query += ` WHERE ${where.join(' AND ')}`;
  }

  query += ' ORDER BY p.name';

  return executeQuery<Patient>(query, params).then((result) => result.rows);
}


/**
 * جلب مريض by ID
 */
export async function getPatientById(id: number) {
  return executeQuery<{
    PATIENT_ID: number;
    NAME: string;
    EMAIL: string;
    PHONE: string;
    DATEOFBIRTH: Date;
    GENDER: string;
    ADDRESS: string;
    OCCUPATION: string;
    EMERGENCYCONTACTNAME: string;
    EMERGENCYCONTACTNUMBER: string;
    PRIMARYPHYSICIAN: number;
    INSURANCEPROVIDER: string;
    INSURANCEPOLICYNUMBER: string;
    ALLERGIES: string;
    CURRENTMEDICATION: string;
    FAMILYMEDICALHISTORY: string;
    PASTMEDICALHISTORY: string;
    IDENTIFICATIONTYPE: string;
    IDENTIFICATIONNUMBER: string;
    PRIVACYCONSENT: number;
    TREATMENTCONSENT: number;
    DISCLOSURECONSENT: number;
    PRIMARYPHYSICIANNAME: string;
  }>(
    `
       SELECT 
    p.PATIENT_ID,
    p.NAME,
    p.EMAIL,
    p.PHONE,
    p.DATEOFBIRTH,
    p.GENDER,
    p.ADDRESS,
    p.OCCUPATION,
    p.EMERGENCYCONTACTNAME,
    p.EMERGENCYCONTACTNUMBER,
    p.PRIMARYPHYSICIAN,
    p.INSURANCEPROVIDER,
    p.INSURANCEPOLICYNUMBER,
    p.ALLERGIES,
    p.CURRENTMEDICATION,
    p.FAMILYMEDICALHISTORY,
    p.PASTMEDICALHISTORY,
    p.IDENTIFICATIONTYPE,
    p.IDENTIFICATIONNUMBER,
    p.PRIVACYCONSENT,
    p.TREATMENTCONSENT,
    p.DISCLOSURECONSENT,
    d.NAME AS PRIMARYPHYSICIANNAME
FROM TAH57.PATIENTS p
LEFT JOIN TAH57.DOCTORS d ON d.DOCTOR_ID = p.PRIMARYPHYSICIAN
WHERE p.PATIENT_ID = :id
`,
    { id }
  ).then((result) => result.rows[0] || null);
}

/**
 * إضافة مريض جديد
 */
export async function createPatient(patient: {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: string;
  address?: string;
  occupation?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  primaryPhysician?: number;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  allergies?: string;
  currentMedication?: string;
  familyMedicalHistory?: string;
  pastMedicalHistory?: string;
  identificationType?: string;
  identificationNumber?: string;
  privacyConsent: boolean;
  treatmentConsent: boolean;
  disclosureConsent: boolean;
}) {
  const {
    name,
    email,
    phone,
    dateOfBirth,
    gender,
    address,
    occupation,
    emergencyContactName,
    emergencyContactNumber,
    primaryPhysician,
    insuranceProvider,
    insurancePolicyNumber,
    allergies,
    currentMedication,
    familyMedicalHistory,
    pastMedicalHistory,
    identificationType,
    identificationNumber,
    privacyConsent,
    treatmentConsent,
    disclosureConsent,
  } = patient;

  // تم تعديل هذا الجزء للتعامل مع الحالة التي يكون فيها dateOfBirth قيمة فارغة
  const formattedDate = dateOfBirth
    ? dateOfBirth.toISOString().split('T')[0]
    : null;

  const result = await executeReturningQuery<{ patient_id: number }>(
    `
    INSERT INTO TAH57.PATIENTS (
      name, email, phone, dateofbirth, gender, address,
      occupation, emergencycontactname, emergencycontactnumber,
      primaryphysician, insuranceprovider, insurancepolicynumber,
      allergies, currentmedication, familymedicalhistory,
      pastmedicalhistory, identificationtype, identificationnumber,
      privacyconsent, treatmentconsent, disclosureconsent
    ) VALUES (
      :name, :email, :phone, TO_DATE(:dateOfBirth, 'YYYY-MM-DD'), :gender, :address,
      :occupation, :emergencyContactName, :emergencyContactNumber,
      :primaryPhysician, :insuranceProvider, :insurancePolicyNumber,
      :allergies, :currentMedication, :familyMedicalHistory,
      :pastMedicalHistory, :identificationType, :identificationNumber,
      :privacyConsent, :treatmentConsent, :disclosureConsent
    ) RETURNING patient_id INTO :id`,
    {
      name,
      email,
      phone,
      dateOfBirth: formattedDate,
      gender,
      address: address || null,
      occupation: occupation || null,
      emergencyContactName: emergencyContactName || null,
      emergencyContactNumber: emergencyContactNumber || null,
      primaryPhysician: primaryPhysician || null,
      insuranceProvider: insuranceProvider || null,
      insurancePolicyNumber: insurancePolicyNumber || null,
      allergies: allergies || null,
      currentMedication: currentMedication || null,
      familyMedicalHistory: familyMedicalHistory || null,
      pastMedicalHistory: pastMedicalHistory || null,
      identificationType: identificationType || null,
      identificationNumber: identificationNumber || null,
      privacyConsent: privacyConsent ? 1 : 0,
      treatmentConsent: treatmentConsent ? 1 : 0,
      disclosureConsent: disclosureConsent ? 1 : 0,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    }
  );

  // الحصول على ID من outBinds بشكل آمن
  const outBinds = result.outBinds as { id: number[] } | undefined;
  const newPatientId = outBinds?.id?.[0];

  if (!newPatientId) {
    throw new Error('Failed to retrieve the new patient ID');
  }

  return newPatientId;
}

/**
 * تحديث مريض
 */

export async function updatePatient(
  id: number,
  patient: {
    NAME?: string;
    EMAIL?: string;
    PHONE?: string;
    DATEOFBIRTH?: Date | string;
    GENDER?: string;
    ADDRESS?: string;
    OCCUPATION?: string;
    EMERGENCYCONTACTNAME?: string;
    EMERGENCYCONTACTNUMBER?: string;
    PRIMARYPHYSICIAN?: number;
    INSURANCEPROVIDER?: string;
    INSURANCEPOLICYNUMBER?: string;
    ALLERGIES?: string;
    CURRENTMEDICATION?: string;
    FAMILYMEDICALHISTORY?: string;
    PASTMEDICALHISTORY?: string;
    IDENTIFICATIONTYPE?: string;
    IDENTIFICATIONNUMBER?: string;
    PRIVACYCONSENT?: boolean;
    TREATMENTCONSENT?: boolean;
    DISCLOSURECONSENT?: boolean;
  }
) {
  // خريطة لربط أسماء الحقول بأسماء الأعمدة في قاعدة البيانات
  const fieldToColumnMap: Record<string, string> = {
    'NAME': 'NAME',
    'EMAIL': 'EMAIL',
    'PHONE': 'PHONE',
    'DATEOFBIRTH': 'DATEOFBIRTH',
    'GENDER': 'GENDER',
    'ADDRESS': 'ADDRESS',
    'OCCUPATION': 'OCCUPATION',
    'EMERGENCYCONTACTNAME': 'EMERGENCYCONTACTNAME',
    'EMERGENCYCONTACTNUMBER': 'EMERGENCYCONTACTNUMBER',
    'PRIMARYPHYSICIAN': 'PRIMARYPHYSICIAN',
    'INSURANCEPROVIDER': 'INSURANCEPROVIDER',
    'INSURANCEPOLICYNUMBER': 'INSURANCEPOLICYNUMBER',
    'ALLERGIES': 'ALLERGIES',
    'CURRENTMEDICATION': 'CURRENTMEDICATION',
    'FAMILYMEDICALHISTORY': 'FAMILYMEDICALHISTORY',
    'PASTMEDICALHISTORY': 'PASTMEDICALHISTORY',
    'IDENTIFICATIONTYPE': 'IDENTIFICATIONTYPE',
    'IDENTIFICATIONNUMBER': 'IDENTIFICATIONNUMBER',
    'PRIVACYCONSENT': 'PRIVACYCONSENT',
    'TREATMENTCONSENT': 'TREATMENTCONSENT',
    'DISCLOSURECONSENT': 'DISCLOSURECONSENT'
  };

  const setClauses: string[] = [];
  const bindParams: Record<string, string | number | Date | null> = { id };

  Object.entries(patient).forEach(([key, value]) => {
    if (value !== undefined && fieldToColumnMap[key]) {
      const dbColumnName = fieldToColumnMap[key];
      const bindParamName = key;

      console.log(`Processing field: ${key} -> Column: ${dbColumnName}, Value:`, value);

      // معالجة التاريخ
      if (dbColumnName === 'DATEOFBIRTH') {
        const dateValue = new Date(value as string | Date);
        setClauses.push(
          `${dbColumnName} = TO_DATE(:${bindParamName}, 'YYYY-MM-DD')`
        );
        bindParams[bindParamName] = dateValue.toISOString().split('T')[0];
      }

      // معالجة الحقول البوليانية
      else if (
        ['PRIVACYCONSENT', 'TREATMENTCONSENT', 'DISCLOSURECONSENT'].includes(dbColumnName)
      ) {
        const booleanValue =
          typeof value === 'boolean' ? (value ? 1 : 0) : value;
        setClauses.push(`${dbColumnName} = :${bindParamName}`);
        bindParams[bindParamName] = booleanValue as number;
      }

      // باقي الحقول
      else {
        setClauses.push(`${dbColumnName} = :${bindParamName}`);
        bindParams[bindParamName] = value as string | number | null;
      }
    } else if (value !== undefined && !fieldToColumnMap[key]) {
      console.warn(`Unknown field ignored: ${key}`);
    }
  });

  if (setClauses.length === 0) {
    throw new Error('No valid fields to update');
  }

  const query = `
    UPDATE TAH57.PATIENTS 
    SET ${setClauses.join(', ')}
    WHERE PATIENT_ID = :id
  `;

  console.log('Generated Query:', query);
  console.log('Bind Parameters:', bindParams);

  try {
    const result = await executeQuery(query, bindParams);
    return result.rowsAffected || 0;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

/**
 * حذف مريض
 */
export async function deletePatient(id: number) {
  return executeQuery('DELETE FROM TAH57.PATIENTS WHERE patient_id = :id', {
    id,
  }).then((result) => result.rowsAffected || 0);
}

/**
 * جلب جميع المواعيد
 */
export async function getAllAppointments(filters?: {
  doctorId?: number;
  specialty?: string;
  identificationNumber?: string;
}) {
  let query = `
    SELECT a.appointment_id, a.patient_id, a.doctor_id, a.schedule, a.reason, a.note, a.status, a.cancellationreason,
           NVL(a.appointment_type, 'consultation') as appointment_type,
           NVL(a.payment_status, 'unpaid') as payment_status,
           NVL(a.payment_amount, 0) as payment_amount,
           p.name as patient_name, d.name as doctor_name, p.identificationnumber
    FROM TAH57.APPOINTMENTS a 
    JOIN TAH57.PATIENTS p ON a.patient_id = p.patient_id 
    JOIN TAH57.DOCTORS d ON a.doctor_id = d.doctor_id 
  `;

  const params: oracledb.BindParameters = {};
  const where: string[] = [];

  if (filters?.doctorId) {
    where.push('a.doctor_id = :doctorId');
    params.doctorId = filters.doctorId;
  }

  if (filters?.specialty && filters.specialty.trim()) {
    where.push('LOWER(d.specialty) = :specialty');
    params.specialty = filters.specialty.toLowerCase();
  }

  if (filters?.identificationNumber && filters.identificationNumber.trim()) {
    where.push('p.identificationnumber LIKE :identificationNumber');
    params.identificationNumber = `%${filters.identificationNumber}%`;
  }

  if (where.length > 0) {
    query += ` WHERE ${where.join(' AND ')}`;
  }

  query += ' ORDER BY a.schedule DESC';

  return executeQuery<{
    APPOINTMENT_ID: number;
    PATIENT_ID: number;
    DOCTOR_ID: number;
    SCHEDULE: Date;
    REASON: string;
    NOTE: string;
    STATUS: string;
    CANCELLATIONREASON: string;
    PATIENT_NAME: string;
    DOCTOR_NAME: string;
    APPOINTMENT_TYPE: string;
    PAYMENT_STATUS: string;
    PAYMENT_AMOUNT: number;
  }>(query, params).then((result) => result.rows);
}

/**
 * جلب مواعيد المريض
 */
export async function getPatientAppointments(patientId: number) {
  return executeQuery<{
    APPOINTMENT_ID: number;
    PATIENT_ID: number;
    DOCTOR_ID: number;
    SCHEDULE: Date;
    REASON: string;
    NOTE: string;
    STATUS: string;
    CANCELLATIONREASON: string;
    PATIENT_NAME: string;
    DOCTOR_NAME: string;
    APPOINTMENT_TYPE: string;
    PAYMENT_STATUS: string;
    PAYMENT_AMOUNT: number;
  }>(
    `
    SELECT a.appointment_id, a.patient_id, a.doctor_id, a.schedule, a.reason, a.note, a.status, a.cancellationreason,
           NVL(a.appointment_type, 'consultation') as appointment_type,
           NVL(a.payment_status, 'unpaid') as payment_status,
           NVL(a.payment_amount, 0) as payment_amount,
           p.name as patient_name, d.name as doctor_name 
    FROM TAH57.APPOINTMENTS a 
    JOIN TAH57.PATIENTS p ON a.patient_id = p.patient_id 
    JOIN TAH57.DOCTORS d ON a.doctor_id = d.doctor_id 
    WHERE a.patient_id = :patientId
    ORDER BY a.schedule DESC`,
    { patientId }
  ).then((result) => result.rows);
}

/**
 * جلب موعد by ID
 */
export async function getAppointmentById(id: number) {
  return executeQuery<{
    APPOINTMENT_ID: number;
    PATIENT_ID: number;
    DOCTOR_ID: number;
    SCHEDULE: Date;
    REASON: string;
    NOTE: string;
    STATUS: string;
    CANCELLATIONREASON: string;
    PATIENT_NAME: string;
    DOCTOR_NAME: string;
    APPOINTMENT_TYPE: string;
    PAYMENT_STATUS: string;
    PAYMENT_AMOUNT: number;
  }>(
    `
    SELECT a.*, p.name as patient_name, d.name as doctor_name 
    FROM TAH57.APPOINTMENTS a 
    JOIN TAH57.PATIENTS p ON a.patient_id = p.patient_id 
    JOIN TAH57.DOCTORS d ON a.doctor_id = d.doctor_id 
    WHERE a.appointment_id = :id`,
    { id }
  ).then((result) => result.rows[0] || null);
}

/**
 * إنشاء موعد جديد
 */
export async function createAppointment(appointment: {
  patient_id: number;
  doctor_id: number;
  schedule: Date;
  reason: string;
  note?: string;
  status?: string;
  appointment_type?: string;
  payment_status?: string;
  payment_amount?: number;
}) {
  const {
    patient_id,
    doctor_id,
    schedule,
    reason,
    note,
    status = 'pending',
    appointment_type = 'consultation',
    payment_status = 'unpaid',
    payment_amount = 0,
  } = appointment;

  // تحويلات التاريخ/الوقت
  const pad2 = (n: number) => n.toString().padStart(2, '0');
  const localYear = schedule.getFullYear();
  const localMonth = pad2(schedule.getMonth() + 1);
  const localDay = pad2(schedule.getDate());
  const localHours = pad2(schedule.getHours());
  const localMinutes = pad2(schedule.getMinutes());
  const scheduleDate = `${localYear}-${localMonth}-${localDay}`; // YYYY-MM-DD in local time
  const scheduleAt = `${localHours}:${localMinutes}`; // HH:MM in local time
  const oracleDateTime = `${scheduleDate} ${scheduleAt}:00`; // keep for legacy fallback

  // Insert the appointment and let the trigger handle the ID generation
  // Retry on ORA-00001 by advancing sequence to avoid PK collisions
  const attemptInsertFull = async () => {
    // محاولة الإدخال مع الحقل الجديد schedule_at
    try {
      await executeQuery(
        `
        INSERT INTO TAH57.APPOINTMENTS (patient_id, doctor_id, schedule, schedule_at, reason, note, status, appointment_type, payment_status, payment_amount) 
        VALUES (:patient_id, :doctor_id, TO_DATE(:schedule_date, 'YYYY-MM-DD'), :schedule_at, :reason, :note, :status, :appointment_type, :payment_status, :payment_amount)`,
        {
          patient_id: Number(patient_id),
          doctor_id: Number(doctor_id),
          schedule_date: scheduleDate,
          schedule_at: scheduleAt,
          reason,
          note: note || null,
          status,
          appointment_type,
          payment_status,
          payment_amount: payment_amount || 0,
        }
      );
      return;
    } catch (e: any) {
      if (!(e.message?.includes('invalid identifier') || e.message?.includes('column'))) {
        throw e;
      }
    }
    // إذا لم يوجد الحقل الجديد، نعود للإدخال القديم باستخدام TIMESTAMP
    await executeQuery(
      `
      INSERT INTO TAH57.APPOINTMENTS (patient_id, doctor_id, schedule, reason, note, status, appointment_type, payment_status, payment_amount) 
      VALUES (:patient_id, :doctor_id, TO_TIMESTAMP(:schedule, 'YYYY-MM-DD HH24:MI:SS.FF'), :reason, :note, :status, :appointment_type, :payment_status, :payment_amount)`,
      {
        patient_id: Number(patient_id),
        doctor_id: Number(doctor_id),
        schedule: oracleDateTime,
        reason,
        note: note || null,
        status,
        appointment_type,
        payment_status,
        payment_amount: payment_amount || 0,
      }
    );
  };

  const attemptInsertBasic = async () => {
    // محاولة الإدخال مع schedule_at أولاً
    try {
      await executeQuery(
        `
        INSERT INTO TAH57.APPOINTMENTS (patient_id, doctor_id, schedule, schedule_at, reason, note, status) 
        VALUES (:patient_id, :doctor_id, TO_DATE(:schedule_date, 'YYYY-MM-DD'), :schedule_at, :reason, :note, :status)`,
        {
          patient_id: Number(patient_id),
          doctor_id: Number(doctor_id),
          schedule_date: scheduleDate,
          schedule_at: scheduleAt,
          reason,
          note: note || null,
          status,
        }
      );
      return;
    } catch (e: any) {
      if (!(e.message?.includes('invalid identifier') || e.message?.includes('column'))) {
        throw e;
      }
    }
    await executeQuery(
        `
        INSERT INTO TAH57.APPOINTMENTS (patient_id, doctor_id, schedule, reason, note, status) 
        VALUES (:patient_id, :doctor_id, TO_TIMESTAMP(:schedule, 'YYYY-MM-DD HH24:MI:SS.FF'), :reason, :note, :status)`,
        {
          patient_id: Number(patient_id),
          doctor_id: Number(doctor_id),
          schedule: oracleDateTime,
          reason,
          note: note || null,
          status,
        }
      );
  };

  const advanceSequence = async () => {
    await executeQuery(`SELECT tah57.APPOINTMENT_seq.NEXTVAL as SEQ FROM DUAL`);
  };

  let attempts = 0;
  while (true) {
    try {
      await attemptInsertFull();
      break;
    } catch (error: any) {
      if (error?.code === 'ORA-00001') {
        attempts += 1;
        if (attempts >= 5) {
          throw new Error('Duplicate appointment ID after retries. Please try again.');
        }
        await advanceSequence();
        continue;
      }
      if (error.message?.includes('invalid identifier') || error.message?.includes('column')) {
        // Fallback to basic insert, with the same retry-on-duplicate logic
        let basicAttempts = 0;
        while (true) {
          try {
            await attemptInsertBasic();
            break;
          } catch (err2: any) {
            if (err2?.code === 'ORA-00001') {
              basicAttempts += 1;
              if (basicAttempts >= 5) {
                throw new Error('Duplicate appointment ID after retries. Please try again.');
              }
              await advanceSequence();
              continue;
            }
            throw err2;
          }
        }
        break;
      }
      throw error;
    }
  }

  // Get the generated appointment_id by querying the last inserted record
  let lastAppointment;
  try {
    // المحاولة مع الأعمدة الجديدة
    lastAppointment = await executeQuery<{ appointment_id: number }>(
      `SELECT appointment_id FROM TAH57.APPOINTMENTS 
       WHERE patient_id = :patient_id AND doctor_id = :doctor_id 
         AND schedule = TO_DATE(:schedule_date, 'YYYY-MM-DD')
         AND schedule_at = :schedule_at
       ORDER BY appointment_id DESC
       FETCH FIRST 1 ROWS ONLY`,
      {
        patient_id: Number(patient_id),
        doctor_id: Number(doctor_id),
        schedule_date: scheduleDate,
        schedule_at: scheduleAt,
      }
    );
  } catch (e: any) {
    if (!(e.message?.includes('invalid identifier') || e.message?.includes('column'))) {
      throw e;
    }
    // fallback للهيكل القديم
    lastAppointment = await executeQuery<{ appointment_id: number }>(
      `SELECT appointment_id FROM TAH57.APPOINTMENTS 
       WHERE patient_id = :patient_id AND doctor_id = :doctor_id AND schedule = TO_TIMESTAMP(:schedule, 'YYYY-MM-DD HH24:MI:SS.FF')
       ORDER BY appointment_id DESC
       FETCH FIRST 1 ROWS ONLY`,
      {
        patient_id: Number(patient_id),
        doctor_id: Number(doctor_id),
        schedule: oracleDateTime,
      }
    );
  }

  return {
    outBinds: {
      id: [lastAppointment.rows[0]?.appointment_id || 0]
    },
    rows: []
  };
}

/**
 * تحديث موعد
 */
export async function updateAppointment(
  id: number,
  appointment: {
    patient_id?: number;
    doctor_id?: number;
    schedule?: Date;
    reason?: string;
    note?: string;
    status?: string;
    cancellationReason?: string;
    appointment_type?: string;
    payment_status?: string;
    payment_amount?: number;
  }
) {
  const fields: string[] = [];
  const params: oracledb.BindParameters = { id }; // إصلاح المشكلة

  if (appointment.patient_id !== undefined) {
    fields.push('patient_id = :patient_id');
    params.patient_id = Number(appointment.patient_id);
  }

  if (appointment.doctor_id !== undefined) {
    fields.push('doctor_id = :doctor_id');
    params.doctor_id = Number(appointment.doctor_id);
  }

  if (appointment.schedule !== undefined) {
    fields.push(
      "schedule = TO_TIMESTAMP(:schedule, 'YYYY-MM-DD HH24:MI:SS.FF')"
    );
    params.schedule = appointment.schedule
      .toISOString()
      .replace('T', ' ')
      .replace('Z', '');
  }

  if (appointment.reason !== undefined) {
    fields.push('reason = :reason');
    params.reason = appointment.reason;
  }

  if (appointment.note !== undefined) {
    fields.push('note = :note');
    params.note = appointment.note;
  }

  if (appointment.status !== undefined) {
    fields.push('status = :status');
    params.status = appointment.status;
  }

  if (appointment.cancellationReason !== undefined) {
    fields.push('cancellationReason = :cancellationReason');
    params.cancellationReason = appointment.cancellationReason;
  }

  if (appointment.appointment_type !== undefined) {
    fields.push('appointment_type = :appointment_type');
    params.appointment_type = appointment.appointment_type;
  }

  if (appointment.payment_status !== undefined) {
    fields.push('payment_status = :payment_status');
    params.payment_status = appointment.payment_status;
  }

  if (appointment.payment_amount !== undefined) {
    fields.push('payment_amount = :payment_amount');
    params.payment_amount = appointment.payment_amount;
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  return executeQuery(
    `UPDATE TAH57.APPOINTMENTS SET ${fields.join(
      ', '
    )} WHERE appointment_id = :id`,
    params
  ).then((result) => result.rowsAffected || 0);
}


/**
 * تحديث حالة الموعد فقط - دالة منفصلة للوضوح
 */
export async function updateAppointmentStatus(
  appointmentId: number,
  status: string
): Promise<number> {
  try {
    const params: oracledb.BindParameters = {
      id: appointmentId,
      status: status
    };

    const result = await executeQuery(
      `UPDATE TAH57.APPOINTMENTS 
       SET status = :status
       WHERE appointment_id = :id`,
      params
    );

    return result.rowsAffected || 0;
  } catch (error) {
    console.error('Error updating appointment status in database:', error);
    throw error;
  }
}
/**
/**
 * حذف موعد
 */
export async function deleteAppointment(id: number) {
  return executeQuery(
    'DELETE FROM TAH57.APPOINTMENTS WHERE appointment_id = :id',
    { id }
  ).then((result) => result.rowsAffected || 0);
}

/**
 * جلب معرف الطبيب بواسطة البريد الإلكتروني للمستخدم
 * يحاول مطابقة البريد الإلكتروني مباشرة، وإذا لم يجد يحاول مطابقة جزئية
 */
export async function getDoctorIdByUserEmail(email: string) {
  // First try exact match
  let result = await executeQuery<{
    DOCTOR_ID: number;
  }>(
    `
    SELECT DOCTOR_ID 
    FROM TAH57.DOCTORS 
    WHERE UPPER(EMAIL) = UPPER(:email)`,
    { email }
  );
  
  if (result.rows.length > 0) {
    return result.rows[0].DOCTOR_ID;
  }
  
  // If no exact match, try partial match (remove numbers from email)
  const emailWithoutNumbers = email.replace(/\d/g, '');
  result = await executeQuery<{
    DOCTOR_ID: number;
  }>(
    `
    SELECT DOCTOR_ID 
    FROM TAH57.DOCTORS 
    WHERE UPPER(REGEXP_REPLACE(EMAIL, '[0-9]', '')) = UPPER(:emailWithoutNumbers)`,
    { emailWithoutNumbers }
  );
  
  return result.rows[0]?.DOCTOR_ID || null;
}

/**
 * جلب معرف المريض بواسطة البريد الإلكتروني للمستخدم
 * يحاول مطابقة البريد الإلكتروني مباشرة، وإذا لم يجد يحاول مطابقة جزئية
 */
export async function getPatientIdByUserEmail(email: string) {
  // First try exact match
  let result = await executeQuery<{
    PATIENT_ID: number;
  }>(
    `
    SELECT PATIENT_ID 
    FROM TAH57.PATIENTS 
    WHERE UPPER(EMAIL) = UPPER(:email)`,
    { email }
  );
  
  if (result.rows.length > 0) {
    return result.rows[0].PATIENT_ID;
  }
  
  // If no exact match, try partial match (remove numbers from email)
  const emailWithoutNumbers = email.replace(/\d/g, '');
  result = await executeQuery<{
    PATIENT_ID: number;
  }>(
    `
    SELECT PATIENT_ID 
    FROM TAH57.PATIENTS 
    WHERE UPPER(REGEXP_REPLACE(EMAIL, '[0-9]', '')) = UPPER(:emailWithoutNumbers)`,
    { emailWithoutNumbers }
  );
  
  return result.rows[0]?.PATIENT_ID || null;
}

// ==================== DOCTOR SCHEDULE MANAGEMENT FUNCTIONS ====================

/**
 * جلب جدول الطبيب
 */
export async function getDoctorSchedules(doctorId: number) {
  const query = `
    SELECT 
      ds.SCHEDULE_ID,
      ds.DOCTOR_ID,
      d.NAME as DOCTOR_NAME,
      d.SPECIALTY,
      ds.DAY_OF_WEEK,
      CASE ds.DAY_OF_WEEK
        WHEN 1 THEN 'الأحد'
        WHEN 2 THEN 'الاثنين'
        WHEN 3 THEN 'الثلاثاء'
        WHEN 4 THEN 'الأربعاء'
        WHEN 5 THEN 'الخميس'
        WHEN 6 THEN 'الجمعة'
        WHEN 7 THEN 'السبت'
      END as DAY_NAME_AR,
      ds.START_TIME,
      ds.END_TIME,
      ds.SLOT_DURATION,
      ds.IS_AVAILABLE,
      ds.CREATED_AT,
      ds.UPDATED_AT
    FROM TAH57.DOCTOR_SCHEDULES ds
    INNER JOIN TAH57.DOCTORS d ON ds.DOCTOR_ID = d.DOCTOR_ID
    WHERE ds.DOCTOR_ID = :doctorId
    ORDER BY ds.DAY_OF_WEEK, ds.START_TIME
  `;

  const result = await executeQuery<DoctorSchedule>(query, { doctorId });
  return result.rows;
}

/**
 * إنشاء جدول زمني جديد للطبيب
 */
export async function createDoctorSchedule(scheduleData: CreateScheduleDto) {
  const query = `
    INSERT INTO TAH57.DOCTOR_SCHEDULES (
      DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME, 
      SLOT_DURATION, IS_AVAILABLE
    ) VALUES (
      :doctor_id, :day_of_week, :start_time, :end_time, 
      :slot_duration, :is_available
    )
    RETURNING SCHEDULE_ID INTO :id
  `;

  const result = await executeReturningQuery(query, {
    doctor_id: scheduleData.doctor_id,
    day_of_week: scheduleData.day_of_week,
    start_time: scheduleData.start_time,
    end_time: scheduleData.end_time,
    slot_duration: scheduleData.slot_duration || 30,
    is_available: scheduleData.is_available || 1,
    id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
  });

  return (result.outBinds as any)?.id?.[0] || 0;
}

/**
 * تحديث جدول زمني للطبيب
 */
export async function updateDoctorSchedule(scheduleId: number, updateData: UpdateScheduleDto) {
  const fields = [];
  const params: oracledb.BindParameters = { scheduleId };

  if (updateData.day_of_week !== undefined) {
    fields.push('DAY_OF_WEEK = :day_of_week');
    params.day_of_week = updateData.day_of_week;
  }
  if (updateData.start_time !== undefined) {
    fields.push('START_TIME = :start_time');
    params.start_time = updateData.start_time;
  }
  if (updateData.end_time !== undefined) {
    fields.push('END_TIME = :end_time');
    params.end_time = updateData.end_time;
  }
  if (updateData.slot_duration !== undefined) {
    fields.push('SLOT_DURATION = :slot_duration');
    params.slot_duration = updateData.slot_duration;
  }
  if (updateData.is_available !== undefined) {
    fields.push('IS_AVAILABLE = :is_available');
    params.is_available = updateData.is_available;
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  const query = `
    UPDATE TAH57.DOCTOR_SCHEDULES 
    SET ${fields.join(', ')}
    WHERE SCHEDULE_ID = :scheduleId
  `;

  const result = await executeQuery(query, params);
  return result.rowsAffected;
}

/**
 * حذف جدول زمني للطبيب
 */
export async function deleteDoctorSchedule(scheduleId: number) {
  const query = 'DELETE FROM TAH57.DOCTOR_SCHEDULES WHERE SCHEDULE_ID = :scheduleId';
  const result = await executeQuery(query, { scheduleId });
  return result.rowsAffected;
}

/**
 * جلب الأوقات المتاحة للطبيب في يوم معين
 */
export async function getAvailableTimeSlots(doctorId: number, date: Date) {
  const dayOfWeek = date.getDay() === 0 ? 1 : date.getDay() + 1; // Convert Sunday from 0 to 1, Monday from 1 to 2, etc.
  const scheduleDate = date.toISOString().split('T')[0];
  
  // Get doctor's schedule for this day
  const scheduleQuery = `
    SELECT START_TIME, END_TIME, SLOT_DURATION, IS_AVAILABLE
    FROM TAH57.DOCTOR_SCHEDULES
    WHERE DOCTOR_ID = :doctorId 
      AND DAY_OF_WEEK = :dayOfWeek 
      AND IS_AVAILABLE = 1
    ORDER BY START_TIME
  `;

  const scheduleResult = await executeQuery<{
    START_TIME: string;
    END_TIME: string;
    SLOT_DURATION: number;
    IS_AVAILABLE: number;
  }>(scheduleQuery, { doctorId, dayOfWeek });

  if (scheduleResult.rows.length === 0) {
    return [];
  }

  // Get existing appointments for this date
  let appointmentsResult;
  try {
    // New schema: separate date + time
    appointmentsResult = await executeQuery<{
      APPOINTMENT_TIME: string;
      APPOINTMENT_ID: number;
    }>(
      `
      SELECT schedule_at as APPOINTMENT_TIME, APPOINTMENT_ID
      FROM TAH57.APPOINTMENTS
      WHERE DOCTOR_ID = :doctorId 
        AND schedule = TO_DATE(:schedule_date, 'YYYY-MM-DD')
        AND STATUS IN ('scheduled', 'pending')
      `,
      { doctorId, schedule_date: scheduleDate }
    );
  } catch (e: any) {
    if (!(e.message?.includes('invalid identifier') || e.message?.includes('column'))) {
      throw e;
    }
    // Old schema: schedule as timestamp
    appointmentsResult = await executeQuery<{
      APPOINTMENT_TIME: string;
      APPOINTMENT_ID: number;
    }>(
      `
      SELECT 
        TO_CHAR(SCHEDULE, 'HH24:MI') as APPOINTMENT_TIME,
        APPOINTMENT_ID
      FROM TAH57.APPOINTMENTS
      WHERE DOCTOR_ID = :doctorId 
        AND TRUNC(SCHEDULE) = TRUNC(:date)
        AND STATUS IN ('scheduled', 'pending')
      `,
      { doctorId, date }
    );
  }

  const bookedTimes = new Set(appointmentsResult.rows.map(apt => apt.APPOINTMENT_TIME));

  // Generate time slots
  const timeSlots: TimeSlot[] = [];
  
  for (const schedule of scheduleResult.rows) {
    const startTime = schedule.START_TIME;
    const endTime = schedule.END_TIME;
    const slotDuration = schedule.SLOT_DURATION;

    // Convert time strings to minutes for easier calculation
    const timeToMinutes = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const minutesToTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    // Generate slots
    for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes += slotDuration) {
      const slotStartTime = minutesToTime(currentMinutes);
      const slotEndTime = minutesToTime(Math.min(currentMinutes + slotDuration, endMinutes));
      
      timeSlots.push({
        start_time: slotStartTime,
        end_time: slotEndTime,
        is_available: true,
        is_booked: bookedTimes.has(slotStartTime),
        appointment_id: appointmentsResult.rows.find(apt => apt.APPOINTMENT_TIME === slotStartTime)?.APPOINTMENT_ID
      });
    }
  }

  return timeSlots;
}

/**
 * التحقق من توفر موعد في وقت معين
 */
export async function isTimeSlotAvailable(doctorId: number, date: Date, time: string) {
  const dayOfWeek = date.getDay() === 0 ? 1 : date.getDay() + 1; // Convert Sunday from 0 to 1, Monday from 1 to 2, etc.
  const scheduleDate = date.toISOString().split('T')[0];
  
  // Check if doctor has schedule for this day and time
  const scheduleQuery = `
    SELECT COUNT(*) as SCHEDULE_COUNT
    FROM TAH57.DOCTOR_SCHEDULES
    WHERE DOCTOR_ID = :doctorId 
      AND DAY_OF_WEEK = :dayOfWeek 
      AND START_TIME <= :time
      AND END_TIME > :time
      AND IS_AVAILABLE = 1
  `;

  const scheduleResult = await executeQuery<{ SCHEDULE_COUNT: number }>(
    scheduleQuery, 
    { doctorId, dayOfWeek, time }
  );

  if (scheduleResult.rows[0].SCHEDULE_COUNT === 0) {
    return false;
  }

  // Check if time slot is already booked
  let appointmentResult;
  try {
    // New schema: date + time columns
    appointmentResult = await executeQuery<{ APPOINTMENT_COUNT: number }>(
      `
      SELECT COUNT(*) as APPOINTMENT_COUNT
      FROM TAH57.APPOINTMENTS
      WHERE DOCTOR_ID = :doctorId 
        AND schedule = TO_DATE(:schedule_date, 'YYYY-MM-DD')
        AND schedule_at = :time
        AND STATUS IN ('scheduled', 'pending')
      `,
      { doctorId, schedule_date: scheduleDate, time }
    );
  } catch (e: any) {
    if (!(e.message?.includes('invalid identifier') || e.message?.includes('column'))) {
      throw e;
    }
    // Old schema
    appointmentResult = await executeQuery<{ APPOINTMENT_COUNT: number }>(
      `
      SELECT COUNT(*) as APPOINTMENT_COUNT
      FROM TAH57.APPOINTMENTS
      WHERE DOCTOR_ID = :doctorId 
        AND TRUNC(SCHEDULE) = TRUNC(:date)
        AND TO_CHAR(SCHEDULE, 'HH24:MI') = :time
        AND STATUS IN ('scheduled', 'pending')
      `,
      { doctorId, date, time }
    );
  }

  return appointmentResult.rows[0].APPOINTMENT_COUNT === 0;
}