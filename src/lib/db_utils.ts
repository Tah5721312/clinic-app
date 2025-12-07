import oracledb from 'oracledb';

// دوال مساعدة للتعامل مع الجداول مباشرة
import { executeQuery, executeReturningQuery, getConnection } from '@/lib/database';
import { Patient, DoctorSchedule, CreateScheduleDto, UpdateScheduleDto, TimeSlot, Invoice, CreateInvoiceDto, MonthlyRevenueRow } from '@/lib/types';

/**
 * جلب جميع التخصصات من جدول SPECIALTIES
 */
export async function getAllSpecialties(activeOnly: boolean = true) {
  let query = `
    SELECT specialty_id, name, description
    FROM TAH57.SPECIALTIES
  `;
  
  const params: oracledb.BindParameters = {};
  
  // Note: activeOnly parameter is kept for compatibility but not used since is_active field is removed
  // All specialties are considered active
  
  query += ' ORDER BY name';
  
  console.log('🔍 Executing query:', query);
  console.log('🔍 Parameters:', params);
  
  const result = await executeQuery<{
    SPECIALTY_ID: number;
    NAME: string;
    DESCRIPTION?: string;
  }>(query, params);
  
  console.log('✅ Query result:', result.rows?.length || 0, 'rows');
  
  return result.rows;
}

/**
 * إضافة تخصص جديد
 */
export async function createSpecialty(name: string, description?: string) {
  console.log('➕ Creating specialty in database:', { name, description });
  
  const result = await executeReturningQuery<{ specialty_id: number }>(
    `
    INSERT INTO TAH57.SPECIALTIES (name, description)
    VALUES (:name, :description)
    RETURNING specialty_id INTO :id
    `,
    {
      name,
      description: description || null,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    }
  );
  
  // الحصول على ID من outBinds بشكل آمن
  const outBinds = result.outBinds as { id: number[] } | undefined;
  const newSpecialtyId = outBinds?.id?.[0];
  
  console.log('✅ Specialty created with ID:', newSpecialtyId);
  
  if (!newSpecialtyId) {
    throw new Error('Failed to get specialty ID after creation');
  }
  
  return newSpecialtyId;
}

/**
 * تحديث تخصص
 */
export async function updateSpecialty(specialtyId: number, name: string, description?: string, isActive?: boolean) {
  console.log('✏️ Updating specialty in database:', { specialtyId, name, description });
  
  const updates: string[] = [];
  const params: oracledb.BindParameters = { specialtyId };
  
  if (name) {
    updates.push('name = :name');
    params.name = name;
  }
  
  if (description !== undefined) {
    updates.push('description = :description');
    params.description = description || null;
  }
  
  // Note: isActive parameter is kept for compatibility but not used since is_active field is removed
  
  if (updates.length === 0) {
    console.warn('⚠️ No updates to apply');
    return;
  }
  
  const query = `
    UPDATE TAH57.SPECIALTIES
    SET ${updates.join(', ')}
    WHERE specialty_id = :specialtyId
  `;
  
  console.log('🔍 Executing update query:', query);
  console.log('🔍 Parameters:', params);
  
  await executeQuery(query, params);
  
  console.log('✅ Specialty updated successfully');
}

/**
 * حذف تخصص (hard delete - حذف فعلي)
 */
export async function deleteSpecialty(specialtyId: number) {
  console.log('🗑️ Deleting specialty from database (hard delete):', specialtyId);
  
  const query = `
    DELETE FROM TAH57.SPECIALTIES
    WHERE specialty_id = :specialtyId
  `;
  
  console.log('🔍 Executing delete query:', query);
  
  await executeQuery(query, { specialtyId });
  
  console.log('✅ Specialty deleted successfully');
}

/**
 * جلب جميع الأطباء
 */
export async function getAllDoctors(specialty?: string, name?: string) {
  let query = `
    SELECT DOCTOR_ID, NAME, EMAIL, PHONE, SPECIALTY, 
           EXPERIENCE, QUALIFICATION, IMAGE, BIO,
           CONSULTATION_FEE, IS_AVAILABLE, AVAILABILITY_UPDATED_AT
    FROM TAH57.DOCTORS`;

  const params: oracledb.BindParameters = {};
  const where: string[] = [];

  if (specialty && specialty.trim()) {
    where.push('LOWER(SPECIALTY) = :specialty');
    params.specialty = specialty.toLowerCase();
  }

  if (name && name.trim()) {
    where.push('UPPER(NAME) LIKE UPPER(:name)');
    params.name = `%${name.trim()}%`;
  }

  if (where.length > 0) {
    query += ` WHERE ${where.join(' AND ')}`;
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

/**
 * جلب المرضى من جدول APPOINTMENTS للدكتور (مرضى حجزوا معاه من قبل)
 */
export async function getPatientsFromAppointments(doctorId: number, filters?: { name?: string; identificationNumber?: string }) {
  let query = `
    SELECT DISTINCT 
      p.patient_id,
      p.name,
      p.email,
      p.phone,
      p.dateofbirth,
      p.gender,
      p.address,
      p.occupation,
      p.emergencycontactname,
      p.emergencycontactnumber,
      p.insuranceprovider,
      p.insurancepolicynumber,
      p.allergies,
      p.currentmedication,
      p.familymedicalhistory,
      p.pastmedicalhistory,
      p.identificationtype,
      p.identificationnumber,
      p.privacyconsent,
      p.treatmentconsent,
      p.disclosureconsent 
    FROM TAH57.APPOINTMENTS a
    JOIN TAH57.PATIENTS p ON a.patient_id = p.patient_id
    WHERE a.doctor_id = :doctorId
  `;

  const params: oracledb.BindParameters = { doctorId: Number(doctorId) };
  const where: string[] = [];

  if (filters?.name && filters.name.trim()) {
    where.push('UPPER(p.name) LIKE UPPER(:name)');
    params.name = `%${filters.name.trim()}%`;
  }

  if (filters?.identificationNumber && filters.identificationNumber.trim()) {
    where.push('p.identificationnumber LIKE :identificationNumber');
    params.identificationNumber = `%${filters.identificationNumber.trim()}%`;
  }

  if (where.length > 0) {
    query += ` AND ${where.join(' AND ')}`;
  }

  query += ' ORDER BY p.name';

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
  }>(query, params).then((result) => result.rows);
}

export async function getAllPatients(filters?: { doctorId?: number; specialty?: string; identificationNumber?: string; patientId?: number; name?: string; fromAppointments?: boolean }) {
  // إذا كان fromAppointments = true و doctorId موجود، استخدم الدالة الجديدة
  if (filters?.fromAppointments && filters?.doctorId) {
    return getPatientsFromAppointments(filters.doctorId, {
      name: filters.name,
      identificationNumber: filters.identificationNumber,
    });
  }

  let query = `
    SELECT p.*
    FROM TAH57.PATIENTS p`;

  const params: oracledb.BindParameters = {};
  const where: string[] = [];

  if (filters?.patientId) {
    where.push('p.patient_id = :patientId');
    params.patientId = Number(filters.patientId);
  }

  // Note: doctorId and specialty filters removed as primaryphysician is no longer used
  // Doctors get their patients from APPOINTMENTS table via getPatientsFromAppointments

  if (filters?.identificationNumber && filters.identificationNumber.trim()) {
    where.push('p.identificationnumber LIKE :identificationNumber');
    params.identificationNumber = `%${filters.identificationNumber}%`;
  }

  if (filters?.name && filters.name.trim()) {
    where.push('UPPER(p.name) LIKE UPPER(:name)');
    params.name = `%${filters.name.trim()}%`;
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
    p.DISCLOSURECONSENT
FROM TAH57.PATIENTS p
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
      insuranceprovider, insurancepolicynumber,
      allergies, currentmedication, familymedicalhistory,
      pastmedicalhistory, identificationtype, identificationnumber,
      privacyconsent, treatmentconsent, disclosureconsent
    ) VALUES (
      :name, :email, :phone, TO_DATE(:dateOfBirth, 'YYYY-MM-DD'), :gender, :address,
      :occupation, :emergencyContactName, :emergencyContactNumber,
      :insuranceProvider, :insurancePolicyNumber,
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
  invoiceNumber?: string;
  scheduleDate?: string;
}) {
  let query = `
    SELECT a.appointment_id, a.patient_id, a.doctor_id, a.schedule, a.schedule_at, a.reason, a.note, a.status, a.cancellationreason,
           NVL(a.appointment_type, 'consultation') as appointment_type,
           NVL(a.payment_status, 'unpaid') as payment_status,
           NVL(a.payment_amount, 0) as payment_amount,
           a.payment_method as payment_method,
           p.name as patient_name, d.name as doctor_name, p.identificationnumber,
           NVL(d.consultation_fee, 0) as consultation_fee,
           NVL(d.follow_up_fee, 0) as follow_up_fee,
           CASE WHEN i.invoice_id IS NOT NULL THEN 1 ELSE 0 END as has_invoice,
           i.invoice_id, i.invoice_number, i.payment_status as invoice_payment_status
    FROM TAH57.APPOINTMENTS a 
    JOIN TAH57.PATIENTS p ON a.patient_id = p.patient_id 
    JOIN TAH57.DOCTORS d ON a.doctor_id = d.doctor_id 
    LEFT JOIN TAH57.INVOICES i ON a.appointment_id = i.appointment_id
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

  if (filters?.invoiceNumber && filters.invoiceNumber.trim()) {
    where.push('i.invoice_number LIKE :invoiceNumber');
    params.invoiceNumber = `%${filters.invoiceNumber}%`;
  }

  if (filters?.scheduleDate && filters.scheduleDate.trim()) {
    where.push('TRUNC(a.schedule) = TO_DATE(:scheduleDate, \'YYYY-MM-DD\')');
    params.scheduleDate = filters.scheduleDate;
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
    SCHEDULE_AT?: string;
    REASON: string;
    NOTE: string;
    STATUS: string;
    CANCELLATIONREASON: string;
    PATIENT_NAME: string;
    DOCTOR_NAME: string;
    APPOINTMENT_TYPE: string;
    PAYMENT_STATUS: string;
    PAYMENT_AMOUNT: number;
    PAYMENT_METHOD: string | null;
    IDENTIFICATIONNUMBER: string;
    CONSULTATION_FEE: number;
    FOLLOW_UP_FEE: number;
    HAS_INVOICE: number;
    INVOICE_ID: number | null;
    INVOICE_NUMBER: string | null;
    INVOICE_PAYMENT_STATUS: string | null;
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
    SCHEDULE_AT?: string;
    REASON: string;
    NOTE: string;
    STATUS: string;
    CANCELLATIONREASON: string;
    PATIENT_NAME: string;
    DOCTOR_NAME: string;
    APPOINTMENT_TYPE: string;
    PAYMENT_STATUS: string;
    PAYMENT_AMOUNT: number;
    PAYMENT_METHOD: string | null;
    CONSULTATION_FEE: number;
    FOLLOW_UP_FEE: number;
    HAS_INVOICE: number;
    INVOICE_ID: number | null;
    INVOICE_NUMBER: string | null;
    INVOICE_PAYMENT_STATUS: string | null;
  }>(
    `
    SELECT a.appointment_id, a.patient_id, a.doctor_id, a.schedule, a.schedule_at, a.reason, a.note, a.status, a.cancellationreason,
           NVL(a.appointment_type, 'consultation') as appointment_type,
           NVL(a.payment_status, 'unpaid') as payment_status,
           NVL(a.payment_amount, 0) as payment_amount,
           a.payment_method as payment_method,
           p.name as patient_name, d.name as doctor_name,
           NVL(d.consultation_fee, 0) as consultation_fee,
           NVL(d.follow_up_fee, 0) as follow_up_fee,
           CASE WHEN i.invoice_id IS NOT NULL THEN 1 ELSE 0 END as has_invoice,
           i.invoice_id, i.invoice_number, i.payment_status as invoice_payment_status
    FROM TAH57.APPOINTMENTS a 
    JOIN TAH57.PATIENTS p ON a.patient_id = p.patient_id 
    JOIN TAH57.DOCTORS d ON a.doctor_id = d.doctor_id 
    LEFT JOIN TAH57.INVOICES i ON a.appointment_id = i.appointment_id
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
  payment_method?: string;
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
    payment_method = null,
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
        INSERT INTO TAH57.APPOINTMENTS (patient_id, doctor_id, schedule, schedule_at, reason, note, status, appointment_type, payment_status, payment_amount, payment_method) 
        VALUES (:patient_id, :doctor_id, TO_DATE(:schedule_date, 'YYYY-MM-DD'), :schedule_at, :reason, :note, :status, :appointment_type, :payment_status, :payment_amount, :payment_method)`,
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
          payment_method: payment_method || null,
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
      INSERT INTO TAH57.APPOINTMENTS (patient_id, doctor_id, schedule, reason, note, status, appointment_type, payment_status, payment_amount, payment_method) 
      VALUES (:patient_id, :doctor_id, TO_TIMESTAMP(:schedule, 'YYYY-MM-DD HH24:MI:SS.FF'), :reason, :note, :status, :appointment_type, :payment_status, :payment_amount, :payment_method)`,
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
        payment_method: payment_method || null,
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

  if (appointment.payment_amount !== undefined) {
    fields.push('payment_amount = :payment_amount');
    params.payment_amount = appointment.payment_amount;
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  // If payment_amount is being updated, calculate and update payment_status automatically
  // Only auto-calculate if payment_status is not explicitly provided
  if (appointment.payment_amount !== undefined && appointment.payment_status === undefined) {
    try {
      // Get the appointment type and the appropriate fee for this appointment
      const feeResult = await executeQuery<{ 
        APPOINTMENT_TYPE: string;
        CONSULTATION_FEE: number;
        FOLLOW_UP_FEE: number;
      }>(
        `SELECT a.APPOINTMENT_TYPE, d.CONSULTATION_FEE, d.FOLLOW_UP_FEE FROM TAH57.APPOINTMENTS a 
         JOIN TAH57.DOCTORS d ON a.DOCTOR_ID = d.DOCTOR_ID 
         WHERE a.APPOINTMENT_ID = :id`,
        { id }
      );
      
      const appointmentType = feeResult.rows[0]?.APPOINTMENT_TYPE || 'consultation';
      const consultationFee = feeResult.rows[0]?.CONSULTATION_FEE || 0;
      const followUpFee = feeResult.rows[0]?.FOLLOW_UP_FEE || 0;
      
      // Determine the correct fee based on appointment type
      const expectedFee = appointmentType === 'follow_up' ? followUpFee : consultationFee;
      const paidAmount = appointment.payment_amount || 0;
      
      // Calculate payment status
      const paymentStatus = calculatePaymentStatus(paidAmount, expectedFee);
      
      // Add payment_status to the update
      fields.push('payment_status = :payment_status');
      params.payment_status = paymentStatus;
      
      console.log(`Auto-calculating payment status for appointment ${id}: type=${appointmentType}, paid=${paidAmount}, fee=${expectedFee}, status=${paymentStatus}`);
    } catch (error) {
      console.error('Error calculating payment status for appointment:', error);
      // Don't throw error here to avoid breaking the appointment update
    }
  } else if (appointment.payment_status !== undefined) {
    // If payment_status is explicitly provided, use it
    fields.push('payment_status = :payment_status');
    params.payment_status = appointment.payment_status;
  }

  const result = await executeQuery(
    `UPDATE TAH57.APPOINTMENTS SET ${fields.join(
      ', '
    )} WHERE appointment_id = :id`,
    params
  );

  // If appointment_type was updated, update the related invoice amount if not fully paid
  if (appointment.appointment_type !== undefined) {
    try {
      // Find the invoice related to this appointment and check if it's fully paid
      const invoiceResult = await executeQuery<{ 
        INVOICE_ID: number;
        PAID_AMOUNT: number;
        PAYMENT_STATUS: string;
        AMOUNT: number;
      }>(
        `SELECT INVOICE_ID, PAID_AMOUNT, PAYMENT_STATUS, AMOUNT 
         FROM TAH57.INVOICES 
         WHERE APPOINTMENT_ID = :appointmentId`,
        { appointmentId: id }
      );
      
      if (invoiceResult.rows.length > 0) {
        const invoice = invoiceResult.rows[0];
        
        // Only update if the invoice is not fully paid
        if (invoice.PAYMENT_STATUS !== 'paid' && invoice.PAID_AMOUNT < invoice.AMOUNT) {
          console.log(`Invoice ${invoice.INVOICE_ID} is not fully paid. Updating amount based on new appointment type: ${appointment.appointment_type}`);
          
          // Get the new fee based on the updated appointment type
          const feeResult = await executeQuery<{ 
            DOCTOR_ID: number;
            CONSULTATION_FEE: number;
            FOLLOW_UP_FEE: number;
          }>(
            `SELECT a.DOCTOR_ID, d.CONSULTATION_FEE, d.FOLLOW_UP_FEE 
             FROM TAH57.APPOINTMENTS a 
             JOIN TAH57.DOCTORS d ON a.DOCTOR_ID = d.DOCTOR_ID 
             WHERE a.APPOINTMENT_ID = :id`,
            { id }
          );
          
          if (feeResult.rows.length > 0) {
            const consultationFee = feeResult.rows[0]?.CONSULTATION_FEE || 0;
            const followUpFee = feeResult.rows[0]?.FOLLOW_UP_FEE || 0;
            
            // Determine the correct fee based on the new appointment type
            const newAmount = appointment.appointment_type === 'follow_up' ? followUpFee : consultationFee;
            
            console.log(`Updating invoice amount from ${invoice.AMOUNT} to ${newAmount} based on appointment type: ${appointment.appointment_type}`);
            
            // Get current discount to calculate new total
            const discountResult = await executeQuery<{ DISCOUNT: number }>(
              `SELECT DISCOUNT FROM TAH57.INVOICES WHERE INVOICE_ID = :invoice_id`,
              { invoice_id: invoice.INVOICE_ID }
            );
            
            const currentDiscount = discountResult.rows[0]?.DISCOUNT || 0;
            const newTotalAmount = Math.max(0, newAmount - currentDiscount);
            
            // Calculate new payment status based on paid amount vs new total
            const paidAmount = invoice.PAID_AMOUNT || 0;
            let newPaymentStatus = 'unpaid';
            
            if (paidAmount >= newTotalAmount && newTotalAmount > 0) {
              newPaymentStatus = 'paid';
            } else if (paidAmount > 0) {
              newPaymentStatus = 'partial';
            }
            
            console.log(`Recalculating payment status: paid=${paidAmount}, newTotal=${newTotalAmount}, status=${newPaymentStatus}`);
            
            // Update the invoice amount, total, and payment status
            await executeQuery(
              `UPDATE TAH57.INVOICES 
               SET AMOUNT = :new_amount,
                   TOTAL_AMOUNT = :new_total_amount,
                   PAYMENT_STATUS = :payment_status
               WHERE INVOICE_ID = :invoice_id`,
              { 
                invoice_id: invoice.INVOICE_ID,
                new_amount: newAmount,
                new_total_amount: newTotalAmount,
                payment_status: newPaymentStatus
              }
            );
            
            console.log(`Successfully updated invoice ${invoice.INVOICE_ID}: amount=${newAmount}, total=${newTotalAmount}, status=${newPaymentStatus}`);
          }
        } else {
          console.log(`Invoice ${invoice.INVOICE_ID} is already paid. Skipping amount update.`);
        }
      }
    } catch (error) {
      console.error('Error updating invoice amount when appointment type changed:', error);
      // Don't throw error here to avoid breaking the appointment update
    }
  }

  // If payment_amount was updated, also update the related invoice's payment status
  if (appointment.payment_amount !== undefined) {
    try {
      // Find the invoice related to this appointment
      const invoiceResult = await executeQuery<{ 
        INVOICE_ID: number;
        TOTAL_AMOUNT: number;
      }>(
        `SELECT INVOICE_ID, TOTAL_AMOUNT FROM TAH57.INVOICES WHERE APPOINTMENT_ID = :appointmentId`,
        { appointmentId: id }
      );
      
      if (invoiceResult.rows.length > 0) {
        const invoice = invoiceResult.rows[0];
        const paidAmount = appointment.payment_amount || 0;
        
        // Calculate payment status for invoice
        const paymentStatus = calculatePaymentStatus(paidAmount, invoice.TOTAL_AMOUNT);
        
        // Update the invoice's payment information
        await executeQuery(
          `UPDATE TAH57.INVOICES 
           SET PAID_AMOUNT = :paid_amount, 
               PAYMENT_STATUS = :payment_status
           WHERE INVOICE_ID = :invoice_id`,
          { 
            invoice_id: invoice.INVOICE_ID,
            paid_amount: paidAmount, 
            payment_status: paymentStatus
          }
        );
        
        console.log(`Updated invoice ${invoice.INVOICE_ID} payment status to ${paymentStatus} based on appointment payment`);
      }
    } catch (error) {
      console.error('Error updating invoice payment status from appointment:', error);
      // Don't throw error here to avoid breaking the appointment update
    }
  }

  return result.rowsAffected || 0;
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

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate payment status based on paid amount and total amount
 */
function calculatePaymentStatus(paidAmount: number, totalAmount: number): 'paid' | 'partial' | 'unpaid' {
  if (paidAmount >= totalAmount) {
    return 'paid';
  } else if (paidAmount > 0) {
    return 'partial';
  } else {
    return 'unpaid';
  }
}

// ==================== INVOICES ====================

export async function getAllInvoices(filters?: {
  patient_id?: number;
  payment_status?: string;
  date_from?: string; // YYYY-MM-DD
  date_to?: string;   // YYYY-MM-DD
  doctor_id?: number;
  identificationNumber?: string;
}): Promise<Invoice[]> {
  // Prefer the view for enriched data
  let query = `
    SELECT 
      i.INVOICE_ID,
      i.INVOICE_NUMBER,
      i.INVOICE_DATE,
      i.NOTES,
      i.TOTAL_AMOUNT,
      i.PAID_AMOUNT,
      (i.TOTAL_AMOUNT - i.PAID_AMOUNT) AS REMAINING_AMOUNT,
      i.PAYMENT_STATUS,
      i.PAYMENT_METHOD,
      i.PAYMENT_DATE,
      i.PATIENT_ID,
      i.APPOINTMENT_ID,
      p.NAME AS PATIENT_NAME,
      p.PHONE AS PATIENT_PHONE,
      p.EMAIL AS PATIENT_EMAIL,
      a.SCHEDULE AS APPOINTMENT_DATE,
      d.DOCTOR_ID,
      d.NAME AS DOCTOR_NAME,
      d.SPECIALTY AS DOCTOR_SPECIALTY,
      u.FULL_NAME AS CREATED_BY_NAME,
      i.CREATED_AT
    FROM TAH57.INVOICES i
    INNER JOIN TAH57.PATIENTS p ON i.PATIENT_ID = p.PATIENT_ID
    LEFT JOIN TAH57.APPOINTMENTS a ON i.APPOINTMENT_ID = a.APPOINTMENT_ID
    LEFT JOIN TAH57.DOCTORS d ON a.DOCTOR_ID = d.DOCTOR_ID
    LEFT JOIN TAH57.USERS u ON i.CREATED_BY = u.USER_ID`;

  const whereClauses: string[] = [];
  const params: any = {};

  if (filters?.patient_id) {
    whereClauses.push('i.PATIENT_ID = :patient_id');
    params.patient_id = filters.patient_id;
  }
  if (filters?.payment_status) {
    whereClauses.push('i.PAYMENT_STATUS = :payment_status');
    params.payment_status = filters.payment_status;
  }
  if (filters?.date_from) {
    whereClauses.push("i.INVOICE_DATE >= TO_DATE(:date_from, 'YYYY-MM-DD')");
    params.date_from = filters.date_from;
  }
  if (filters?.date_to) {
    whereClauses.push("i.INVOICE_DATE <= TO_DATE(:date_to, 'YYYY-MM-DD')");
    params.date_to = filters.date_to;
  }
  if (filters?.doctor_id) {
    whereClauses.push('d.DOCTOR_ID = :doctor_id');
    params.doctor_id = filters.doctor_id;
  }

  if (filters?.identificationNumber && filters.identificationNumber.trim()) {
    whereClauses.push('p.IDENTIFICATIONNUMBER LIKE :identificationNumber');
    params.identificationNumber = `%${filters.identificationNumber}%`;
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  query += ' ORDER BY i.INVOICE_DATE DESC, i.INVOICE_ID DESC';

  const result = await executeQuery<Invoice>(query, params);
  return result.rows;
}

export async function getInvoiceById(invoiceId: number): Promise<Invoice | null> {
  const result = await executeQuery<Invoice>(
    `
    SELECT 
      i.INVOICE_ID,
      i.INVOICE_NUMBER,
      i.INVOICE_DATE,
      i.AMOUNT,
      i.DISCOUNT,
      i.TOTAL_AMOUNT,
      i.PAID_AMOUNT,
      i.NOTES,
      (i.TOTAL_AMOUNT - i.PAID_AMOUNT) AS REMAINING_AMOUNT,
      i.PAYMENT_STATUS,
      i.PAYMENT_METHOD,
      i.PAYMENT_DATE,
      i.PATIENT_ID,
      i.APPOINTMENT_ID,
      p.NAME AS PATIENT_NAME,
      p.PHONE AS PATIENT_PHONE,
      p.EMAIL AS PATIENT_EMAIL,
      a.SCHEDULE AS APPOINTMENT_DATE,
      d.DOCTOR_ID,
      d.NAME AS DOCTOR_NAME,
      d.SPECIALTY AS DOCTOR_SPECIALTY,
      u.FULL_NAME AS CREATED_BY_NAME,
      i.CREATED_AT
    FROM TAH57.INVOICES i
    INNER JOIN TAH57.PATIENTS p ON i.PATIENT_ID = p.PATIENT_ID
    LEFT JOIN TAH57.APPOINTMENTS a ON i.APPOINTMENT_ID = a.APPOINTMENT_ID
    LEFT JOIN TAH57.DOCTORS d ON a.DOCTOR_ID = d.DOCTOR_ID
    LEFT JOIN TAH57.USERS u ON i.CREATED_BY = u.USER_ID
    WHERE i.INVOICE_ID = :invoiceId
  `,
    { invoiceId }
  );
  return result.rows[0] || null;
}

export async function createInvoice(
  data: CreateInvoiceDto,
  createdBy?: number
): Promise<number> {
  // If appointment_id is provided, fetch the appointment to get appointment_type and calculate the correct fee
  let calculatedAmount = data.amount;
  let appointmentType = '';
  let doctorId = 0;
  
  if (data.appointment_id) {
    try {
      const appointmentResult = await executeQuery<{
        APPOINTMENT_TYPE: string;
        DOCTOR_ID: number;
      }>(
        `SELECT APPOINTMENT_TYPE, DOCTOR_ID FROM TAH57.APPOINTMENTS WHERE APPOINTMENT_ID = :appointment_id`,
        { appointment_id: data.appointment_id }
      );
      
      if (appointmentResult.rows.length > 0) {
        appointmentType = appointmentResult.rows[0].APPOINTMENT_TYPE || 'consultation';
        doctorId = appointmentResult.rows[0].DOCTOR_ID;
        
        // Fetch the correct fee based on appointment type
        const feeColumn = appointmentType === 'follow_up' ? 'FOLLOW_UP_FEE' : 'CONSULTATION_FEE';
        const doctorResult = await executeQuery<{ FEE: number }>(
          `SELECT ${feeColumn} as FEE FROM TAH57.DOCTORS WHERE DOCTOR_ID = :doctor_id`,
          { doctor_id: doctorId }
        );
        
        if (doctorResult.rows.length > 0 && doctorResult.rows[0].FEE) {
          calculatedAmount = doctorResult.rows[0].FEE;
          console.log(`Automatically setting invoice amount to ${calculatedAmount} based on appointment type: ${appointmentType}`);
        }
      }
    } catch (error) {
      console.error('Error fetching appointment/doctor details for invoice:', error);
      // Continue with provided amount if error occurs
    }
  }
  
  const total = Math.max(0, (data.total_amount ?? calculatedAmount - (data.discount || 0)));
  const paid = data.paid_amount ?? 0;
  const result = await executeReturningQuery(
    `
    INSERT INTO TAH57.INVOICES (
      PATIENT_ID, APPOINTMENT_ID, INVOICE_NUMBER, INVOICE_DATE,
      AMOUNT, DISCOUNT, TOTAL_AMOUNT, PAID_AMOUNT, PAYMENT_STATUS,
      PAYMENT_METHOD, PAYMENT_DATE, NOTES, CREATED_BY
    ) VALUES (
      :patient_id, :appointment_id, NULL, SYSDATE,
      :amount, :discount, :total_amount, :paid_amount, NULL,
      :payment_method, CASE WHEN :paid_amount > 0 THEN SYSDATE ELSE NULL END, :notes, :created_by
    ) RETURNING INVOICE_ID INTO :id
  `,
    {
      patient_id: data.patient_id,
      appointment_id: data.appointment_id || null,
      amount: calculatedAmount,
      discount: data.discount ?? 0,
      total_amount: total,
      paid_amount: paid,
      payment_method: data.payment_method || null,
      notes: data.notes || null,
      created_by: createdBy || null,
      id: { dir: (oracledb as any).BIND_OUT, type: (oracledb as any).NUMBER },
    }
  );

  const outBinds = result.outBinds as { id?: number[] } | undefined;
  const newId = outBinds?.id?.[0];
  if (!newId) throw new Error('Failed to retrieve new invoice id');
  
  // If there's an appointment_id, update the appointment's payment information
  if (data.appointment_id) {
    try {
      let expectedFee = calculatedAmount; // Use the calculated amount based on appointment type
      
      // Calculate payment status based on paid_amount and expected fee
      let paymentStatus = 'unpaid';
      
      if (paid >= expectedFee) {
        paymentStatus = 'paid';
      } else if (paid > 0) {
        paymentStatus = 'partial';
      }
      
      // Update the appointment's payment information
      await executeQuery(
        `UPDATE TAH57.APPOINTMENTS 
         SET PAYMENT_AMOUNT = :paid_amount, 
             PAYMENT_METHOD = :payment_method,
             PAYMENT_STATUS = :payment_status
         WHERE APPOINTMENT_ID = :appointment_id`,
        { 
          appointment_id: data.appointment_id, 
          paid_amount: paid, 
          payment_method: data.payment_method || null,
          payment_status: paymentStatus
        }
      );
    } catch (error) {
      console.error('Error updating appointment payment info during invoice creation:', error);
      // Don't throw error here to avoid breaking the invoice creation
    }
  }
  
  return newId;
}

export async function updateInvoice(invoiceId: number, data: Partial<CreateInvoiceDto>): Promise<number> {
  const fields: string[] = [];
  const params: any = { invoiceId };
  if (data.patient_id !== undefined) { fields.push('PATIENT_ID = :patient_id'); params.patient_id = data.patient_id; }
  if (data.appointment_id !== undefined) { fields.push('APPOINTMENT_ID = :appointment_id'); params.appointment_id = data.appointment_id || null; }
  if (data.amount !== undefined) { fields.push('AMOUNT = :amount'); params.amount = data.amount; }
  if (data.discount !== undefined) { fields.push('DISCOUNT = :discount'); params.discount = data.discount ?? 0; }
  if (data.total_amount !== undefined) { fields.push('TOTAL_AMOUNT = :total_amount'); params.total_amount = Math.max(0, data.total_amount); }
  if (data.paid_amount !== undefined) { fields.push('PAID_AMOUNT = :paid_amount'); params.paid_amount = Math.max(0, data.paid_amount ?? 0); }
  if (data.payment_method !== undefined) { fields.push('PAYMENT_METHOD = :payment_method'); params.payment_method = data.payment_method || null; }
  if (data.notes !== undefined) { fields.push('NOTES = :notes'); params.notes = data.notes || null; }

  // If amount or discount is provided and total_amount is not explicitly provided,
  // recalculate TOTAL_AMOUNT in the database as GREATEST(0, amount - discount)
  const shouldRecalculateTotal =
    data.total_amount === undefined && (data.amount !== undefined || data.discount !== undefined);

  if (shouldRecalculateTotal) {
    // Provide bind values for recalculation without overriding AMOUNT/DISCOUNT when not passed
    if (data.amount !== undefined) params.amount_for_total = data.amount;
    if (data.discount !== undefined) params.discount_for_total = data.discount ?? 0;
    fields.push(
      `TOTAL_AMOUNT = GREATEST(0, NVL(:amount_for_total, AMOUNT) - NVL(:discount_for_total, DISCOUNT))`
    );
  }

  if (fields.length === 0) return 0;

  const result = await executeQuery(
    `UPDATE TAH57.INVOICES SET ${fields.join(', ')} WHERE INVOICE_ID = :invoiceId`,
    params
  );

  // If paid_amount or payment_method was updated, also update the related appointment
  if (data.paid_amount !== undefined || data.payment_method !== undefined) {
    try {
      // Get the appointment_id and total_amount for this invoice
      const invoiceResult = await executeQuery<{ 
        APPOINTMENT_ID: number | null;
        TOTAL_AMOUNT: number;
      }>(
        `SELECT APPOINTMENT_ID, TOTAL_AMOUNT FROM TAH57.INVOICES WHERE INVOICE_ID = :invoiceId`,
        { invoiceId }
      );
      
      const appointmentId = invoiceResult.rows[0]?.APPOINTMENT_ID;
      const totalAmount = invoiceResult.rows[0]?.TOTAL_AMOUNT || 0;
      
      if (appointmentId) {
      // Calculate payment status based on paid_amount and total_amount
      const paidAmount = Math.max(0, data.paid_amount ?? 0);
      const paymentStatus = calculatePaymentStatus(paidAmount, totalAmount);
        
        // Update the appointment's payment information
        const appointmentFields: string[] = [];
        const appointmentParams: any = { appointmentId };
        
        if (data.paid_amount !== undefined) {
          appointmentFields.push('PAYMENT_AMOUNT = :paid_amount');
          appointmentParams.paid_amount = paidAmount;
        }
        
        if (data.payment_method !== undefined) {
          appointmentFields.push('PAYMENT_METHOD = :payment_method');
          appointmentParams.payment_method = data.payment_method || null;
        }
        
        // Always update payment status when paid_amount changes
        if (data.paid_amount !== undefined) {
          appointmentFields.push('PAYMENT_STATUS = :payment_status');
          appointmentParams.payment_status = paymentStatus;
        }
        
        if (appointmentFields.length > 0) {
          await executeQuery(
            `UPDATE TAH57.APPOINTMENTS SET ${appointmentFields.join(', ')} WHERE APPOINTMENT_ID = :appointmentId`,
            appointmentParams
          );
        }
      }
    } catch (error) {
      console.error('Error updating appointment payment info:', error);
      // Don't throw error here to avoid breaking the invoice update
    }
  }

  return result.rowsAffected || 0;
}

export async function updateInvoicePayment(invoiceId: number, paidAmount: number, paymentMethod?: string): Promise<number> {
  const result = await executeQuery(
    `
    UPDATE TAH57.INVOICES
    SET PAID_AMOUNT = :paid_amount,
        PAYMENT_METHOD = :payment_method,
        PAYMENT_DATE = CASE WHEN :paid_amount > 0 THEN SYSDATE ELSE PAYMENT_DATE END
    WHERE INVOICE_ID = :invoiceId
  `,
    { invoiceId, paid_amount: paidAmount, payment_method: paymentMethod || null }
  );

  // Also update the related appointment's payment information
  try {
    // Get the appointment_id and total_amount for this invoice
    const invoiceResult = await executeQuery<{ 
      APPOINTMENT_ID: number | null;
      TOTAL_AMOUNT: number;
    }>(
      `SELECT APPOINTMENT_ID, TOTAL_AMOUNT FROM TAH57.INVOICES WHERE INVOICE_ID = :invoiceId`,
      { invoiceId }
    );
    
    const appointmentId = invoiceResult.rows[0]?.APPOINTMENT_ID;
    const totalAmount = invoiceResult.rows[0]?.TOTAL_AMOUNT || 0;
    
    if (appointmentId) {
      // Calculate payment status based on paid_amount and total_amount
      const paymentStatus = calculatePaymentStatus(paidAmount, totalAmount);
      
      // Update the appointment's payment information
      await executeQuery(
        `UPDATE TAH57.APPOINTMENTS 
         SET PAYMENT_AMOUNT = :paid_amount, 
             PAYMENT_METHOD = :payment_method,
             PAYMENT_STATUS = :payment_status
         WHERE APPOINTMENT_ID = :appointmentId`,
        { 
          appointmentId, 
          paid_amount: paidAmount, 
          payment_method: paymentMethod || null,
          payment_status: paymentStatus
        }
      );
    }
  } catch (error) {
    console.error('Error updating appointment payment info:', error);
    // Don't throw error here to avoid breaking the invoice update
  }

  return result.rowsAffected || 0;
}

export async function deleteInvoice(invoiceId: number): Promise<number> {
  const result = await executeQuery(
    'DELETE FROM TAH57.INVOICES WHERE INVOICE_ID = :invoiceId',
    { invoiceId }
  );
  return result.rowsAffected || 0;
}

export async function getMonthlyRevenue(): Promise<MonthlyRevenueRow[]> {
  // Prefer the view if it exists; fall back to aggregation
  try {
    const viewRes = await executeQuery<MonthlyRevenueRow>(
      'SELECT * FROM TAH57.VW_MONTHLY_REVENUE'
    );
    return viewRes.rows;
  } catch (e: any) {
    if (!(e.message?.includes('not found') || e.message?.includes('invalid'))) throw e;
    const res = await executeQuery<MonthlyRevenueRow>(
      `
      SELECT 
        TO_CHAR(INVOICE_DATE, 'YYYY-MM') AS MONTH,
        TO_CHAR(INVOICE_DATE, 'YYYY') AS YEAR,
        TO_CHAR(INVOICE_DATE, 'Month', 'NLS_DATE_LANGUAGE=ARABIC') AS MONTH_NAME,
        COUNT(*) AS TOTAL_INVOICES,
        SUM(TOTAL_AMOUNT) AS TOTAL_REVENUE,
        SUM(PAID_AMOUNT) AS TOTAL_PAID,
        SUM(TOTAL_AMOUNT - PAID_AMOUNT) AS TOTAL_REMAINING,
        SUM(CASE WHEN PAYMENT_STATUS = 'paid' THEN 1 ELSE 0 END) AS PAID_COUNT,
        SUM(CASE WHEN PAYMENT_STATUS = 'unpaid' THEN 1 ELSE 0 END) AS UNPAID_COUNT,
        SUM(CASE WHEN PAYMENT_STATUS = 'partial' THEN 1 ELSE 0 END) AS PARTIAL_COUNT
      FROM TAH57.INVOICES
      GROUP BY TO_CHAR(INVOICE_DATE, 'YYYY-MM'), 
               TO_CHAR(INVOICE_DATE, 'YYYY'),
               TO_CHAR(INVOICE_DATE, 'Month', 'NLS_DATE_LANGUAGE=ARABIC')
      ORDER BY TO_CHAR(INVOICE_DATE, 'YYYY-MM') DESC
      `
    );
    return res.rows;
  }
}

/**
 * جلب إجمالي الإيرادات
 */
export async function getTotalRevenue(): Promise<number> {
  const result = await executeQuery<{ TOTAL_REVENUE: number }>(
    `SELECT SUM(TOTAL_AMOUNT) AS TOTAL_REVENUE FROM TAH57.INVOICES`
  );
  return result.rows[0]?.TOTAL_REVENUE || 0;
}

/**
 * جلب إجمالي الإيرادات الشهرية (الشهر الحالي)
 */
export async function getCurrentMonthRevenue(): Promise<number> {
  const result = await executeQuery<{ MONTHLY_REVENUE: number }>(
    `SELECT SUM(TOTAL_AMOUNT) AS MONTHLY_REVENUE 
     FROM TAH57.INVOICES 
     WHERE TO_CHAR(INVOICE_DATE, 'YYYY-MM') = TO_CHAR(SYSDATE, 'YYYY-MM')`
  );
  return result.rows[0]?.MONTHLY_REVENUE || 0;
}

/**
 * جلب إجمالي الإيرادات اليومية (اليوم الحالي)
 */
export async function getCurrentDayRevenue(): Promise<number> {
  const result = await executeQuery<{ DAILY_REVENUE: number }>(
    `SELECT SUM(TOTAL_AMOUNT) AS DAILY_REVENUE 
     FROM TAH57.INVOICES 
     WHERE TRUNC(INVOICE_DATE) = TRUNC(SYSDATE)`
  );
  return result.rows[0]?.DAILY_REVENUE || 0;
}

/**
 * جلب إجمالي الإيرادات المدفوعة
 */
export async function getTotalPaidRevenue(): Promise<number> {
  const result = await executeQuery<{ TOTAL_PAID: number }>(
    `SELECT SUM(PAID_AMOUNT) AS TOTAL_PAID FROM TAH57.INVOICES`
  );
  return result.rows[0]?.TOTAL_PAID || 0;
}

/**
 * جلب إجمالي الإيرادات المتبقية (غير المدفوعة)
 */
export async function getTotalRemainingRevenue(): Promise<number> {
  const result = await executeQuery<{ TOTAL_REMAINING: number }>(
    `SELECT SUM(TOTAL_AMOUNT - PAID_AMOUNT) AS TOTAL_REMAINING FROM TAH57.INVOICES`
  );
  return result.rows[0]?.TOTAL_REMAINING || 0;
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