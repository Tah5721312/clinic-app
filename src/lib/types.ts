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
  PAYMENT_METHOD?: string | null;
  CONSULTATION_FEE?: number;
  FOLLOW_UP_FEE?: number;
  HAS_INVOICE?: number;
  INVOICE_ID?: number | null;
  INVOICE_NUMBER?: string | null;
  INVOICE_PAYMENT_STATUS?: string | null;
}

// ========= Invoices =========
export interface Invoice {
  INVOICE_ID: number;
  INVOICE_NUMBER: string;
  INVOICE_DATE: Date;
  AMOUNT?: number; // base amount, if selected directly
  DISCOUNT: number;
  TOTAL_AMOUNT: number;
  PAID_AMOUNT: number;
  REMAINING_AMOUNT?: number;
  PAYMENT_STATUS: 'unpaid' | 'partial' | 'paid' | 'cancelled';
  PAYMENT_METHOD?: string | null;
  PAYMENT_DATE?: Date | null;
  NOTES?: string | null;
  PATIENT_ID?: number;
  PATIENT_NAME?: string;
  PATIENT_PHONE?: string;
  PATIENT_EMAIL?: string;
  APPOINTMENT_ID?: number | null;
  APPOINTMENT_DATE?: Date | null;
  DOCTOR_ID?: number | null;
  DOCTOR_NAME?: string | null;
  DOCTOR_SPECIALTY?: string | null;
  CREATED_BY_NAME?: string | null;
  CREATED_AT?: Date;
}

export interface CreateInvoiceDto {
  patient_id: number;
  appointment_id?: number;
  amount: number;
  discount?: number;
  total_amount?: number; // will be derived on server if not provided
  paid_amount?: number;
  payment_method?: string;
  notes?: string;
}

export interface MonthlyRevenueRow {
  MONTH: string; // YYYY-MM
  YEAR: string;  // YYYY
  MONTH_NAME: string;
  TOTAL_INVOICES: number;
  TOTAL_REVENUE: number;
  TOTAL_PAID: number;
  TOTAL_REMAINING: number;
  PAID_COUNT: number;
  UNPAID_COUNT: number;
  PARTIAL_COUNT: number;
}

export interface InvoiceFilters {
  patient_id?: number;
  payment_status?: 'unpaid' | 'partial' | 'paid' | 'cancelled' | string;
  date_from?: string; // YYYY-MM-DD
  date_to?: string;   // YYYY-MM-DD
  doctor_id?: number;
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
  