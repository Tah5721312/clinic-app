-- Database Migration Script
-- Adding new fields to APPOINTMENTS and DOCTORS tables

-- 1. Add new fields to APPOINTMENTS table
ALTER TABLE TAH57.APPOINTMENTS 
ADD (
    appointment_type VARCHAR2(20) DEFAULT 'consultation' NOT NULL,
    payment_status VARCHAR2(20) DEFAULT 'unpaid' NOT NULL,
    payment_amount NUMBER(10,2) DEFAULT 0
);

-- Add constraints for appointment_type
ALTER TABLE TAH57.APPOINTMENTS 
ADD CONSTRAINT chk_appointment_type 
CHECK (appointment_type IN ('consultation', 'follow_up', 'emergency'));

-- Add constraints for payment_status
ALTER TABLE TAH57.APPOINTMENTS 
ADD CONSTRAINT chk_payment_status 
CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded'));

-- Add constraint for payment_amount
ALTER TABLE TAH57.APPOINTMENTS 
ADD CONSTRAINT chk_payment_amount 
CHECK (payment_amount >= 0);

-- Add comments for documentation
COMMENT ON COLUMN TAH57.APPOINTMENTS.appointment_type IS 'نوع الموعد: consultation, follow_up, emergency';
COMMENT ON COLUMN TAH57.APPOINTMENTS.payment_status IS 'حالة الدفع: unpaid, partial, paid, refunded';
COMMENT ON COLUMN TAH57.APPOINTMENTS.payment_amount IS 'مبلغ الدفع بالجنيه المصري';

-- 2. Add new fields to DOCTORS table
ALTER TABLE TAH57.DOCTORS 
ADD (
    consultation_fee NUMBER(10,2) DEFAULT 0,
    is_available NUMBER(1) DEFAULT 1 NOT NULL,
    availability_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add constraints for is_available
ALTER TABLE TAH57.DOCTORS 
ADD CONSTRAINT chk_is_available 
CHECK (is_available IN (0, 1));

-- Add constraint for consultation_fee
ALTER TABLE TAH57.DOCTORS 
ADD CONSTRAINT chk_consultation_fee 
CHECK (consultation_fee >= 0);

-- Add comments for documentation
COMMENT ON COLUMN TAH57.DOCTORS.consultation_fee IS 'رسوم الكشف بالجنيه المصري';
COMMENT ON COLUMN TAH57.DOCTORS.is_available IS 'حالة التوفر: 1=متاح، 0=غير متاح';
COMMENT ON COLUMN TAH57.DOCTORS.availability_updated_at IS 'تاريخ آخر تحديث لحالة التوفر';

-- 3. Create indexes for better performance
CREATE INDEX idx_appointments_doctor_id ON TAH57.APPOINTMENTS(doctor_id);
CREATE INDEX idx_appointments_patient_id ON TAH57.APPOINTMENTS(patient_id);
CREATE INDEX idx_appointments_status ON TAH57.APPOINTMENTS(status);
CREATE INDEX idx_appointments_payment_status ON TAH57.APPOINTMENTS(payment_status);
CREATE INDEX idx_appointments_appointment_type ON TAH57.APPOINTMENTS(appointment_type);
CREATE INDEX idx_appointments_schedule ON TAH57.APPOINTMENTS(schedule);

CREATE INDEX idx_doctors_is_available ON TAH57.DOCTORS(is_available);
CREATE INDEX idx_doctors_consultation_fee ON TAH57.DOCTORS(consultation_fee);

-- 4. Update existing data with default values
UPDATE TAH57.APPOINTMENTS 
SET appointment_type = 'consultation' 
WHERE appointment_type IS NULL;

UPDATE TAH57.APPOINTMENTS 
SET payment_status = 'unpaid' 
WHERE payment_status IS NULL;

UPDATE TAH57.APPOINTMENTS 
SET payment_amount = 0 
WHERE payment_amount IS NULL;

UPDATE TAH57.DOCTORS 
SET consultation_fee = 0 
WHERE consultation_fee IS NULL;

UPDATE TAH57.DOCTORS 
SET is_available = 1 
WHERE is_available IS NULL;

UPDATE TAH57.DOCTORS 
SET availability_updated_at = CURRENT_TIMESTAMP 
WHERE availability_updated_at IS NULL;

-- 5. Commit the changes
COMMIT;

-- 6. Verify the changes
SELECT 'APPOINTMENTS table updated successfully' as status FROM DUAL;
SELECT 'DOCTORS table updated successfully' as status FROM DUAL;
SELECT 'Indexes created successfully' as status FROM DUAL;
SELECT 'Data updated successfully' as status FROM DUAL;
