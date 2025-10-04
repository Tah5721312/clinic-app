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
  REASON: string;
  NOTE?: string;
  CANCELLATIONREASON?: string;
  STATUS: 'pending' | 'scheduled' | 'cancelled';
  CANCELLATIONRESON?: string;
  PATIENT_NAME?: string;
  DOCTOR_NAME?: string;
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



// ************* users types *************

export interface RegisterUserDto {
    username: string;
    email: string;
    password: string;
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
  