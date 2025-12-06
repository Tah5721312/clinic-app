


----------------------------------------------------
-- جدول الأطباء (Doctors)
-----------------------------------------------------
DROP TABLE TAH57.Doctors ;


CREATE TABLE TAH57.Doctors (
    doctor_id       NUMBER(20) ,
    name            VARCHAR2(255 CHAR)    NOT NULL,
    email           VARCHAR2(320 CHAR)    NOT NULL,
    phone           VARCHAR2(20 CHAR)     NOT NULL,
    specialty       VARCHAR2(255 CHAR)    NOT NULL,
    experience      NUMBER(2),
    qualification   VARCHAR2(500 CHAR),
   image           VARCHAR2(500 CHAR), -- هنخزن لينك الصورة (URL)
    bio             VARCHAR2(1000 CHAR),
    CONSTRAINT uq_doctors_email UNIQUE (email),
    CONSTRAINT uq_doctors_phone UNIQUE (phone),
    CONSTRAINT chk_experience CHECK (experience BETWEEN 0 AND 50),
    CONSTRAINT pk_doctors PRIMARY KEY (doctor_id)
);

-----------------------------------------------------

-- جدول المرضى (Patients)
-----------------------------------------------------
DROP TABLE TAH57.Patients ;

CREATE TABLE TAH57.Patients (
    patient_id             NUMBER(20) ,
    name                    VARCHAR2(255 CHAR)       NOT NULL,
    email                   VARCHAR2(320 CHAR)       NOT NULL,
    phone                   VARCHAR2(20 CHAR)        NOT NULL,
    dateOfBirth             DATE                    ,
    gender                  VARCHAR2(10 CHAR)       ,
    address                 VARCHAR2(500 CHAR),
    occupation              VARCHAR2(255 CHAR),
    emergencyContactName    VARCHAR2(255 CHAR),
    emergencyContactNumber  VARCHAR2(20 CHAR),
    primaryPhysician        NUMBER, -- مفتاح خارجي للطبيب الأساسي
    insuranceProvider       VARCHAR2(255 CHAR),
    insurancePolicyNumber   VARCHAR2(100 CHAR),
    allergies               VARCHAR2(1000 CHAR),
    currentMedication       VARCHAR2(1000 CHAR),
    familyMedicalHistory    VARCHAR2(1000 CHAR),
    pastMedicalHistory      VARCHAR2(1000 CHAR),
    identificationType      VARCHAR2(50 CHAR),
    identificationNumber    VARCHAR2(100 CHAR),
    identificationDocument  BLOB,
    privacyConsent          NUMBER(1) DEFAULT 0 NOT NULL,
    treatmentConsent        NUMBER(1) DEFAULT 0 NOT NULL,
    disclosureConsent       NUMBER(1) DEFAULT 0 NOT NULL,
    CONSTRAINT uq_patients_email UNIQUE (email),
    CONSTRAINT uq_patients_phone UNIQUE (phone),
    CONSTRAINT pk_Patients PRIMARY KEY (patient_id),
    CONSTRAINT fk_patient_doctor FOREIGN KEY (primaryPhysician) REFERENCES TAH57.doctors(doctor_id)
);

-----------------------------------------------------
-- جدول المواعيد (Appointments)
-----------------------------------------------------
CREATE TABLE TAH57.Appointments (
    appointment_id      NUMBER(20) ,
    patient_id           NUMBER      NOT NULL,
    doctor_id            NUMBER      NOT NULL,
appointment_type
    schedule             DATE    NOT NULL,
    reason               VARCHAR2(500 CHAR) NOT NULL,
    note                 VARCHAR2(1000 CHAR),
    status               VARCHAR2(20 CHAR) DEFAULT 'pending' NOT NULL,
    cancellationReason   VARCHAR2(500 CHAR),
    CONSTRAINT pk_Appointments PRIMARY KEY (appointment_id),
    CONSTRAINT fk_appointment_patient FOREIGN KEY (patient_id) REFERENCES TAH57.Patients(patient_id),
    CONSTRAINT fk_appointment_doctor FOREIGN KEY (doctor_id) REFERENCES TAH57.Doctors(doctor_id)
);

--------------*******************
-- إضافة عمود نوع الموعد
ALTER TABLE TAH57.APPOINTMENTS 
ADD appointment_type VARCHAR2(20) DEFAULT 'consultation';

ALTER TABLE TAH57.APPOINTMENTS
ADD (payment_method VARCHAR2(50 Byte));


ALTER TABLE TAH57.APPOINTMENTS
ADD (SCHEDULE_at VARCHAR2(10 Byte));

-- إضافة constraint للتأكد من القيم الصحيحة
ALTER TABLE TAH57.APPOINTMENTS 
ADD CONSTRAINT chk_appointment_type 
CHECK (appointment_type IN ('consultation', 'follow_up', 'emergency'));

-- إضافة عمود حالة الدفع
ALTER TABLE TAH57.APPOINTMENTS 
ADD payment_status VARCHAR2(20) DEFAULT 'unpaid';

-- إضافة constraint لحالة الدفع
ALTER TABLE TAH57.APPOINTMENTS 
ADD CONSTRAINT chk_payment_status 
CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded'));

-- إضافة عمود المبلغ المدفوع (اختياري)
ALTER TABLE TAH57.APPOINTMENTS 
ADD payment_amount NUMBER(10,2) DEFAULT 0;

ALTER TABLE TAH57.APPOINTMENTS
  ADD CONSTRAINT UC_APPT_DOC_DATE_TIME
  UNIQUE (DOCTOR_ID, SCHEDULE, SCHEDULE_AT);


-- إضافة تعليقات على الأعمدة الجديدة
COMMENT ON COLUMN TAH57.APPOINTMENTS.appointment_type IS 'نوع الموعد: كشف عادي، متابعة، طوارئ';
COMMENT ON COLUMN TAH57.APPOINTMENTS.payment_status IS 'حالة الدفع: غير مدفوع، جزئي، مدفوع، مسترد';
COMMENT ON COLUMN TAH57.APPOINTMENTS.payment_amount IS 'المبلغ المدفوع للموعد';

------------****************----------------------

-- إضافة عمود سعر الكشف
ALTER TABLE TAH57.DOCTORS 
ADD consultation_fee NUMBER(10,2) DEFAULT 0;


ALTER TABLE TAH57.DOCTORS
ADD (follow_up_fee NUMBER(10));

-- إضافة تعليق على عمود متابعة
COMMENT ON COLUMN TAH57.DOCTORS.follow_up_fee IS 'سعر المتابعة بالجنيه المصري';


-- إضافة constraint للتأكد من أن السعر موجب
ALTER TABLE TAH57.DOCTORS 
ADD CONSTRAINT chk_consultation_fee 
CHECK (consultation_fee >= 0);

-- إضافة عمود الحالة (متاح/غير متاح)
ALTER TABLE TAH57.DOCTORS 
ADD is_available NUMBER(1) DEFAULT 1;

-- إضافة constraint للتأكد من القيمة 0 أو 1
ALTER TABLE TAH57.DOCTORS 
ADD CONSTRAINT chk_is_available 
CHECK (is_available IN (0, 1));

-- إضافة عمود تاريخ آخر تحديث للحالة (اختياري)
ALTER TABLE TAH57.DOCTORS 
ADD availability_updated_at TIMESTAMP;

-- إضافة تعليقات على الأعمدة الجديدة
COMMENT ON COLUMN TAH57.DOCTORS.consultation_fee IS 'سعر الكشف بالجنيه المصري';
COMMENT ON COLUMN TAH57.DOCTORS.is_available IS '1 = متاح للحجز، 0 = غير متاح';
COMMENT ON COLUMN TAH57.DOCTORS.availability_updated_at IS 'تاريخ آخر تحديث لحالة التوفر';



-- تحديث جميع المواعيد الحالية لتكون من نوع "consultation"
UPDATE TAH57.APPOINTMENTS 
SET appointment_type = 'consultation'
WHERE appointment_type IS NULL;

-- تحديث جميع المواعيد الحالية لتكون غير مدفوعة
UPDATE TAH57.APPOINTMENTS 
SET payment_status = 'unpaid'
WHERE payment_status IS NULL;

-- تحديث جميع الدكاترة ليكونوا متاحين
UPDATE TAH57.DOCTORS 
SET is_available = 1
WHERE is_available IS NULL;

-- تحديث سعر الكشف لبعض الدكاترة (مثال)
UPDATE TAH57.DOCTORS 
SET consultation_fee = 300
WHERE specialty = 'طب القلب';

UPDATE TAH57.DOCTORS 
SET consultation_fee = 250
WHERE specialty = 'طب الأطفال';

UPDATE TAH57.DOCTORS 
SET consultation_fee = 350
WHERE specialty = 'الجراحة العامة';

UPDATE TAH57.DOCTORS 
SET consultation_fee = 200
WHERE consultation_fee = 0;

COMMIT;

-- Index على نوع الموعد
CREATE INDEX idx_appointments_type 
ON TAH57.APPOINTMENTS(appointment_type);

-- Index على حالة الدفع
CREATE INDEX idx_appointments_payment 
ON TAH57.APPOINTMENTS(payment_status);

-- Index على حالة توفر الدكتور
CREATE INDEX idx_doctors_available 
ON TAH57.DOCTORS(is_available);

-- Index مركب على الحالتين
CREATE INDEX idx_appointments_status 
ON TAH57.APPOINTMENTS(status, payment_status);

-------------------******************************-------------
-- Doctor Schedules Table Migration
-- This table will store doctor's weekly schedule and available time slots

-- Drop table if exists
DROP TABLE TAH57.DOCTOR_SCHEDULES CASCADE CONSTRAINTS;

-- Create doctor schedules table
CREATE TABLE TAH57.DOCTOR_SCHEDULES (
    SCHEDULE_ID NUMBER(20) PRIMARY KEY,
    DOCTOR_ID NUMBER(20) NOT NULL,
    DAY_OF_WEEK NUMBER(1) NOT NULL, -- 1=Sunday, 2=Monday, ..., 7=Saturday
    START_TIME VARCHAR2(8) NOT NULL, -- Format: 'HH:MM' (24-hour format)
    END_TIME VARCHAR2(8) NOT NULL,   -- Format: 'HH:MM' (24-hour format)
    SLOT_DURATION NUMBER(3) DEFAULT 30, -- Duration of each slot in minutes
    IS_AVAILABLE NUMBER(1) DEFAULT 1, -- 1=Available, 0=Unavailable
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT FK_DOCTOR_SCHEDULE_DOCTOR 
        FOREIGN KEY (DOCTOR_ID) 
        REFERENCES TAH57.DOCTORS(DOCTOR_ID) 
        ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT CHK_DAY_OF_WEEK CHECK (DAY_OF_WEEK BETWEEN 1 AND 7),
    CONSTRAINT CHK_START_TIME CHECK (REGEXP_LIKE(START_TIME, '^([01]?[0-9]|2[0-3]):[0-5][0-9]$')),
    CONSTRAINT CHK_END_TIME CHECK (REGEXP_LIKE(END_TIME, '^([01]?[0-9]|2[0-3]):[0-5][0-9]$')),
    CONSTRAINT CHK_SLOT_DURATION CHECK (SLOT_DURATION > 0 AND SLOT_DURATION <= 480), -- Max 8 hours
    CONSTRAINT CHK_IS_AVAIL_schedual CHECK (IS_AVAILABLE IN (0, 1)),
    CONSTRAINT CHK_TIME_ORDER CHECK (START_TIME < END_TIME)
);

-- Create sequence for schedule IDs
CREATE SEQUENCE TAH57.DOCTOR_SCHEDULES_seq
START WITH 1
INCREMENT BY 1
NOCACHE;

-- Create trigger for auto-generating schedule IDs
CREATE OR REPLACE TRIGGER TAH57.trg_doctor_schedules_id
BEFORE INSERT ON TAH57.DOCTOR_SCHEDULES
FOR EACH ROW
BEGIN
  :NEW.SCHEDULE_ID := TO_NUMBER('77' || TAH57.DOCTOR_SCHEDULES_seq.NEXTVAL);
  :NEW.UPDATED_AT := CURRENT_TIMESTAMP;
END;
/

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE TRIGGER TAH57.doctor_schedules_bur
    BEFORE UPDATE ON TAH57.DOCTOR_SCHEDULES
    FOR EACH ROW
BEGIN
    :NEW.UPDATED_AT := CURRENT_TIMESTAMP;
END;
/

-- Create indexes for better performance
CREATE INDEX IDX_DOCTOR_SCHEDULES_DOCTOR_ID ON TAH57.DOCTOR_SCHEDULES(DOCTOR_ID);
CREATE INDEX IDX_DOCTOR_SCHEDULES_DAY ON TAH57.DOCTOR_SCHEDULES(DAY_OF_WEEK);
CREATE INDEX IDX_DOCTOR_SCHEDULES_AVAILABLE ON TAH57.DOCTOR_SCHEDULES(IS_AVAILABLE);

-- Insert sample schedule data for existing doctors
-- Doctor 751 (د. أحمد مصطفى) - Heart specialist
INSERT INTO TAH57.DOCTOR_SCHEDULES (DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME, SLOT_DURATION, IS_AVAILABLE) VALUES
(751, 1, '09:00', '17:00', 30, 1); -- Sunday
INSERT INTO TAH57.DOCTOR_SCHEDULES (DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME, SLOT_DURATION, IS_AVAILABLE) VALUES
(751, 2, '09:00', '17:00', 30, 1); -- Monday
INSERT INTO TAH57.DOCTOR_SCHEDULES (DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME, SLOT_DURATION, IS_AVAILABLE) VALUES
(751, 3, '09:00', '17:00', 30, 1); -- Tuesday
INSERT INTO TAH57.DOCTOR_SCHEDULES (DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME, SLOT_DURATION, IS_AVAILABLE) VALUES
(751, 4, '09:00', '17:00', 30, 1); -- Wednesday
INSERT INTO TAH57.DOCTOR_SCHEDULES (DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME, SLOT_DURATION, IS_AVAILABLE) VALUES
(751, 5, '09:00', '17:00', 30, 1); -- Thursday

-- Doctor 752 (د. سارة علي) - Pediatric specialist
INSERT INTO TAH57.DOCTOR_SCHEDULES (DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME, SLOT_DURATION, IS_AVAILABLE) VALUES
(752, 1, '08:00', '16:00', 30, 1); -- Sunday
INSERT INTO TAH57.DOCTOR_SCHEDULES (DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME, SLOT_DURATION, IS_AVAILABLE) VALUES
(752, 2, '08:00', '16:00', 30, 1); -- Monday
INSERT INTO TAH57.DOCTOR_SCHEDULES (DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME, SLOT_DURATION, IS_AVAILABLE) VALUES
(752, 3, '08:00', '16:00', 30, 1); -- Tuesday
INSERT INTO TAH57.DOCTOR_SCHEDULES (DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME, SLOT_DURATION, IS_AVAILABLE) VALUES
(752, 4, '08:00', '16:00', 30, 1); -- Wednesday
INSERT INTO TAH57.DOCTOR_SCHEDULES (DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME, SLOT_DURATION, IS_AVAILABLE) VALUES
(752, 5, '08:00', '16:00', 30, 1); -- Thursday

-- Doctor 753 (د. محمد حسن) - General Surgery
INSERT INTO TAH57.DOCTOR_SCHEDULES (DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME, SLOT_DURATION, IS_AVAILABLE) VALUES
(753, 1, '10:00', '18:00', 45, 1); -- Sunday
INSERT INTO TAH57.DOCTOR_SCHEDULES (DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME, SLOT_DURATION, IS_AVAILABLE) VALUES
(753, 2, '10:00', '18:00', 45, 1); -- Monday
INSERT INTO TAH57.DOCTOR_SCHEDULES (DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME, SLOT_DURATION, IS_AVAILABLE) VALUES
(753, 3, '10:00', '18:00', 45, 1); -- Tuesday
INSERT INTO TAH57.DOCTOR_SCHEDULES (DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME, SLOT_DURATION, IS_AVAILABLE) VALUES
(753, 4, '10:00', '18:00', 45, 1); -- Wednesday
INSERT INTO TAH57.DOCTOR_SCHEDULES (DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME, SLOT_DURATION, IS_AVAILABLE) VALUES
(753, 5, '10:00', '18:00', 45, 1); -- Thursday

COMMIT;

-- Create a view for easy schedule management
CREATE OR REPLACE VIEW TAH57.VW_DOCTOR_SCHEDULES AS
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
ORDER BY ds.DOCTOR_ID, ds.DAY_OF_WEEK, ds.START_TIME;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TAH57.DOCTOR_SCHEDULES TO TAH57;
GRANT SELECT ON TAH57.VW_DOCTOR_SCHEDULES TO TAH57;

--*****************************************************
-- 1. جدول الأدوار
CREATE TABLE tah57.ROLES (
    ROLE_ID NUMBER  PRIMARY KEY,
    NAME VARCHAR2(50) UNIQUE NOT NULL,
    DESCRIPTION VARCHAR2(255),
    IS_ACTIVE NUMBER(1) DEFAULT 1,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



DROP TABLE TAH57.USERS CASCADE CONSTRAINTS;

CREATE TABLE TAH57.USERS (
    USER_ID NUMBER PRIMARY KEY,
    USERNAME VARCHAR2(100) NOT NULL UNIQUE,
    EMAIL VARCHAR2(255) NOT NULL UNIQUE,
    PASSWORD VARCHAR2(255) NOT NULL,
    ROLE_ID NUMBER NOT NULL,
    FULL_NAME VARCHAR2(200),
IS_ADMIN NUMBER(1) DEFAULT 0,
    PHONE VARCHAR2(20),
    IS_ACTIVE NUMBER(1) DEFAULT 1,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_USER_ROLE FOREIGN KEY (ROLE_ID) REFERENCES TAH57.ROLES(ROLE_ID)
);

--**************************************************

CREATE SEQUENCE tah57.USERS_seq
START WITH 1
INCREMENT BY 1
NOCACHE;
-----------------------------------------

CREATE OR REPLACE TRIGGER trg_USERS_id
BEFORE INSERT ON tah57.USERS
FOR EACH ROW
BEGIN
  :NEW.USER_ID := TO_NUMBER('45' || tah57.USERS_seq.NEXTVAL);
END;
/
---**********************************---
DROP TABLE tah57.ROLE_PERMISSIONS
CREATE TABLE tah57.ROLE_PERMISSIONS (
    ROLE_PERMISSIONS_ID NUMBER PRIMARY KEY,
    ROLE_ID NUMBER NOT NULL,
    SUBJECT VARCHAR2(50) NOT NULL,
    ACTION VARCHAR2(50) NOT NULL,
    FIELD_NAME VARCHAR2(100), -- NULL = صلاحية عامة، لو فيها قيمة = صلاحية حقل
    CAN_ACCESS NUMBER(1) DEFAULT 1, -- 1 = يقدر، 0 = مايقدرش
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_RP_ROLE FOREIGN KEY (ROLE_ID) REFERENCES tah57.ROLES(ROLE_ID) ON DELETE CASCADE,
    CONSTRAINT UK_RP UNIQUE (ROLE_ID, SUBJECT, ACTION, FIELD_NAME)
);

---**********************************---

CREATE SEQUENCE tah57.ROLE_PERMISSIONS_seq
START WITH 1
INCREMENT BY 1
NOCACHE;
-----------------------------------------

CREATE OR REPLACE TRIGGER trg_ROLE_PERMISSIONS_id
BEFORE INSERT ON tah57.ROLE_PERMISSIONS
FOR EACH ROW
BEGIN
  :NEW.ROLE_PERMISSIONS_ID := TO_NUMBER('65' || tah57.ROLE_PERMISSIONS_seq.NEXTVAL);
END;
/

-- إدراج المستخدمين
INSERT INTO tah57.USERS (USERNAME, EMAIL, PASSWORD, ROLE_ID, FULL_NAME, PHONE) 
VALUES ('superadmin', 'superadmin@hospital.com', 
        '$2b$10$RHiiqr3N2CYhRb1xQtlZNuqvFaZ/vrDWNxStJEXeg3QDC68K2flFa', 
        211, 'محمد أحمد', '01000000001');

INSERT INTO tah57.USERS (USERNAME, EMAIL, PASSWORD, ROLE_ID, FULL_NAME, PHONE) 
VALUES ('tah', 'tah@gmail.com', 
        '$2b$10$RHiiqr3N2CYhRb1xQtlZNuqvFaZ/vrDWNxStJEXeg3QDC68K2flFa', 
        211, 'طه محمود', '01000000002');

INSERT INTO tah57.USERS (USERNAME, EMAIL, PASSWORD, ROLE_ID, FULL_NAME, PHONE) 
VALUES ('admin', 'admin@hospital.com', 
        '$2b$10$hashedpassword2', 
        212, 'أحمد محمد', '01100000001');

INSERT INTO tah57.USERS (USERNAME, EMAIL, PASSWORD, ROLE_ID, FULL_NAME, PHONE) 
VALUES ('sara.ali', 'sara.ali@example.com', 
        '$2b$10$hashedpassword4', 
        213, 'د. سارة علي', '01200000001');

INSERT INTO tah57.USERS (USERNAME, EMAIL, PASSWORD, ROLE_ID, FULL_NAME, PHONE) 
VALUES ('nurse1', 'nurse1@hospital.com', 
        '$2b$10$hashedpassword5', 
        214, 'فاطمة أحمد', '01300000001');

INSERT INTO tah57.USERS (USERNAME, EMAIL, PASSWORD, ROLE_ID, FULL_NAME, PHONE) 
VALUES ('reception1', 'reception@hospital.com', 
        '$2b$10$hashedpassword6', 
        215, 'أحمد إبراهيم', '01400000001');

INSERT INTO tah57.USERS (USERNAME, EMAIL, PASSWORD, ROLE_ID, FULL_NAME, PHONE) 
VALUES ('tag', 'tag@gmail.com', 
        '$2b$10$U0Pn9va0UGCz1f.ELBu1i.J4wpMvQL89Iq2GLbsIQsvGs2/YKAE.i', 
        215, 'تاج الدين', '01400000002');

INSERT INTO tah57.USERS (USERNAME, EMAIL, PASSWORD, ROLE_ID, FULL_NAME, PHONE) 
VALUES ('taha', 'taha@gmail.com', 
        '$2b$10$R424EWT39jqoRGGZnuRxnOzV.uaIgHkznZ.OeBrkXC5cHQ0RoErwq', 
        216, 'طه محمد', '01500000001');

INSERT INTO tah57.USERS (USERNAME, EMAIL, PASSWORD, ROLE_ID, FULL_NAME, PHONE) 
VALUES ('tah0', 'tah0@gmail.com', 
        '$2b$10$BZhUtKQCVkUXQ/gmAGJMr.1xDGk58Gp.gHzU5i5J5M4afFLJlxPr.', 
        216, 'طه علي', '01500000002');

COMMIT;

----***************************************************-------------


-- 1. SUPER_ADMIN (ROLE_ID = 1) - كل الصلاحيات
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (211, 'ALL', 'MANAGE');

-- 2. ADMIN (ROLE_ID = 2)
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (212, 'PATIENTS', 'CREATE');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (212, 'PATIENTS', 'READ');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (212, 'PATIENTS', 'UPDATE');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (212, 'PATIENTS', 'DELETE');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (212, 'DOCTORS', 'CREATE');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (212, 'DOCTORS', 'READ');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (212, 'DOCTORS', 'UPDATE');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (212, 'DOCTORS', 'DELETE');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (212, 'APPOINTMENTS', 'CREATE');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (212, 'APPOINTMENTS', 'READ');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (212, 'APPOINTMENTS', 'UPDATE');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (212, 'APPOINTMENTS', 'DELETE');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (212, 'DASHBOARD', 'READ');

-- 3. DOCTOR (ROLE_ID = 3)
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (213, 'PATIENTS', 'READ');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (213, 'PATIENTS', 'UPDATE');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (213, 'DOCTORS', 'READ');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (213, 'APPOINTMENTS', 'READ');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (213, 'APPOINTMENTS', 'UPDATE');

-- 4. NURSE (ROLE_ID = 4)
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (214, 'PATIENTS', 'READ');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (214, 'DOCTORS', 'READ');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (214, 'APPOINTMENTS', 'READ');

-- 5. RECEPTIONIST (ROLE_ID = 5)
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (215, 'PATIENTS', 'CREATE');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (215, 'PATIENTS', 'READ');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (215, 'PATIENTS', 'UPDATE');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (215, 'DOCTORS', 'READ');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (215, 'APPOINTMENTS', 'CREATE');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (215, 'APPOINTMENTS', 'READ');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (215, 'APPOINTMENTS', 'UPDATE');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (215, 'APPOINTMENTS', 'DELETE');

-- 6. PATIENT (ROLE_ID = 6) - صلاحيات عامة
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (216, 'PATIENTS', 'READ');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (216, 'PATIENTS', 'UPDATE');
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION) VALUES (216, 'APPOINTMENTS', 'READ');

-- PATIENT - صلاحيات الحقول (ما يقدر يشوف من بيانات الدكتور)
INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION, FIELD_NAME, CAN_ACCESS) 
VALUES (216, 'DOCTORS', 'READ', 'full_name', 1);

INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION, FIELD_NAME, CAN_ACCESS) 
VALUES (216, 'DOCTORS', 'READ', 'specialization', 1);

INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION, FIELD_NAME, CAN_ACCESS) 
VALUES (216, 'DOCTORS', 'READ', 'phone', 1);

INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION, FIELD_NAME, CAN_ACCESS) 
VALUES (216, 'DOCTORS', 'READ', 'email', 0);

INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION, FIELD_NAME, CAN_ACCESS) 
VALUES (216, 'DOCTORS', 'READ', 'salary', 0);

INSERT INTO tah57.ROLE_PERMISSIONS (ROLE_ID, SUBJECT, ACTION, FIELD_NAME, CAN_ACCESS) 
VALUES (216, 'DOCTORS', 'READ', 'private_notes', 0);

COMMIT;

---***************************************---------------------

CREATE OR REPLACE VIEW tah57.VW_USER_PERMISSIONS AS
SELECT 
    u.USER_ID,
    u.USERNAME,
    u.FULL_NAME,
    r.NAME as ROLE_NAME,
    rp.SUBJECT,
    rp.ACTION,
    rp.FIELD_NAME,
    rp.CAN_ACCESS
FROM tah57.USERS u
INNER JOIN tah57.ROLES r ON u.ROLE_ID = r.ROLE_ID
LEFT JOIN tah57.ROLE_PERMISSIONS rp ON r.ROLE_ID = rp.ROLE_ID
WHERE u.IS_ACTIVE = 1 AND r.IS_ACTIVE = 1;
--*******************************************--
CREATE OR REPLACE PROCEDURE tah57.GET_USER_PERMISSIONS (
    p_user_id IN NUMBER,
    p_result OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_result FOR
    SELECT SUBJECT, ACTION, FIELD_NAME, CAN_ACCESS
    FROM tah57.VW_USER_PERMISSIONS
    WHERE USER_ID = p_user_id;
END;
/

---***************************************--
-- 1. تعريف متغير نوعه REF CURSOR
VARIABLE rc REFCURSOR;

-- 2. تنفيذ الإجراء مع تمرير ID المستخدم، والمتغير لاستلام النتيجة
EXEC tah57.GET_USER_PERMISSIONS(455, :rc);

-- 3. طباعة النتائج
PRINT rc;

----************************************-------------------------------
ALTER TABLE tah57.PATIENTS
DROP CONSTRAINT FK_PATIENT_DOCTOR;

----------------------------------------

ALTER TABLE tah57.APPOINTMENTS
ADD CONSTRAINT fk_appointment_patient    FOREIGN KEY (patient_id)
REFERENCES tah57.PATIENTS(patient_id);

-----------------------------

CREATE SEQUENCE tah57.doctor_seq
START WITH 1
INCREMENT BY 1
NOCACHE;
-----------------------------------------
CREATE OR REPLACE TRIGGER trg_doctor_id
BEFORE INSERT ON tah57.DOCTORS
FOR EACH ROW
BEGIN
  :NEW.doctor_id := TO_NUMBER('75' || tah57.doctor_seq.NEXTVAL);
END;
/

---------------------------------
CREATE SEQUENCE tah57.PATIENT_seq
START WITH 1
INCREMENT BY 1
NOCACHE;


-----------------------------------------
CREATE OR REPLACE TRIGGER trg_PATIENT_id
BEFORE INSERT ON tah57.PATIENTS
FOR EACH ROW
BEGIN
  :NEW.PATIENT_id := TO_NUMBER('95' || tah57.PATIENT_seq.NEXTVAL);
END;
/

----------------------------------------


CREATE SEQUENCE tah57.APPOINTMENT_seq
START WITH 1
INCREMENT BY 1
NOCACHE;
-----------------------------------------
CREATE OR REPLACE TRIGGER trg_APPOINTMENT_id
BEFORE INSERT ON tah57.APPOINTMENTS
FOR EACH ROW
BEGIN
  :NEW.appointment_id := TO_NUMBER('55' || tah57.APPOINTMENT_seq.NEXTVAL);
END;
/

--**************************MedicalRecords**************

DROP TABLE TAH57.MedicalRecords;

CREATE TABLE TAH57.MedicalRecords (
    MEDICALRECORD_ID      NUMBER(20)       NOT NULL,
    PATIENT_ID             NUMBER(20)       NOT NULL,
    DOCTOR_ID              NUMBER(20)       NOT NULL,
    DIAGNOSIS              VARCHAR2(1000 CHAR) ,
    SYMPTOMS               VARCHAR2(4000 CHAR), -- تخزين array كـ JSON أو نص مفصول
    MEDICATIONS            VARCHAR2(4000 CHAR), -- تخزين array كـ JSON أو نص مفصول
    TREATMENTPLAN         VARCHAR2(2000 CHAR) ,
    NOTES                  VARCHAR2(2000 CHAR),
    BLOOD_PRESSURE         VARCHAR2(20 CHAR),
    TEMPERATURE            NUMBER(4,2),
    IMAGES                 VARCHAR2(4000 CHAR), -- تخزين array كـ JSON
    HEIGHT                 NUMBER(5,2),        -- الطول بالسنتيمتر
    WEIGHT                 NUMBER(5,2),        -- الوزن بالكيلوجرام
    CREATED_AT             TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UPDATED_AT             TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- المفاتيح الأساسية والقيود
    CONSTRAINT pk_medical_records PRIMARY KEY (MEDICALRECORD_ID),
    
    -- المفاتيح الخارجية
    CONSTRAINT fk_medical_records_patient 
        FOREIGN KEY (PATIENT_ID) 
        REFERENCES TAH57.Patients(patient_id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_medical_records_doctor 
        FOREIGN KEY (DOCTOR_ID) 
        REFERENCES TAH57.Doctors(doctor_id)
        ON DELETE CASCADE
);


--*****************************************************

-----------------------------

CREATE SEQUENCE tah57.MedicalRecords_seq
START WITH 1
INCREMENT BY 1
NOCACHE;
-----------------------------------------
CREATE OR REPLACE TRIGGER trg_MedicalRecords_id
BEFORE INSERT ON tah57.MedicalRecords
FOR EACH ROW
BEGIN
  :NEW.MEDICALRECORD_ID := TO_NUMBER('33' || tah57.MedicalRecords_seq.NEXTVAL);
   :NEW.UPDATED_AT := CURRENT_TIMESTAMP;
END;
/

-- Trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE TRIGGER TAH57.medicalrecords_bur
    BEFORE UPDATE ON TAH57.MedicalRecords
    FOR EACH ROW
BEGIN
    :NEW.UPDATED_AT := CURRENT_TIMESTAMP;
END;
/

--************************************************************

-- إنشاء Indexes لتحسين الأداء
CREATE INDEX idx_medical_records_patient_id 
    ON TAH57.MedicalRecords(PATIENT_ID);

CREATE INDEX idx_medical_records_doctor_id 
    ON TAH57.MedicalRecords(DOCTOR_ID);

CREATE INDEX idx_medical_records_created_at 
    ON TAH57.MedicalRecords(CREATED_AT);



--************************************************************

--------------------------DATA---------------------------********************--


-----------------------------------------------------
-- ثالثاً: إدخال بيانات الأطباء أولاً
-----------------------------------------------------
INSERT INTO tah57.DOCTORS (name, email, phone, specialty, experience, qualification, image, bio) VALUES
('د. أحمد مصطفى', 'ahmed.mostafa11@example.com', '+201234567110', 'طب القلب', 11, 'دكتوراه في طب القلب', 'https://example.com/images/doctor2.jpg', 'خبير في أمراض القلب والشرايين.');

INSERT INTO tah57.DOCTORS (name, email, phone, specialty, experience, qualification, image, bio) VALUES
('د. سارة علي', 'sara.ali1@example.com', '+201981654321', 'طب الأطفال', 8, 'ماجستير طب الأطفال', 'https://example.com/images/doctor2.jpg', 'متخصصة في علاج الأطفال وحديثي الولادة.');

INSERT INTO tah57.DOCTORS (name, email, phone, specialty, experience, qualification, image, bio) VALUES
('د. محمد حسن', 'mohamed.hassan1@example.com', '+201112123344', 'الجراحة العامة', 20, 'زمالة الجراحة العامة', 'https://example.com/images/doctor3.jpg', 'جراح معتمد مع خبرة واسعة.');

INSERT INTO tah57.DOCTORS (name, email, phone, specialty, experience, qualification, image, bio) VALUES
('د. ليلى أحمد', 'leila.ahmed1@example.com', '+201122114455', 'طب الأعصاب', 12, 'دكتوراه في الأعصاب', 'https://example.com/images/doctor4.jpg', 'متخصصة في أمراض الجهاز العصبي.');

INSERT INTO tah57.DOCTORS (name, email, phone, specialty, experience, qualification, image, bio) VALUES
('د. كريم سمير', 'karim.samir1@example.com', '+201133145566', 'طب العيون', 10, 'ماجستير طب العيون', 'https://example.com/images/doctor5.jpg', 'خبرة في جراحات العيون الحديثة.');

INSERT INTO tah57.DOCTORS (name, email, phone, specialty, experience, qualification, image, bio) VALUES
('د. هالة فؤاد', 'hala.foua1d1@example.com', '+201144551577', 'طب الجلدية', 7, 'بكالوريوس طب وجراحة', 'https://example.com/images/doctor6.jpg', 'تعالج الأمراض الجلدية وحساسية الجلد.');

INSERT INTO tah57.DOCTORS (name, email, phone, specialty, experience, qualification, image, bio) VALUES
('د. محمود نادر', 'mahmoud.nader1@example.com', '+201155617788', 'طب الأسنان', 14, 'دكتوراه في طب الأسنان', 'https://example.com/images/doctor7.jpg', 'مختص في جراحة الفم والأسنان.');

INSERT INTO tah57.DOCTORS (name, email, phone, specialty, experience, qualification, image, bio) VALUES
('د. منى حسن', 'mona.hassan1@example.com', '+201161778899', 'طب الروماتيزم', 9, 'ماجستير في الروماتيزم', 'https://example.com/images/doctor8.jpg', 'تعالج الأمراض المزمنة والمفاصل.');

INSERT INTO tah57.DOCTORS (name, email, phone, specialty, experience, qualification, image, bio) VALUES
('د. سامي علي', 'sami.ali1@example.com', '+201177819900', 'طب الطوارئ', 11, 'بكالوريوس طب الطوارئ', 'https://example.com/images/doctor9.jpg', 'خبرة في التعامل مع الحالات الطارئة.');

INSERT INTO tah57.DOCTORS (name, email, phone, specialty, experience, qualification, image, bio) VALUES
('د. ريم عبد الله', 'reem.abdullah1@example.com', '+201181990011', 'طب النساء والتوليد', 13, 'ماجستير في النساء والتوليد', 'https://example.com/images/doctor10.jpg', 'تتابع الحمل والولادة.');

-----------------------------------------------------
-- رابعاً: إدخال بيانات المرضى (مع التأكد من أن primaryPhysician موجود في جدول الأطباء)
-----------------------------------------------------
INSERT INTO tah57.PATIENTS (name, email, phone, dateOfBirth, gender, address, occupation, emergencyContactName, emergencyContactNumber, primaryPhysician, insuranceProvider, insurancePolicyNumber, allergies, currentMedication, familyMedicalHistory, pastMedicalHistory, identificationType, identificationNumber, privacyConsent, treatmentConsent, disclosureConsent) VALUES
('أحمد إبراهيم', 'ahmed.ibrahim1@example.com', '+201901112223', TO_DATE('1985-06-15', 'YYYY-MM-DD'), 'ذكر', 'شارع النيل، القاهرة', 'مهندس', 'منى إبراهيم', '+201011223344', 751, 'شركة التأمين المتحدة', 'INS123456789', 'لا يوجد', 'لا يوجد', 'ضغط دم', 'التهاب مزمن في الجهاز التنفسي', 'بطاقة شخصية', '12345678901234', 1, 1, 1);

INSERT INTO tah57.PATIENTS (name, email, phone, dateOfBirth, gender, address, occupation, emergencyContactName, emergencyContactNumber, primaryPhysician, insuranceProvider, insurancePolicyNumber, allergies, currentMedication, familyMedicalHistory, pastMedicalHistory, identificationType, identificationNumber, privacyConsent, treatmentConsent, disclosureConsent) VALUES
('منى سامي', 'mona.sami1@example.com', '+201022314455', TO_DATE('1990-11-20', 'YYYY-MM-DD'), 'أنثى', 'شارع التحرير، الإسكندرية', 'مدرسة', 'أحمد سامي', '+201033445566',751, 'شركة الحياة للتأمين', 'INS987654321', 'حساسية من البنسلين', 'مضاد حيوي', 'سكري', 'التهاب مزمن في المفاصل', 'جواز سفر', 'A1234567', 1, 1, 1);

INSERT INTO tah57.PATIENTS (name, email, phone, dateOfBirth, gender, address, occupation, emergencyContactName, emergencyContactNumber, primaryPhysician, insuranceProvider, insurancePolicyNumber, allergies, currentMedication, familyMedicalHistory, pastMedicalHistory, identificationType, identificationNumber, privacyConsent, treatmentConsent, disclosureConsent) VALUES
('محمد علي', 'mohamed.ali1@example.com', '+201041556677', TO_DATE('1978-03-05', 'YYYY-MM-DD'), 'ذكر', 'شارع الهرم، الجيزة', 'محاسب', 'سعاد علي', '+201055667788',752, 'شركة الشروق للتأمين', 'INS112233445', 'لا يوجد', 'دواء ضغط', 'سرطان في العائلة', 'تاريخ جراحة', 'بطاقة شخصية', '98765432109876', 1, 1, 1);

INSERT INTO tah57.PATIENTS (name, email, phone, dateOfBirth, gender, address, occupation, emergencyContactName, emergencyContactNumber, primaryPhysician, insuranceProvider, insurancePolicyNumber, allergies, currentMedication, familyMedicalHistory, pastMedicalHistory, identificationType, identificationNumber, privacyConsent, treatmentConsent, disclosureConsent) VALUES
('ندى مصطفى', 'nada.mostafa1@example.com', '+201016778899', TO_DATE('1988-08-25', 'YYYY-MM-DD'), 'أنثى', 'شارع الثورة، بورسعيد', 'محامية', 'علي مصطفى', '+201077889900',752, 'شركة الأمان للتأمين', 'INS445566778', 'حساسية الغلوتين', 'مضاد التهاب', 'ضغط دم', 'تاريخ ولادة مبكر', 'بطاقة شخصية', '56789012345678', 1, 1, 1);

INSERT INTO tah57.PATIENTS (name, email, phone, dateOfBirth, gender, address, occupation, emergencyContactName, emergencyContactNumber, primaryPhysician, insuranceProvider, insurancePolicyNumber, allergies, currentMedication, familyMedicalHistory, pastMedicalHistory, identificationType, identificationNumber, privacyConsent, treatmentConsent, disclosureConsent) VALUES
('خالد يוסف', 'khaled.yousef1@example.com', '+201018990011', TO_DATE('1975-12-12', 'YYYY-MM-DD'), 'ذكر', 'شارع الملك فيصل، طنطا', 'مهندس', 'سلمى يوسف', '+201099001122', 752, 'شركة الأمل للتأمين', 'INS223344556', 'لا يوجد', 'مهدئ', 'سكري', 'كسر في العظم', 'جواز سفر', 'B2345678', 1, 1, 1);

INSERT INTO tah57.PATIENTS (name, email, phone, dateOfBirth, gender, address, occupation, emergencyContactName, emergencyContactNumber, primaryPhysician, insuranceProvider, insurancePolicyNumber, allergies, currentMedication, familyMedicalHistory, pastMedicalHistory, identificationType, identificationNumber, privacyConsent, treatmentConsent, disclosureConsent) VALUES
('سارة أحمد', 'sara.ahmed1@example.com', '+201011213344', TO_DATE('1992-04-18', 'YYYY-MM-DD'), 'أنثى', 'شارع الأزهر، أسيوط', 'معلمة', 'طارق أحمد', '+201022334455',753, 'شركة الشفاء للتأمين', 'INS334455667', 'حساسية دوائية', 'فيتامينات', 'ضغط دم', 'التهاب مزمن في الكبد', 'بطاقة شخصية', '67890123456789', 1, 1, 1);

INSERT INTO tah57.PATIENTS (name, email, phone, dateOfBirth, gender, address, occupation, emergencyContactName, emergencyContactNumber, primaryPhysician, insuranceProvider, insurancePolicyNumber, allergies, currentMedication, familyMedicalHistory, pastMedicalHistory, identificationType, identificationNumber, privacyConsent, treatmentConsent, disclosureConsent) VALUES
('ياسين محمود', 'yassin.mahmoud1@example.com', '+201013445566', TO_DATE('1980-01-30', 'YYYY-MM-DD'), 'ذكر', 'شارع الجامعة، المنصورة', 'محاسب', 'هدى محمود', '+201044556677',753, 'شركة الأمانة للتأمين', 'INS556677889', 'لا يوجد', 'مضاد حيوي', 'سرطان', 'التهاب في الكلى', 'جواز سفر', 'C3456789', 1, 1, 1);

INSERT INTO tah57.PATIENTS (name, email, phone, dateOfBirth, gender, address, occupation, emergencyContactName, emergencyContactNumber, primaryPhysician, insuranceProvider, insurancePolicyNumber, allergies, currentMedication, familyMedicalHistory, pastMedicalHistory, identificationType, identificationNumber, privacyConsent, treatmentConsent, disclosureConsent) VALUES
('ريم عبد الرحمن', 'reem.abdulrahman1@example.com', '+201015667788', TO_DATE('1983-07-07', 'YYYY-MM-DD'), 'أنثى', 'شارع الحرية، الأقصر', 'طبيبة', 'محمد عبد الرحمن', '+201066778899',754, 'شركة الحياة الجديدة', 'INS667788990', 'حساسية الطعام', 'مضاد حيوي', 'ضغط دم', 'التهاب مزمن في الرئة', 'بطاقة شخصية', '78901234567890', 1, 1, 1);

INSERT INTO tah57.PATIENTS (name, email, phone, dateOfBirth, gender, address, occupation, emergencyContactName, emergencyContactNumber, primaryPhysician, insuranceProvider, insurancePolicyNumber, allergies, currentMedication, familyMedicalHistory, pastMedicalHistory, identificationType, identificationNumber, privacyConsent, treatmentConsent, disclosureConsent) VALUES
('طارق حسني', 'tarek.hosny2@example.com', '+201072889900', TO_DATE('1979-09-15', 'YYYY-MM-DD'), 'ذكر', 'شارع البحر، الإسكندرية', 'مدير', 'هالة حسني', '+201088990011',754, 'شركة الأمل الجديدة', 'INS778899001', 'لا يوجد', 'مهدئ', 'سكري', 'تاريخ جراحة', 'جواز سفر', 'D4567890', 1, 1, 1);

INSERT INTO tah57.PATIENTS (name, email, phone, dateOfBirth, gender, address, occupation, emergencyContactName, emergencyContactNumber, primaryPhysician, insuranceProvider, insurancePolicyNumber, allergies, currentMedication, familyMedicalHistory, pastMedicalHistory, identificationType, identificationNumber, privacyConsent, treatmentConsent, disclosureConsent) VALUES
('هالة جمال', 'hala.gamal2@example.com', '+201099021122', TO_DATE('1995-05-23', 'YYYY-MM-DD'), 'أنثى', 'شارع النصر، بني سويف', 'مهندسة', 'سعيد جمال', '+201011223344',755, 'شركة الأمان للتأمين', 'INS889900112', 'حساسية اللاتكس', 'مضاد التهاب', 'ضغط دم', 'التهاب مزمن في الأذن', 'بطاقة شخصية', '89012345678901', 1, 1, 1);


-----------------------------------------------------
-- خامساً: إدخال بيانات المواعيد
-----------------------------------------------------
INSERT INTO tah57.APPOINTMENTS (patient_id, doctor_id, schedule, reason, note, status, cancellationReason) VALUES
(953,753, TO_TIMESTAMP('2025-10-01 10:30:00', 'YYYY-MM-DD HH24:MI:SS'), 'فحص دوري للقلب', 'يرجى إحضار التحاليل السابقة', 'scheduled', NULL);

INSERT INTO tah57.APPOINTMENTS (patient_id, doctor_id, schedule, reason, note, status, cancellationReason) VALUES
(954,751, TO_TIMESTAMP('2025-10-03 14:00:00', 'YYYY-MM-DD HH24:MI:SS'), 'شكوى من حرارة وألم', 'المريض يعاني من ارتفاع في الحرارة', 'pending', NULL);

INSERT INTO tah57.APPOINTMENTS (patient_id, doctor_id, schedule, reason, note, status, cancellationReason) VALUES
(953,753, TO_TIMESTAMP('2025-10-05 09:00:00', 'YYYY-MM-DD HH24:MI:SS'), 'متابعة بعد العملية الجراحية', NULL, 'cancelled', 'تأجيل بسبب ظروف المريض');


INSERT INTO tah57.APPOINTMENTS (patient_id, doctor_id, schedule, reason, note, status, cancellationReason) VALUES
(955,755, TO_TIMESTAMP('2025-10-07 11:00:00', 'YYYY-MM-DD HH24:MI:SS'), 'صداع مستمر', 'أخذ الأدوية بانتظام', 'scheduled', NULL);

INSERT INTO tah57.APPOINTMENTS (patient_id, doctor_id, schedule, reason, note, status, cancellationReason) VALUES
(956,754, TO_TIMESTAMP('2025-10-10 13:00:00', 'YYYY-MM-DD HH24:MI:SS'), 'فحص العيون السنوي', NULL, 'pending', NULL);

INSERT INTO tah57.APPOINTMENTS (patient_id, doctor_id, schedule, reason, note, status, cancellationReason) VALUES
(957,758, TO_TIMESTAMP('2025-10-12 15:30:00', 'YYYY-MM-DD HH24:MI:SS'), 'حكة جلدية مزمنة', 'استخدام مرهم خاص', 'scheduled', NULL);

INSERT INTO tah57.APPOINTMENTS (patient_id, doctor_id, schedule, reason, note, status, cancellationReason) VALUES
(958,759, TO_TIMESTAMP('2025-10-15 09:30:00', 'YYYY-MM-DD HH24:MI:SS'), 'وجع أسنان حاد', 'الحجز للجراحة', 'pending', NULL);

INSERT INTO tah57.APPOINTMENTS (patient_id, doctor_id, schedule, reason, note, status, cancellationReason) VALUES
(959,758, TO_TIMESTAMP('2025-10-17 10:00:00', 'YYYY-MM-DD HH24:MI:SS'), 'التهاب المفاصل', 'العلاج الطبيعي مستمر', 'scheduled', NULL);

INSERT INTO tah57.APPOINTMENTS (patient_id, doctor_id, schedule, reason, note, status, cancellationReason) VALUES
(9510,759, TO_TIMESTAMP('2025-10-20 14:00:00', 'YYYY-MM-DD HH24:MI:SS'), 'حالات طارئة', 'الإسعافات الأولية تم تقديمها', 'cancelled', 'تأجيل بناءً على توصية الطبيب');

INSERT INTO tah57.APPOINTMENTS (patient_id, doctor_id, schedule, reason, note, status, cancellationReason) VALUES
(9511,7510, TO_TIMESTAMP('2025-10-22 11:15:00', 'YYYY-MM-DD HH24:MI:SS'), 'فحص نسائي دوري', NULL, 'scheduled', NULL);

COMMIT;
-- إدخال السجلات الطبية (Medical Records)
-- تم ربط المرضى بالأطباء المناسبين حسب التخصص والحالة الطبية

-- السجل الأول - مريض القلب مع طبيب القلب
INSERT INTO TAH57.MedicalRecords (PATIENT_ID,DOCTOR_ID,DIAGNOSIS,SYMPTOMS,MEDICATIONS,TREATMENTPLAN,NOTES,BLOOD_PRESSURE,TEMPERATURE,IMAGES,HEIGHT,WEIGHT,CREATED_AT, UPDATED_AT)
 VALUES (
 953, 751, 'ارتفاع ضغط الدم','["صداع", "دوخة", "ضيق في التنفس", "ألم في الصدر"]','["أملوديبين 5مج", "ليسينوبريل 10مج", "أسبرين 81مج"]','تغيير نمط الحياة، تقليل الملح، ممارسة الرياضة المنتظمة','المريض يحتاج متابعة دورية كل 3 أشهر', '140/90', 37.2,
    '["chest_xray_001.jpg", "ecg_001.pdf"]', 175.5, 82.3,CURRENT_TIMESTAMP, CURRENT_TIMESTAMP  );

-- السجل الثاني - مريضة الأطفال مع طبيبة الأطفال (حالة طفل)
INSERT INTO TAH57.MedicalRecords (PATIENT_ID,DOCTOR_ID,DIAGNOSIS,SYMPTOMS,MEDICATIONS,TREATMENTPLAN,NOTES,BLOOD_PRESSURE,TEMPERATURE,IMAGES,HEIGHT,WEIGHT,CREATED_AT, UPDATED_AT)
 VALUES (956, 755, 'التهاب اللوزتين الحاد', '["ألم في الحلق", "حمى", "صعوبة في البلع", "تضخم الغدد الليمفاوية"]','["أموكسيسيلين 500مج", "باراسيتامول 500مج", "مضمضة بالماء المالح"]','راحة في السرير، السوائل الدافئة، مضادات حيوية لمدة 7 أيام',
    'تحسن ملحوظ بعد 3 أيام من العلاج', '110/70', 38.5,'["throat_examination.jpg"]', 162.0, 58.7,CURRENT_TIMESTAMP, CURRENT_TIMESTAMP );

-- السجل الثالث - جراحة عامة
INSERT INTO TAH57.MedicalRecords (PATIENT_ID,DOCTOR_ID,DIAGNOSIS,SYMPTOMS,MEDICATIONS,TREATMENTPLAN,NOTES,BLOOD_PRESSURE,TEMPERATURE,IMAGES,HEIGHT,WEIGHT,CREATED_AT, UPDATED_AT)
 VALUES (955, 753, 'التهاب الزائدة الدودية', '["ألم في الجانب الأيمن", "غثيان", "قيء", "حمى خفيفة"]','["مضاد حيوي وريدي", "مسكن ألم", "سوائل وريدية"]','استئصال الزائدة الدودية بالمنظار، متابعة ما بعد الجراحة',
    'الجراحة تمت بنجاح، الشفاء يسير بشكل طبيعي', '125/80', 37.8,'["ct_scan_abdomen.jpg", "post_surgery.jpg"]', 178.2, 89.1,CURRENT_TIMESTAMP, CURRENT_TIMESTAMP );

-- السجل الرابع - طب الأعصاب
INSERT INTO TAH57.MedicalRecords (PATIENT_ID,DOCTOR_ID,DIAGNOSIS,SYMPTOMS,MEDICATIONS,TREATMENTPLAN,NOTES,BLOOD_PRESSURE,TEMPERATURE,IMAGES,HEIGHT,WEIGHT,CREATED_AT, UPDATED_AT)
 VALUES (959, 759, 'الصداع النصفي المزمن', '["صداع شديد", "غثيان", "حساسية للضوء", "اضطراب في الرؤية"]','["سوماتريبتان 50مج", "بروبرانولول 40مج", "مكملات المغنيسيوم"]','تجنب المحفزات، تنظيم النوم، تقنيات الاسترخاء',
    'تحسن ملحوظ في تكرار النوبات', '118/75', 36.9,'["brain_mri.jpg", "neurological_exam.pdf"]', 165.8, 64.2,CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- السجل الخامس - طب العيون
INSERT INTO TAH57.MedicalRecords (PATIENT_ID,DOCTOR_ID,DIAGNOSIS,SYMPTOMS,MEDICATIONS,TREATMENTPLAN,NOTES,BLOOD_PRESSURE,TEMPERATURE,IMAGES,HEIGHT,WEIGHT,CREATED_AT, UPDATED_AT)
 VALUES (9512, 7512, 'إعتام عدسة العين', '["تشويش في الرؤية", "حساسية للضوء", "صعوبة الرؤية الليلية", "رؤية هالات حول الأضواء"]','["قطرات عين مرطبة", "نظارات طبية مؤقتة"]','جراحة إزالة المياه البيضاء وزرع عدسة اصطناعية',
    'الجراحة مجدولة الأسبوع القادم', '130/85', 36.7,'["eye_examination.jpg", "lens_opacity_scan.jpg"]', 172.1, 76.8,CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- السجل السادس - طب الجلدية
INSERT INTO TAH57.MedicalRecords (PATIENT_ID,DOCTOR_ID,DIAGNOSIS,SYMPTOMS,MEDICATIONS,TREATMENTPLAN,NOTES,BLOOD_PRESSURE,TEMPERATURE,IMAGES,HEIGHT,WEIGHT,CREATED_AT, UPDATED_AT)
 VALUES ( 9514, 758, 'الأكزيما التأتبية', 
    '["طفح جلدي", "حكة شديدة", "جفاف الجلد", "التهاب"]',
    '["كورتيكوستيرويد موضعي", "مرطب جلدي", "مضاد هيستامين"]',
    'ترطيب مستمر، تجنب المهيجات، استخدام الكريمات الطبية',
    'تحسن تدريجي مع الالتزام بالعلاج', '122/78', 37.1,
    '["skin_condition.jpg", "treatment_progress.jpg"]', 158.5, 52.3,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- السجل السابع - طب الأسنان
INSERT INTO TAH57.MedicalRecords (PATIENT_ID,DOCTOR_ID,DIAGNOSIS,SYMPTOMS,MEDICATIONS,TREATMENTPLAN,NOTES,BLOOD_PRESSURE,TEMPERATURE,IMAGES,HEIGHT,WEIGHT,CREATED_AT, UPDATED_AT)
 VALUES (9511, 7516, 'تسوس متقدم في الضرس العلوي', 
    '["ألم شديد في الأسنان", "تورم في اللثة", "حساسية للبرد والحر", "رائحة فم كريهة"]',
    '["مضاد حيوي - أموكسيسيلين", "مسكن ألم - إيبوبروفين", "غسول فم مضاد للبكتيريا"]',
    'حشو العصب، تركيب تاج، تنظيف الأسنان العميق',
    'تم حشو العصب بنجاح، المريض بحاجة لمتابعة', '125/82', 37.4,
    '["dental_xray.jpg", "tooth_condition.jpg"]', 180.3, 94.7,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- السجل الثامن - طب الروماتيزم
INSERT INTO TAH57.MedicalRecords (PATIENT_ID,DOCTOR_ID,DIAGNOSIS,SYMPTOMS,MEDICATIONS,TREATMENTPLAN,NOTES,BLOOD_PRESSURE,TEMPERATURE,IMAGES,HEIGHT,WEIGHT,CREATED_AT, UPDATED_AT)
 VALUES ( 9520, 7517, 'التهاب المفاصل الروماتويدي', 
    '["ألم المفاصل", "تيبس صباحي", "تورم في المفاصل", "إرهاق عام"]',
    '["ميثوتريكسات 15مج", "فولات 5مج", "بريدنيزولون 5مج", "أوميبرازول 20مج"]',
    'علاج دوائي مستمر، علاج طبيعي، تمارين خفيفة',
    'الاستجابة جيدة للعلاج، تحسن في الأعراض', '135/88', 37.0,
    '["joint_xray.jpg", "blood_test_results.pdf"]', 167.9, 71.5,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- السجل التاسع - طب الطوارئ
INSERT INTO TAH57.MedicalRecords (PATIENT_ID,DOCTOR_ID,DIAGNOSIS,SYMPTOMS,MEDICATIONS,TREATMENTPLAN,NOTES,BLOOD_PRESSURE,TEMPERATURE,IMAGES,HEIGHT,WEIGHT,CREATED_AT, UPDATED_AT)
 VALUES ( 9521, 7518, 'كسر في عظم الساعد', 
    '["ألم شديد في الذراع", "تورم", "عدم القدرة على الحركة", "تشوه ظاهري"]',
    '["مسكن ألم قوي", "مضاد التهاب", "مضاد تجلط"]',
    'تجبيس الذراع، متابعة في العيادة الخارجية، علاج طبيعي',
    'كسر بسيط، الشفاء متوقع خلال 6-8 أسابيع', '140/90', 37.6,
    '["arm_xray.jpg", "cast_application.jpg"]', 174.2, 68.9,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- السجل العاشر - طب النساء والتوليد
INSERT INTO TAH57.MedicalRecords (PATIENT_ID,DOCTOR_ID,DIAGNOSIS,SYMPTOMS,MEDICATIONS,TREATMENTPLAN,NOTES,BLOOD_PRESSURE,TEMPERATURE,IMAGES,HEIGHT,WEIGHT,CREATED_AT, UPDATED_AT)
 VALUES ( 9522, 7519, 'متابعة الحمل - الثلث الثاني', 
    '["غثيان صباحي خفيف", "إرهاق", "آلام الظهر", "تغيرات في الثدي"]',
    '["حمض الفوليك", "فيتامينات الحمل", "مكملات الحديد"]',
    'متابعة دورية، فحوصات منتظمة، تغذية صحية',
    'الحمل يسير بشكل طبيعي، الجنين في وضع جيد', '118/75', 36.8,
    '["ultrasound_20weeks.jpg", "pregnancy_progress.pdf"]', 163.4, 67.2,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- السجل الحادي عشر - طبيب القلب (حالة أخرى)
INSERT INTO TAH57.MedicalRecords (PATIENT_ID,DOCTOR_ID,DIAGNOSIS,SYMPTOMS,MEDICATIONS,TREATMENTPLAN,NOTES,BLOOD_PRESSURE,TEMPERATURE,IMAGES,HEIGHT,WEIGHT,CREATED_AT, UPDATED_AT)
 VALUES ( 9523, 7520, 'اضطراب ضربات القلب', 
    '["خفقان القلب", "دوخة", "ضيق نفس عند المجهود", "ألم في الصدر"]',
    '["بيسوبرولول 5مج", "وارفارين 2.5مج", "ديجوكسين 0.25مج"]',
    'مراقبة دقيقة لضربات القلب، تجنب الكافيين والتوتر',
    'تحسن في انتظام ضربات القلب مع العلاج', '145/95', 37.3,
    '["ecg_followup.jpg", "holter_monitor.pdf"]', 175.5, 84.1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- السجل الثاني عشر - طبيبة الأطفال (حالة جديدة)
INSERT INTO TAH57.MedicalRecords (PATIENT_ID,DOCTOR_ID,DIAGNOSIS,SYMPTOMS,MEDICATIONS,TREATMENTPLAN,NOTES,BLOOD_PRESSURE,TEMPERATURE,IMAGES,HEIGHT,WEIGHT,CREATED_AT, UPDATED_AT)
 VALUES ( 9525, 7520, 'التهاب الأذن الوسطى', 
    '["ألم في الأذن", "حمى", "فقدان السمع المؤقت", "إفرازات من الأذن"]',
    '["أموكسيسيلين 250مج", "قطرات أذن مضادة للالتهاب", "باراسيتامول للألم"]',
    'مضادات حيوية لمدة 10 أيام، تجنب دخول الماء للأذن',
    'التحسن ظاهر بعد 48 ساعة من بدء العلاج', '95/60', 38.2,
    '["ear_examination.jpg"]', 125.3, 28.5,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- السجل الثالث عشر - جراح عام (حالة أخرى)
INSERT INTO TAH57.MedicalRecords (PATIENT_ID,DOCTOR_ID,DIAGNOSIS,SYMPTOMS,MEDICATIONS,TREATMENTPLAN,NOTES,BLOOD_PRESSURE,TEMPERATURE,IMAGES,HEIGHT,WEIGHT,CREATED_AT, UPDATED_AT)
 VALUES ( 9525, 7523, 'فتق إربي', 
    '["انتفاخ في المنطقة الإربية", "ألم عند السعال", "ثقل في المنطقة", "ألم متزايد"]',
    '["مسكن ألم خفيف", "مضاد التهاب"]',
    'جراحة إصلاح الفتق بالمنظار، راحة لمدة أسبوعين',
    'العملية تمت بنجاح، المريض يتعافى جيداً', '128/85', 37.1,
    '["hernia_scan.jpg", "pre_surgery.jpg", "post_surgery.jpg"]', 178.2, 87.3,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- السجل الرابع عشر - طبيبة الأعصاب (مريض جديد)
INSERT INTO TAH57.MedicalRecords (PATIENT_ID,DOCTOR_ID,DIAGNOSIS,SYMPTOMS,MEDICATIONS,TREATMENTPLAN,NOTES,BLOOD_PRESSURE,TEMPERATURE,IMAGES,HEIGHT,WEIGHT,CREATED_AT, UPDATED_AT)
 VALUES ( 9525, 7523, 'اعتلال الأعصاب الطرفية', 
    '["تنميل في القدمين", "حرقة في الأطراف", "ضعف في القبضة", "ألم ليلي"]',
    '["جابابنتين 300مج", "فيتامين ب المركب", "ألفا ليبويك أسيد"]',
    'علاج طبيعي، تحكم في سكر الدم، تمارين تقوية',
    'تحسن طفيف في الأعراض، يحتاج متابعة مستمرة', '142/88', 36.9,
    '["nerve_conduction_study.pdf", "emg_results.pdf"]', 180.3, 92.1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- السجل الخامس عشر - طبيب العيون (مريض جديد)
INSERT INTO TAH57.MedicalRecords (PATIENT_ID,DOCTOR_ID,DIAGNOSIS,SYMPTOMS,MEDICATIONS,TREATMENTPLAN,NOTES,BLOOD_PRESSURE,TEMPERATURE,IMAGES,HEIGHT,WEIGHT,CREATED_AT, UPDATED_AT)
 VALUES ( 9526, 7526, 'جفاف العين المزمن', 
    '["حرقة في العيون", "إحساس بوجود رمل", "تشويش متقطع في الرؤية", "احمرار"]',
    '["دموع اصطناعية", "قطرات مضادة للالتهاب", "مرهم ليلي"]',
    'استخدام قطرات مرطبة كل ساعتين، تجنب التيارات الهوائية',
    'تحسن ملحوظ في الراحة، استمرار العلاج المحافظ', '135/82', 37.0,
    '["eye_surface_test.jpg", "tear_film_analysis.pdf"]', 167.9, 69.8,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
-----------------*******************************-------------

-- Create tah57.audit_logs table for tracking user actions
-- Run this script in your Oracle database

CREATE TABLE tah57.audit_logs (
  id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id NUMBER,
  action VARCHAR2(100) NOT NULL,
  resource_type VARCHAR2(100) NOT NULL,
  resource_id NUMBER,
  details VARCHAR2(100),
  ip_address VARCHAR2(45),
  user_agent VARCHAR2(500),
  status VARCHAR2(20) NOT NULL,
  error_message VARCHAR2(1000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_user_id ON tah57.audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type ON tah57.audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON tah57.audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON tah57.audit_logs(action);

-- Add comments for documentation
COMMENT ON TABLE tah57.audit_logs IS 'Tracks all user actions for security and compliance';
COMMENT ON COLUMN tah57.audit_logs.id IS 'Primary key, auto-generated';
COMMENT ON COLUMN tah57.audit_logs.user_id IS 'ID of the user who performed the action';
COMMENT ON COLUMN tah57.audit_logs.action IS 'Action type: create, update, delete, read, etc.';
COMMENT ON COLUMN tah57.audit_logs.resource_type IS 'Resource type: Patient, Doctor, Appointment, etc.';
COMMENT ON COLUMN tah57.audit_logs.resource_id IS 'ID of the affected resource';
COMMENT ON COLUMN tah57.audit_logs.details IS 'Additional details about the action';
COMMENT ON COLUMN tah57.audit_logs.ip_address IS 'IP address of the user';
COMMENT ON COLUMN tah57.audit_logs.user_agent IS 'User agent (browser) information';
COMMENT ON COLUMN tah57.audit_logs.status IS 'Status: success or failure';
COMMENT ON COLUMN tah57.audit_logs.error_message IS 'Error message if status is failure';
COMMENT ON COLUMN tah57.audit_logs.created_at IS 'Timestamp when the action occurred';

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT ON tah57.audit_logs TO your_app_user;

-- حذف الجدول القديم إن وجد
DROP TABLE TAH57.INVOICES CASCADE CONSTRAINTS;

-- إنشاء جدول الفواتير
CREATE TABLE TAH57.INVOICES
(
  INVOICE_ID      NUMBER(20) PRIMARY KEY,
  PATIENT_ID      NUMBER(20) NOT NULL,
  APPOINTMENT_ID  NUMBER(20),
  INVOICE_NUMBER  VARCHAR2(50 BYTE) NOT NULL UNIQUE,
  INVOICE_DATE    DATE DEFAULT SYSDATE NOT NULL,
  AMOUNT          NUMBER(10,2) NOT NULL,
  DISCOUNT        NUMBER(10,2) DEFAULT 0,
  TOTAL_AMOUNT    NUMBER(10,2) NOT NULL,
  PAID_AMOUNT     NUMBER(10,2) DEFAULT 0,
  PAYMENT_STATUS  VARCHAR2(20 BYTE) DEFAULT 'unpaid' NOT NULL,
  PAYMENT_METHOD  VARCHAR2(50 BYTE),
  PAYMENT_DATE    DATE,
  NOTES           VARCHAR2(500 BYTE),
  CREATED_BY      NUMBER(20),
  CREATED_AT      TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

-- التعليقات
COMMENT ON TABLE TAH57.INVOICES IS 'جدول الفواتير';
COMMENT ON COLUMN TAH57.INVOICES.INVOICE_NUMBER IS 'رقم الفاتورة (INV-2025-0001)';
COMMENT ON COLUMN TAH57.INVOICES.PAYMENT_STATUS IS 'حالة الدفع: unpaid, partial, paid, cancelled';

-- القيود (Constraints)
ALTER TABLE TAH57.INVOICES ADD (
  CONSTRAINT CHK_INV_AMOUNTS CHECK (
    TOTAL_AMOUNT >= 0 AND PAID_AMOUNT >= 0 AND PAID_AMOUNT <= TOTAL_AMOUNT
  ),
  CONSTRAINT CHK_INV_STATUS CHECK (
    PAYMENT_STATUS IN ('unpaid', 'partial', 'paid', 'cancelled')
  ),
  CONSTRAINT FK_INV_PATIENT FOREIGN KEY (PATIENT_ID) 
    REFERENCES TAH57.PATIENTS (PATIENT_ID) ON DELETE CASCADE,
  CONSTRAINT FK_INV_APPOINTMENT FOREIGN KEY (APPOINTMENT_ID) 
    REFERENCES TAH57.APPOINTMENTS (APPOINTMENT_ID) ON DELETE SET NULL,
  CONSTRAINT FK_INV_CREATOR FOREIGN KEY (CREATED_BY) 
    REFERENCES TAH57.USERS (USER_ID) ON DELETE SET NULL
);

-- الفهارس (Indexes)
CREATE INDEX IDX_INVOICES_PATIENT ON TAH57.INVOICES(PATIENT_ID);
CREATE INDEX IDX_INVOICES_APPOINTMENT ON TAH57.INVOICES(APPOINTMENT_ID);
CREATE INDEX IDX_INVOICES_DATE ON TAH57.INVOICES(INVOICE_DATE);
CREATE INDEX IDX_INVOICES_STATUS ON TAH57.INVOICES(PAYMENT_STATUS);

-- Sequence لتوليد الأرقام التسلسلية
CREATE SEQUENCE TAH57.INVOICES_SEQ
  START WITH 31
  MAXVALUE 9999999999999999999999999999
  MINVALUE 1
  NOCYCLE;

-- Trigger لتحديث حالة الدفع عند الإدراج
CREATE OR REPLACE TRIGGER TAH57.TRG_INVOICE_INSERT
BEFORE INSERT ON TAH57.INVOICES
FOR EACH ROW
BEGIN
  :NEW.INVOICE_ID := TO_NUMBER('88' || TAH57.INVOICES_seq.NEXTVAL);
  
  IF :NEW.INVOICE_NUMBER IS NULL THEN
    :NEW.INVOICE_NUMBER := 'INV-' || TO_CHAR(SYSDATE, 'YYYY') || '-' || 
                           LPAD(TAH57.INVOICES_seq.CURRVAL, 4, '0');
  END IF;
  
  IF :NEW.PAID_AMOUNT >= :NEW.TOTAL_AMOUNT THEN
    :NEW.PAYMENT_STATUS := 'paid';
  ELSIF :NEW.PAID_AMOUNT > 0 THEN
    :NEW.PAYMENT_STATUS := 'partial';
  ELSE
    :NEW.PAYMENT_STATUS := 'unpaid';
  END IF;
END;
/

-- Trigger لتحديث حالة الدفع عند التعديل
CREATE OR REPLACE TRIGGER TAH57.TRG_INVOICE_UPDATE
BEFORE UPDATE ON TAH57.INVOICES
FOR EACH ROW
BEGIN
  IF :NEW.PAID_AMOUNT >= :NEW.TOTAL_AMOUNT THEN
    :NEW.PAYMENT_STATUS := 'paid';
  ELSIF :NEW.PAID_AMOUNT > 0 THEN
    :NEW.PAYMENT_STATUS := 'partial';
  ELSE
    :NEW.PAYMENT_STATUS := 'unpaid';
  END IF;
END;
/

----------------------------------------------

-- إدراج بيانات تجريبية
INSERT INTO TAH57.INVOICES 
(PATIENT_ID, APPOINTMENT_ID, AMOUNT, DISCOUNT, TOTAL_AMOUNT, PAID_AMOUNT, PAYMENT_METHOD, NOTES, CREATED_BY)
VALUES (1001, 501, 500, 50, 450, 450, 'Cash', 'دفع كامل', 201);

INSERT INTO TAH57.INVOICES 
(PATIENT_ID, APPOINTMENT_ID, AMOUNT, DISCOUNT, TOTAL_AMOUNT, PAID_AMOUNT, PAYMENT_METHOD, NOTES, CREATED_BY)
VALUES (1002, 502, 1000, 100, 900, 500, 'Credit Card', 'دفع جزئي', 201);

INSERT INTO TAH57.INVOICES 
(PATIENT_ID, APPOINTMENT_ID, AMOUNT, DISCOUNT, TOTAL_AMOUNT, PAID_AMOUNT, PAYMENT_METHOD, NOTES, CREATED_BY)
VALUES (1003, 503, 750, 0, 750, 0, NULL, 'لم يتم الدفع بعد', 202);

INSERT INTO TAH57.INVOICES 
(PATIENT_ID, APPOINTMENT_ID, AMOUNT, DISCOUNT, TOTAL_AMOUNT, PAID_AMOUNT, PAYMENT_METHOD, NOTES, CREATED_BY)
VALUES (1004, 504, 600, 60, 540, 540, 'Bank Transfer', 'دفع كامل', 201);

COMMIT;

