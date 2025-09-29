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

//  السجل الطبى للمريض   
export interface MedicalRecord {
  MEDICALRECORDID: number;
  PATIENT_ID: number;           // ارتباط بالمريض
  DOCTOR_ID: number;            // الطبيب اللي كتب السجل
  DIAGNOSIS: string;            // التشخيص
  SYMPTOMS: string[];           // الأعراض
  MEDICATIONS: string[];        // الأدوية الموصوفة
  TREATMENTPLAN: string;       // خطة العلاج
  NOTES?: string;               // ملاحظات إضافية
  BLOODPRESSURE: string;       // ضغط الدم
  TEMPERATURE: number;          // درجة الحرارة
  IMAGES?: string[];            // الصور الإشعاعية
  HEIGHT: number;               // الطول
  WEIGHT: number;               // الوزن
  CREATED_AT: Date;
  UPDATED_AT: Date;
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



// تحديث نوع المستخدم ليشمل الأدوار
export interface UserFromDB {
  ID: number;
  USERNAME: string;
  EMAIL: string;
  PASSWORD?: string;
  IS_ADMIN?: number;
  ROLE_ID?: number;
  ROLE_NAME?: string; // من join مع جدول ROLES
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



  // JWT Payload محدث بالأدوار
export interface JWTPayload {
  id: number;
  username: string;
  isAdmin: boolean;
  roleId?: number;
  roleName?: string | null; // ✅ أضف null هنا
  permissions?: string[]; // قائمة بأسماء الصلاحيات
  iat?: number;
  exp?: number;
}


    export type UploadedImage = {
    RKM_MLF: number;
    SERIAL: number;
    NAME: string;
    IMAGENAME: string;
    FILE_PATH: string;
    IMAGE_NUMBER: number;
    CREATED_AT: Date;
  }
  

  
// أنواع الأدوار والصلاحيات
export interface Role {
  ID: number;
  NAME: string;
  DESCRIPTION?: string;
  IS_ACTIVE?: number;
  CREATED_AT?: Date;
  UPDATED_AT?: Date;
}

export interface Permission {
  ID: number;
  NAME: string;
  DESCRIPTION?: string;
  MODULE?: string;
  ACTION?: string;
  IS_ACTIVE?: number;
  CREATED_AT?: Date;
}

export interface RolePermission {
  ID: number;
  ROLE_ID: number;
  PERMISSION_ID: number;
  CREATED_AT?: Date;
}


// أنواع الأدوار المتاحة
export enum UserRoles {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  RECEPTIONIST = 'RECEPTIONIST',
  PATIENT = 'PATIENT'
}

// أنواع الصلاحيات
export enum PermissionNames {
  // المرضى
  PATIENTS_CREATE = 'PATIENTS_CREATE',
  PATIENTS_READ = 'PATIENTS_READ',
  PATIENTS_UPDATE = 'PATIENTS_UPDATE',
  PATIENTS_DELETE = 'PATIENTS_DELETE',
  
  // الأطباء
  DOCTORS_CREATE = 'DOCTORS_CREATE',
  DOCTORS_READ = 'DOCTORS_READ',
  DOCTORS_UPDATE = 'DOCTORS_UPDATE',
  DOCTORS_DELETE = 'DOCTORS_DELETE',
  
  // المواعيد
  APPOINTMENTS_CREATE = 'APPOINTMENTS_CREATE',
  APPOINTMENTS_READ = 'APPOINTMENTS_READ',
  APPOINTMENTS_UPDATE = 'APPOINTMENTS_UPDATE',
  APPOINTMENTS_DELETE = 'APPOINTMENTS_DELETE',
  
  // السجلات الطبية
  MEDICAL_RECORDS_CREATE = 'MEDICAL_RECORDS_CREATE',
  MEDICAL_RECORDS_READ = 'MEDICAL_RECORDS_READ',
  MEDICAL_RECORDS_UPDATE = 'MEDICAL_RECORDS_UPDATE',
  MEDICAL_RECORDS_DELETE = 'MEDICAL_RECORDS_DELETE',
  
  // النظام
  USERS_MANAGE = 'USERS_MANAGE',
  SYSTEM_CONFIG = 'SYSTEM_CONFIG',
  REPORTS_GENERATE = 'REPORTS_GENERATE'
}

// نوع بيانات المستخدم مع الصلاحيات
export interface UserWithPermissions extends UserFromDB {
  role?: Role;
  permissions?: Permission[];
}

// نوع للتحقق من الصلاحيات
export interface PermissionCheck {
  hasPermission: (permission: PermissionNames) => boolean;
  hasRole: (role: UserRoles) => boolean;
  hasAnyRole: (roles: UserRoles[]) => boolean;
  hasAnyPermission: (permissions: PermissionNames[]) => boolean;
}