import oracledb from 'oracledb';

// دوال مساعدة للتعامل مع الجداول مباشرة
import { executeQuery, executeReturningQuery } from '@/lib/database';

/**
 * جلب جميع الأطباء
 */
export async function getAllDoctors() {
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
  }>(`
    SELECT doctor_id, name, email, phone, specialty, 
           experience, qualification, image, bio 
    FROM TAH57.DOCTORS 
    ORDER BY name`).then((result) => result.rows);
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
  }>(
    `
    SELECT doctor_id, name, email, phone, specialty, 
           experience, qualification, image, bio 
    FROM TAH57.DOCTORS 
    WHERE doctor_id = :id`,
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
}) {
  const result = await executeReturningQuery<{ doctor_id: number }>(
    `
    INSERT INTO TAH57.DOCTORS (name, email, phone, specialty, experience, qualification, image, bio) 
    VALUES (:name, :email, :phone, :specialty, :experience, :qualification, :image, :bio) 
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
 * جلب جميع المرضى
 */
export async function getAllPatients() {
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
    PRIMARY_PHYSICIAN_NAME: string;
  }>(`
    SELECT p.*, d.name as primary_physician_name 
    FROM TAH57.PATIENTS p 
    LEFT JOIN TAH57.DOCTORS d ON p.primaryphysician = d.doctor_id 
    ORDER BY p.name`).then((result) => result.rows);
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
    PRIMARY_PHYSICIAN_NAME: string;
  }>(
    `
    SELECT p.*, d.name as primary_physician_name 
    FROM TAH57.PATIENTS p 
    LEFT JOIN TAH57.DOCTORS d ON p.primaryphysician = d.doctor_id 
    WHERE p.patient_id = :id`,
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
    name?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: Date | string;
    gender?: string;
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
    privacyConsent?: boolean;
    treatmentConsent?: boolean;
    disclosureConsent?: boolean;
  }
) {
  // إنشاء كائن للربط بين اسم الجدول في DB واسم الحقل في JS
  const fieldMappings: Record<string, string> = {
    name: 'NAME',
    email: 'EMAIL',
    phone: 'PHONE',
    dateOfBirth: 'DATEOFBIRTH',
    gender: 'GENDER',
    address: 'ADDRESS',
    occupation: 'OCCUPATION',
    emergencyContactName: 'EMERGENCYCONTACTNAME',
    emergencyContactNumber: 'EMERGENCYCONTACTNUMBER',
    primaryPhysician: 'PRIMARYPHYSICIAN',
    insuranceProvider: 'INSURANCEPROVIDER',
    insurancePolicyNumber: 'INSURANCEPOLICYNUMBER',
    allergies: 'ALLERGIES',
    currentMedication: 'CURRENTMEDICATION',
    familyMedicalHistory: 'FAMILYMEDICALHISTORY',
    pastMedicalHistory: 'PASTMEDICALHISTORY',
    identificationType: 'IDENTIFICATIONTYPE',
    identificationNumber: 'IDENTIFICATIONNUMBER',
    privacyConsent: 'PRIVACYCONSENT',
    treatmentConsent: 'TREATMENTCONSENT',
    disclosureConsent: 'DISCLOSURECONSENT',
  };

  const setClauses: string[] = [];
  const bindParams: oracledb.BindParameters = { id };

  // بناء جمل SET وعوامل الربط
  Object.entries(patient).forEach(([key, value]) => {
    if (value !== undefined && fieldMappings[key]) {
      const dbFieldName = fieldMappings[key];
      const bindParamName = key;

      if (key === 'dateOfBirth') {
        if (typeof value === 'string' || value instanceof Date) {
          const dateValue = new Date(value);
          setClauses.push(
            `${dbFieldName} = TO_DATE(:${bindParamName}, 'YYYY-MM-DD')`
          );
          bindParams[bindParamName] = dateValue.toISOString().split('T')[0];
        }
      } else if (
        ['privacyConsent', 'treatmentConsent', 'disclosureConsent'].includes(
          key
        )
      ) {
        setClauses.push(`${dbFieldName} = :${bindParamName}`);
        bindParams[bindParamName] =
          typeof value === 'boolean' ? (value ? 1 : 0) : value;
      } else {
        setClauses.push(`${dbFieldName} = :${bindParamName}`);
        // تأكد من أن القيمة متوافقة مع نوع Oracle binding parameter
        bindParams[bindParamName] =
          typeof value === 'boolean' ? (value ? 1 : 0) : value;
      }
    }
  });

  if (setClauses.length === 0) {
    throw new Error('No fields to update');
  }

  const query = `UPDATE TAH57.PATIENTS SET ${setClauses.join(
    ', '
  )} WHERE PATIENT_ID = :id`;

  const result = await executeQuery(query, bindParams);
  return result.rowsAffected || 0;
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
export async function getAllAppointments(doctorId?: number) {
  let query = `
    SELECT a.*, p.name as patient_name, d.name as doctor_name 
    FROM TAH57.APPOINTMENTS a 
    JOIN TAH57.PATIENTS p ON a.patient_id = p.patient_id 
    JOIN TAH57.DOCTORS d ON a.doctor_id = d.doctor_id 
  `;

  const params: oracledb.BindParameters = {};

  if (doctorId) {
    query += ' WHERE a.doctor_id = :doctorId';
    params.doctorId = doctorId;
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
  }>(
    `
    SELECT a.*, p.name as patient_name, d.name as doctor_name 
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
}) {
  const {
    patient_id,
    doctor_id,
    schedule,
    reason,
    note,
    status = 'pending',
  } = appointment;

  // تحويل التاريخ إلى تنسيق Oracle
  const oracleDate = schedule.toISOString().replace('T', ' ').replace('Z', '');

  return executeReturningQuery(
    `
    INSERT INTO TAH57.APPOINTMENTS (patient_id, doctor_id, schedule, reason, note, status) 
    VALUES (:patient_id, :doctor_id, TO_TIMESTAMP(:schedule, 'YYYY-MM-DD HH24:MI:SS.FF'), :reason, :note, :status) 
    RETURNING appointment_id INTO :id`,
    {
      patient_id: Number(patient_id),
      doctor_id: Number(doctor_id),
      schedule: oracleDate,
      reason,
      note: note || null,
      status,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    }
  );
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
/**
 * حذف موعد
 */
export async function deleteAppointment(id: number) {
  return executeQuery(
    'DELETE FROM TAH57.APPOINTMENTS WHERE appointment_id = :id',
    { id }
  ).then((result) => result.rowsAffected || 0);
}
