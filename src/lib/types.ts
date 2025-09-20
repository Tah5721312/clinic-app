export interface Doctor {
  doctor_id: number;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  experience?: number;
  qualification?: string;
  image?: string;
  bio?: string;
}

export interface Patient {
  patient_id: number;
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
  primaryPhysicianName?: string;
}

export interface Appointment {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  schedule: Date;
  reason: string;
  note?: string;
  status: 'pending' | 'scheduled' | 'cancelled';
  cancellationReason?: string;
  patient_name?: string;
  doctor_name?: string;
}

// أضف هذه الأنواع في lib/database.ts أو في ملف types.ts
// تحديث أنواع البيانات لإصلاح مشاكل any
export interface OracleReturningResult {
  outBinds: {
    id?: number[];
    ID?: number[];
    [key: string]: number[] | string[] | undefined; // إصلاح مشكلة any
  };
  rows: unknown[]; // إصلاح مشكلة any
}

export interface DoctorReturningResult extends OracleReturningResult {
  outBinds: {
    id: number[];
  };
}

export interface DoctorUpdateFields {
  name?: string;
  email?: string;
  phone?: string;
  specialty?: string;
  experience?: number;
  qualification?: string;
  image?: string;
  bio?: string;
}
