export interface Doctor {
  DOCTOR_ID: number;
  NAME: string;
  EMAIL: string;
  PHONE: string;
  SPECIALTY: string;
  EXPERIENCE: number | null;
  QUALIFICATION: string | null;
  IMAGE: string | null;
  BIO: string | null;
  CONSULTATION_FEE: number | null;
  IS_AVAILABLE: number | null;
  AVAILABILITY_UPDATED_AT: Date | null;
}

export interface Patient {
  PATIENT_ID: number;
  NAME: string;
  EMAIL: string;
  PHONE: string;
  DATEOFBIRTH?: Date | string | null;
  GENDER?: string | null;
  ADDRESS?: string | null;
  OCCUPATION?: string | null;
  EMERGENCYCONTACTNAME?: string | null;
  EMERGENCYCONTACTNUMBER?: string | null;
  PRIMARYPHYSICIAN?: number | null;
  INSURANCEPROVIDER?: string | null;
  INSURANCEPOLICYNUMBER?: string | null;
  ALLERGIES?: string | null;
  CURRENTMEDICATION?: string | null;
  FAMILYMEDICALHISTORY?: string | null;
  PASTMEDICALHISTORY?: string | null;
  IDENTIFICATIONTYPE?: string | null;
  IDENTIFICATIONNUMBER?: string | null;
  PRIVACYCONSENT?: number | null;
  TREATMENTCONSENT?: number | null;
  DISCLOSURECONSENT?: number | null;
  PRIMARYPHYSICIANNAME?: string;
}

export interface Appointment {
  APPOINTMENT_ID: number;
  PATIENT_ID: number;
  DOCTOR_ID: number;
  SCHEDULE: Date;
  SCHEDULE_AT?: string; // HH:MM when present in new schema
  REASON: string;
  NOTE?: string;
  CANCELLATIONREASON?: string;
  STATUS: 'pending' | 'scheduled' | 'cancelled';
  CANCELLATIONRESON?: string;
  PATIENT_NAME?: string;
  DOCTOR_NAME?: string;
  APPOINTMENT_TYPE: 'consultation' | 'follow_up' | 'emergency';
  PAYMENT_STATUS: 'unpaid' | 'partial' | 'paid' | 'refunded';
  PAYMENT_AMOUNT: number | null;
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
  consultation_fee?: number;
  is_available?: number;
  availability_updated_at?: Date;
}

// Doctor Schedule Types
export interface DoctorSchedule {
  SCHEDULE_ID: number;
  DOCTOR_ID: number;
  DOCTOR_NAME?: string;
  SPECIALTY?: string;
  DAY_OF_WEEK: number;
  DAY_NAME_AR?: string;
  START_TIME: string;
  END_TIME: string;
  SLOT_DURATION: number;
  IS_AVAILABLE: number;
  CREATED_AT: Date;
  UPDATED_AT: Date;
}

export interface CreateScheduleDto {
  doctor_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration?: number;
  is_available?: number;
}

export interface UpdateScheduleDto {
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  slot_duration?: number;
  is_available?: number;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_booked?: boolean;
  appointment_id?: number;
}



// ************* users types *************

export interface RegisterUserDto {
    username: string;
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
}

export interface LoginUserDto {
    email: string;
    password: string;
}

export interface UpdateUserDto {
    username?: string;
    email?: string;
    password?: string;
}



export interface UserFromDB {
  ID: number;
  USERNAME: string;
  EMAIL: string;
  PASSWORD?: string;
  ISADMIN?: number;
  CREATED_AT?: Date;
}

// نوع البيانات الراجعة من الـ JWT
export interface JwtPayload {
  id: number;
  username: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

export interface UserInfoCardProps {
  user: JWTPayload;
  fullUserData?: {
    ID: number;
    USERNAME: string;
    EMAIL: string;
    IS_ADMIN: number;
    CREATED_AT: Date;
    ROLE_ID?: number;
  } | null;
}

// JWT Payload زي ما انت كاتب بالظبط
export type JWTPayload = {
    id: number;
    isAdmin: boolean;
    username: string;
  };
  

    export type UploadedImage = {
    RKM_MLF: number;
    SERIAL: number;
    NAME: string;
    IMAGENAME: string;
    FILE_PATH: string;
    IMAGE_NUMBER: number;
    CREATED_AT: Date;
  }
  