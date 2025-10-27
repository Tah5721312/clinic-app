'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Appointment, Doctor, Patient } from '@/lib/types';
import { DOMAIN } from '@/lib/constants';
import { CreditCard, DollarSign } from 'lucide-react';

export default function EditAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Fix for Next.js 15 params
  const resolvedParams = use(params);

  const isSuperAdmin = session?.user?.isAdmin || session?.user?.roleId === 211;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch appointment data
        const [appointmentRes, patientsRes, doctorsRes] = await Promise.all([
          fetch(`${DOMAIN}/api/appointments/${resolvedParams.id}`),
          fetch(`${DOMAIN}/api/patients`),
          fetch(`${DOMAIN}/api/doctors`)
        ]);
        
        if (!appointmentRes.ok) {
          const errorData = await appointmentRes.json();
          throw new Error(errorData.error || 'فشل في تحميل بيانات الموعد');
        }
        
        const appointmentData = await appointmentRes.json();
        const patientsData = await patientsRes.json();
        const doctorsData = await doctorsRes.json();
        
        setAppointment(appointmentData);
        setPatients(patientsData);
        setDoctors(doctorsData);
        setError(null);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setAppointment(prev => {
      if (!prev) return null;
      
      let newValue: any = value;
      
      // Handle different input types
      if (type === 'datetime-local') {
        newValue = new Date(value);
      } else if (name === 'PATIENT_ID' || name === 'DOCTOR_ID') {
        newValue = parseInt(value) || '';
      } else if (name === 'PAYMENT_AMOUNT') {
        newValue = parseFloat(value) || 0;
      }
      
      return { ...prev, [name]: newValue };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;
    
    setSaving(true);
    setError(null);
    
    try {
      // Prepare data for API (convert field names to lowercase for backend)
      const updateData = {
        patient_id: appointment.PATIENT_ID,
        doctor_id: appointment.DOCTOR_ID,
        schedule: appointment.SCHEDULE,
        reason: appointment.REASON,
        note: appointment.NOTE || '',
        status: appointment.STATUS,
        cancellationReason: appointment.CANCELLATIONREASON || '',
        appointment_type: appointment.APPOINTMENT_TYPE || 'consultation',
        payment_status: appointment.PAYMENT_STATUS || 'unpaid',
        // payment_amount is disabled - it was paid at booking time and should not be changed
        // payment_amount: appointment.PAYMENT_AMOUNT || 0
      };
      
      console.log('Sending update data:', updateData);
      
      const response = await fetch(`${DOMAIN}/api/appointments/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'فشل في تحديث بيانات الموعد');
      }
      
      console.log('Update successful:', responseData);
      
      // Navigate to appointment details or list
      router.push(`/appointments/${resolvedParams.id}`);
      
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setSaving(false);
    }
  };

  const formatDateTimeForInput = (date: Date | string): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-700">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen card flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">لم يتم العثور على الموعد</h2>
          {error && <p className="text-gray-600 mb-4">{error}</p>}
          <button
            onClick={() => router.push('/appointments')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
          >
            العودة إلى قائمة المواعيد
          </button>
        </div>
      </div>
    );
  }

  // Check if appointment is paid and prevent editing (unless super admin)
  if (appointment.PAYMENT_STATUS === 'paid' && !isSuperAdmin) {
    return (
      <div className="min-h-screen card flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <div className="text-yellow-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">لا يمكن تعديل الموعد المدفوع</h2>
          <p className="text-gray-600 mb-4">هذا الموعد تم دفع تكلفته بالكامل ولا يمكن تعديله.</p>
          <button
            onClick={() => router.push(`/appointments/${resolvedParams.id}`)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
          >
            العودة إلى تفاصيل الموعد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className=" card py-8" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">تعديل الموعد</h1>
              <p className="text-gray-600 mt-1">رقم الموعد: {appointment.APPOINTMENT_ID}</p>
            </div>
            <button
              onClick={() => router.back()}
              className="mt-4 sm:mt-0 flex items-center text-blue-600 hover:text-blue-800 transition duration-150"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              العودة للخلف
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-bold">خطأ:</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* اختيار المريض */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="PATIENT_ID">
                  المريض *
                </label>
                <select
                  id="PATIENT_ID"
                  name="PATIENT_ID"
                  value={appointment.PATIENT_ID || ''}
                  onChange={handleChange}
                  className="w-full px-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  required
                >
                  <option value="">اختر المريض</option>
                  {patients.map((patient) => (
                    <option key={patient.PATIENT_ID} value={patient.PATIENT_ID}>
                      {patient.NAME}  -  {patient.PHONE}
                    </option>
                  ))}
                </select>
              </div>

              {/* اختيار الطبيب */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="DOCTOR_ID">
                  الطبيب *
                </label>
                <select
                  id="DOCTOR_ID"
                  name="DOCTOR_ID"
                  value={appointment.DOCTOR_ID || ''}
                  onChange={handleChange}
                  className="w-full px-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  required
                >
                  <option value="">اختر الطبيب</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.DOCTOR_ID} value={doctor.DOCTOR_ID}>
                      {doctor.NAME} - {doctor.SPECIALTY}
                    </option>
                  ))}
                </select>
              </div>

              {/* تاريخ ووقت الموعد */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="SCHEDULE">
                  تاريخ ووقت الموعد *
                </label>
                <input
                  type="datetime-local"
                  id="SCHEDULE"
                  name="SCHEDULE"
                  value={formatDateTimeForInput(appointment.SCHEDULE)}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  required
                />
              </div>

              {/* حالة الموعد */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="STATUS">
                  حالة الموعد *
                </label>
                <select
                  id="STATUS"
                  name="STATUS"
                  value={appointment.STATUS || ''}
                  onChange={handleChange}
                  className="w-full px-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  required
                >
                  <option value="pending">في الانتظار</option>
                  <option value="scheduled">مجدول</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </div>

              {/* نوع الموعد */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="APPOINTMENT_TYPE">
                  نوع الموعد *
                </label>
                <select
                  id="APPOINTMENT_TYPE"
                  name="APPOINTMENT_TYPE"
                  value={appointment.APPOINTMENT_TYPE || 'consultation'}
                  onChange={handleChange}
                  className="w-full px-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  required
                >
                  <option value="consultation">استشارة</option>
                  <option value="follow_up">متابعة</option>
                  <option value="emergency">طوارئ</option>
                </select>
              </div>

              {/* حالة الدفع */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="PAYMENT_STATUS">
                  <div className="flex items-center">
                    <CreditCard className="w-4 h-4 ml-1" />
                    حالة الدفع *
                  </div>
                </label>
                <select
                  id="PAYMENT_STATUS"
                  name="PAYMENT_STATUS"
                  value={appointment.PAYMENT_STATUS || 'unpaid'}
                  onChange={handleChange}
                  className="w-full px-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  required
                >
                  <option value="unpaid">غير مدفوع</option>
                  <option value="partial">مدفوع جزئياً</option>
                  <option value="paid">مدفوع بالكامل</option>
                  <option value="refunded">مسترد</option>
                </select>
              </div>

              {/* مبلغ الدفع */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="PAYMENT_AMOUNT">
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 ml-1" />
                    مبلغ الدفع (جنيه مصري)
                  </div>
                  <span className="text-xs text-gray-500 mt-1 block">(غير قابل للتعديل - يتم دفعه عند الحجز)</span>
                </label>
                <input
                  type="number"
                  id="PAYMENT_AMOUNT"
                  name="PAYMENT_AMOUNT"
                  min="0"
                  step="0.01"
                  value={appointment.PAYMENT_AMOUNT || 0}
                  onChange={handleChange}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  placeholder="0.00"
                />
              </div>

              {/* سبب الإلغاء (يظهر فقط إذا كانت الحالة ملغي) */}
              {appointment.STATUS === 'cancelled' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="CANCELLATIONREASON">
                    سبب الإلغاء
                  </label>
                  <textarea
                    id="CANCELLATIONREASON"
                    name="CANCELLATIONREASON"
                    value={appointment.CANCELLATIONREASON || ''}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    placeholder="اكتب سبب الإلغاء..."
                  />
                </div>
              )}

              {/* سبب الزيارة */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="REASON">
                  سبب الزيارة *
                </label>
                <textarea
                  id="REASON"
                  name="REASON"
                  value={appointment.REASON || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  required
                  placeholder="اكتب سبب الزيارة..."
                />
              </div>

              {/* ملاحظات */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="NOTE">
                  ملاحظات
                </label>
                <textarea
                  id="NOTE"
                  name="NOTE"
                  value={appointment.NOTE || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  placeholder="ملاحظات إضافية (اختياري)..."
                />
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition duration-200 sm:order-1"
                disabled={saving}
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري الحفظ...
                  </>
                ) : (
                  'حفظ التعديلات'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mt-0.5 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-medium">ملاحظة:</p>
              <p>الحقول المميزة بعلامة (*) إلزامية ويجب ملؤها قبل حفظ التعديلات.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}