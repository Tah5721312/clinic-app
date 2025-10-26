'use client';

import { Calendar, Clock, FileText, User, ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Doctor, Patient, TimeSlot } from '@/lib/types';
import { useDoctors, useSpecialties } from '@/hooks/useApiData';

import Button from '@/components/buttons/Button';
import { DOMAIN } from '@/lib/constants';

interface EnhancedAppointmentFormProps {
  doctorId?: string;
  patientId?: string;
  onSuccess?: () => void;
}

interface FormData {
  patient_id: number;
  doctor_id: number;
  schedule: string;
  reason: string;
  note?: string;
  appointment_type: string;
  payment_status: string;
  payment_amount: number;
  payment_method: string;
}

export default function EnhancedAppointmentForm({
  doctorId,
  patientId,
  onSuccess,
}: EnhancedAppointmentFormProps) {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  
  // Specialty and doctor filtering
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  
  // Fetch specialties and doctors
  const { data: specialties, loading: specialtiesLoading, error: specialtiesError } = useSpecialties();
  const { data: doctors } = useDoctors(selectedSpecialty || undefined);
  
  // Fetch all doctors when doctorId is provided to get the doctor's specialty
  const { data: allDoctors } = useDoctors();
  
  // Custom dropdown states
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const [formData, setFormData] = useState<FormData>({
    patient_id: patientId ? parseInt(patientId) : 0,
    doctor_id: doctorId ? parseInt(doctorId) : 0,
    schedule: '',
    reason: '',
    note: '',
    appointment_type: 'consultation',
    payment_status: 'unpaid',
    payment_amount: 0,
    payment_method: '',
  });

  // Update form data when props change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      patient_id: patientId ? parseInt(patientId) : prev.patient_id,
      doctor_id: doctorId ? parseInt(doctorId) : prev.doctor_id,
    }));
  }, [doctorId, patientId]);

  // Handle initial doctor selection and specialty auto-selection when doctorId is provided
  useEffect(() => {
    if (doctorId && allDoctors && allDoctors.length > 0) {
      const doctor = allDoctors.find(d => d.DOCTOR_ID === parseInt(doctorId));
      if (doctor) {
        setSelectedDoctor(doctor);
        // Auto-select the specialty when doctor is pre-selected
        if (doctor.SPECIALTY && !selectedSpecialty) {
          setSelectedSpecialty(doctor.SPECIALTY);
        }
      }
    }
  }, [doctorId, allDoctors, selectedSpecialty]);

  // Set selected doctor when doctors are loaded and formData.doctor_id changes
  useEffect(() => {
    if (doctors && doctors.length > 0 && formData.doctor_id) {
      const doctor = doctors.find(d => d.DOCTOR_ID === formData.doctor_id);
      if (doctor) {
        setSelectedDoctor(doctor);
      }
    }
  }, [doctors, formData.doctor_id]);

  useEffect(() => {
    // Fetch patients for dropdown
    const fetchPatients = async () => {
      try {
        const patientsRes = await fetch(`${DOMAIN}/api/patients`);
        if (patientsRes.ok) {
          const patientsData = await patientsRes.json();
          setPatients(patientsData);
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
      }
    };

    fetchPatients();
  }, []);

  // Generate default time slots when no schedule is available
  const generateDefaultTimeSlots = () => {
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 17;   // 5 PM
    const slotDuration = 30; // 30 minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minutes = 0; minutes < 60; minutes += slotDuration) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const endTime = minutes + slotDuration >= 60 
          ? `${(hour + 1).toString().padStart(2, '0')}:${((minutes + slotDuration) % 60).toString().padStart(2, '0')}`
          : `${hour.toString().padStart(2, '0')}:${(minutes + slotDuration).toString().padStart(2, '0')}`;
        
        slots.push({
          start_time: timeString,
          end_time: endTime,
          is_available: true,
          is_booked: false
        });
      }
    }
    return slots;
  };

  // Fetch available time slots when doctor and date are selected
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!formData.doctor_id || !selectedDate) {
        setAvailableTimeSlots([]);
        return;
      }

      setLoadingTimeSlots(true);
      try {
        const response = await fetch(
          `${DOMAIN}/api/doctors/${formData.doctor_id}/available-slots?date=${selectedDate}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setAvailableTimeSlots(data.timeSlots || []);
        } else {
          // If API fails, use default time slots
          console.log('API failed, using default time slots');
          setAvailableTimeSlots(generateDefaultTimeSlots());
        }
      } catch (err) {
        console.error('Error fetching time slots:', err);
        // If there's an error, use default time slots
        setAvailableTimeSlots(generateDefaultTimeSlots());
      } finally {
        setLoadingTimeSlots(false);
      }
    };

    fetchTimeSlots();
  }, [formData.doctor_id, selectedDate]);

  // Handle specialty change
  const handleSpecialtyChange = (specialty: string) => {
    setSelectedSpecialty(specialty);
    setSelectedDoctor(null);
    setFormData(prev => ({ ...prev, doctor_id: 0 }));
    setAvailableTimeSlots([]);
    setSelectedDate('');
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'patient_id' || name === 'doctor_id'
          ? parseInt(value) || 0
          : name === 'payment_amount'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleDoctorSelect = (doctor: Doctor | null) => {
    setSelectedDoctor(doctor);
    setFormData(prev => ({
      ...prev,
      doctor_id: doctor ? doctor.DOCTOR_ID : 0
    }));
    setIsDoctorDropdownOpen(false);
    setAvailableTimeSlots([]);
    setSelectedDate('');
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    setFormData(prev => ({ ...prev, schedule: '' })); // Clear selected time when date changes
  };

  const incrementDateByDays = (baseDateStr: string, days: number) => {
    const base = baseDateStr ? new Date(baseDateStr) : new Date();
    const next = new Date(base);
    next.setDate(base.getDate() + days);
    return next.toISOString().split('T')[0];
  };

  const handleNextDay = () => {
    const nextDate = incrementDateByDays(selectedDate || today, 1);
    setSelectedDate(nextDate);
    setFormData(prev => ({ ...prev, schedule: '' }));
  };

  const handlePrevDay = () => {
    const base = selectedDate || today;
    const prevDate = incrementDateByDays(base, -1);
    // Do not go before today
    if (prevDate < today) return;
    setSelectedDate(prevDate);
    setFormData(prev => ({ ...prev, schedule: '' }));
  };

  const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
    // Completely prevent selection of booked slots
    if (timeSlot.is_booked) {
      return;
    }
    
    const dateTime = `${selectedDate}T${timeSlot.start_time}:00`;
    setFormData(prev => ({ ...prev, schedule: dateTime }));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500 text-white',
      'bg-blue-500 text-white',
      'bg-green-500 text-white',
      'bg-purple-500 text-white',
      'bg-orange-500 text-white',
      'bg-teal-500 text-white',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required fields
      if (
        !formData.patient_id ||
        !formData.doctor_id ||
        !formData.schedule ||
        !formData.reason
      ) {
        throw new Error('يرجى ملء جميع الحقول المطلوبة');
      }

      // Check if selected time slot is available
      const selectedTime = formData.schedule.split('T')[1]?.substring(0, 5);
      const selectedSlot = availableTimeSlots.find(slot => slot.start_time === selectedTime);
      
      if (!selectedSlot || selectedSlot.is_booked) {
        throw new Error('الوقت المحدد غير متاح، يرجى اختيار وقت آخر');
      }

      const response = await fetch(`${DOMAIN}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'حدث خطأ أثناء إنشاء الموعد');
      }

      setSuccess(true);
      setFormData({
        patient_id: patientId ? parseInt(patientId) : 0,
        doctor_id: doctorId ? parseInt(doctorId) : 0,
        schedule: '',
        reason: '',
        note: '',
        appointment_type: 'consultation',
        payment_status: 'unpaid',
        payment_amount: 0,
        payment_method: '',
      });
      setSelectedDate('');
      setAvailableTimeSlots([]);

      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          router.push('/appointments');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الموعد');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  // Current date label for pagination display
  const currentDateStr = selectedDate || today;
  const currentDateLabel = new Date(currentDateStr).toLocaleDateString('ar-EG', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const canGoPrevDay = (incrementDateByDays(currentDateStr, -1) >= today);

  return (
    <div className="max-w-2xl mx-auto p-6 card rounded-lg shadow-md">
      <h2 className="card-title text-2xl font-bold mb-6 text-center">حجز موعد جديد</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          تم إنشاء الموعد بنجاح! سيتم توجيهك إلى صفحة المواعيد...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline w-4 h-4 mr-1" />
            المريض *
          </label>
          <select
            name="patient_id"
            value={formData.patient_id}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value={0}>اختر المريض</option>
            {patients.map((patient) => (
              <option key={patient.PATIENT_ID} value={patient.PATIENT_ID}>
                {patient.NAME}
              </option>
            ))}
          </select>
        </div>

        {/* Specialty Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            التخصص
          </label>
          <select
            value={selectedSpecialty}
            onChange={(e) => handleSpecialtyChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">جميع التخصصات</option>
            {specialties?.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </div>

        {/* Doctor Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الطبيب *
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDoctorDropdownOpen(!isDoctorDropdownOpen)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500  flex items-center justify-between"
            >
              <div className="card-title  flex items-center">
                {selectedDoctor ? (
                  <>
                    {/* Doctor Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getAvatarColor(selectedDoctor.NAME)} shadow-sm ml-3`}>
                      {selectedDoctor.IMAGE ? (
                        <img 
                          src={selectedDoctor.IMAGE} 
                          alt={selectedDoctor.NAME}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(selectedDoctor.NAME)
                      )}
                    </div>
                    <span>{selectedDoctor.NAME}</span>
                  </>
                ) : (
                  <span>اختر الطبيب</span>
                )}
              </div>
              <ChevronDown className="w-4 h-4" />

            </button>
            
            {isDoctorDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {doctors?.map((doctor) => (
                  <button
                    key={doctor.DOCTOR_ID}
                    type="button"
                    onClick={() => handleDoctorSelect(doctor)}
                    className="w-full px-3 py-2 text-right hover:bg-gray-100 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      {/* Doctor Avatar */}
                      <div className={` w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getAvatarColor(doctor.NAME)} shadow-sm ml-3`}>
                        {doctor.IMAGE ? (
                          <img 
                            src={doctor.IMAGE} 
                            alt={doctor.NAME}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(doctor.NAME)
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium card-title ">{doctor.NAME}</div>
                        <div className="text-sm text-gray-500">{doctor.SPECIALTY}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Date Selection */}
        {formData.doctor_id && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              التاريخ *
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              min={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handlePrevDay}
                disabled={!canGoPrevDay}
                className={`inline-flex items-center px-3 py-1 border rounded-md ${
                  canGoPrevDay
                    ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    : 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                }`}
                aria-label="اليوم السابق"
                title="اليوم السابق"
              >
                اليوم السابق
              </button>

              <span className="text-sm text-gray-600">{currentDateLabel}</span>

              <button
                type="button"
                onClick={handleNextDay}
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                aria-label="اليوم التالي"
                title="اليوم التالي"
              >
                اليوم التالي
              </button>
            </div>
          </div>
        )}

        {/* Time Slot Selection */}
        {selectedDate && formData.doctor_id && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline w-4 h-4 mr-1" />
              الأوقات المتاحة *
            </label>
            
            {loadingTimeSlots ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">جاري جلب الأوقات المتاحة...</p>
              </div>
            ) : availableTimeSlots.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <XCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>لا توجد أوقات متاحة في هذا التاريخ</p>
                <p className="text-sm mt-1">يرجى اختيار تاريخ آخر أو طبيب آخر</p>
              </div>
            ) : (
              <div>
                {availableTimeSlots.length > 0 && (
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-700">
                      <Clock className="inline w-4 h-4 mr-1" />
                      {availableTimeSlots.length} وقت متاح للاختيار من بينه
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {availableTimeSlots.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleTimeSlotSelect(slot)}
                    disabled={slot.is_booked}
                    title={slot.is_booked ? 'هذا الوقت محجوز' : 'احجز هذا الوقت'}
                    className={`p-2 text-sm rounded-md border transition-colors ${
                      slot.is_booked
                        ? 'bg-red-100 text-red-500 border-red-300 cursor-not-allowed pointer-events-none'
                        : formData.schedule.includes(slot.start_time)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                
                    <div className="flex items-center justify-center gap-1">
                      {slot.is_booked ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-3 h-3" />
                      )}
                      <span>{slot.start_time}</span>
                      {slot.is_booked && (
                        <span className="ml-1 text-xs font-medium">محجوز</span>
                      )}
                    </div>
                  </button>
                ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Appointment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نوع الموعد *
          </label>
          <select
            name="appointment_type"
            value={formData.appointment_type}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="consultation">استشارة</option>
            <option value="follow_up">متابعة</option>
            <option value="emergency">طوارئ</option>
          </select>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="inline w-4 h-4 mr-1" />
            سبب الزيارة *
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="وصف سبب الزيارة..."
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ملاحظات إضافية
          </label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="أي ملاحظات إضافية..."
          />
        </div>

        {/* Payment Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            حالة الدفع
          </label>
          <select
            name="payment_status"
            value={formData.payment_status}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="unpaid">غير مدفوع</option>
            <option value="partial">مدفوع جزئياً</option>
            <option value="paid">مدفوع</option>
          </select>
        </div>

        {/* Payment Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            مبلغ الدفع (جنيه مصري)
          </label>
          <input
            type="number"
            name="payment_amount"
            value={formData.payment_amount}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            طريقة الدفع
          </label>
          <select
            name="payment_method"
            value={formData.payment_method}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">اختر طريقة الدفع</option>
            <option value="cash">نقداً</option>
            <option value="card">بطاقة ائتمان/خصم</option>
            <option value="bank_transfer">تحويل بنكي</option>
            <option value="insurance">تأمين</option>
            <option value="other">أخرى</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 space-x-reverse">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.schedule}
            isLoading={loading}
          >
            {loading ? 'جاري الحفظ...' : 'حجز الموعد'}
          </Button>
        </div>
      </form>
    </div>
  );
}
