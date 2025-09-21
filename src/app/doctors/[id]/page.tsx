'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Doctor, Appointment } from '@/lib/types';

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.id as string;
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (doctorId) {
      fetchDoctor();
      fetchDoctorAppointments();
    }
  }, [doctorId]);

  const fetchDoctor = async () => {
    try {
      const response = await fetch(`/api/doctors/${doctorId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch doctor details');
      }
      const data = await response.json();
      setDoctor(data);
    } catch (err) {
      setError('حدث خطأ أثناء جلب بيانات الطبيب');
      console.error('Error fetching doctor:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorAppointments = async () => {
    try {
      const response = await fetch(`/api/appointments?doctorId=${doctorId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      const data = await response.json();
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا الطبيب؟')) return;
    
    try {
      const response = await fetch(`/api/doctors/${doctorId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete doctor');
      }
      
      router.push('/doctors');
    } catch (err) {
      setError('حدث خطأ أثناء حذف الطبيب');
      console.error('Error deleting doctor:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">جاري تحميل البيانات...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        {error}
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">الطبيب غير موجود</h2>
        <Link href="/doctors" className="text-blue-600 hover:underline">
          العودة إلى قائمة الأطباء
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">تفاصيل الطبيب</h2>
          <p className="text-gray-600">معلومات كاملة عن الطبيب وجدول المواعيد</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/doctors/${doctorId}/edit`}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            تعديل البيانات
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            حذف الطبيب
          </button>
          <Link
            href="/doctors"
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            رجوع
          </Link>
        </div>
      </div>

      {/* معلومات الطبيب */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {doctor.IMAGE && (
              <div className="flex-shrink-0">
                <img
                  src={doctor.IMAGE}
                  alt={doctor.NAME}
                  className="w-32 h-32 object-cover rounded-full border-4 border-blue-100"
                />
              </div>
            )}
            <div className="flex-grow">
              <h3 className="text-2xl font-bold mb-2">{doctor.NAME}</h3>
              <p className="text-blue-600 font-medium text-lg mb-4">{doctor.SPECIALTY}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">
                    <span className="font-medium">البريد الإلكتروني:</span> {doctor.EMAIL}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">الهاتف:</span> {doctor.PHONE}
                  </p>
                  {doctor.QUALIFICATION && (
                    <p className="text-gray-600">
                      <span className="font-medium">سنوات الخبرة:</span> {doctor.QUALIFICATION}
                    </p>
                  )}
                </div>
                <div>
                  {doctor.QUALIFICATION && (
                    <p className="text-gray-600">
                      <span className="font-medium">المؤهلات:</span> {doctor.QUALIFICATION}
                    </p>
                  )}
                </div>
              </div>
              
              {doctor.BIO && (
                <div className="mt-4">
                  <p className="font-medium mb-2">السيرة الذاتية:</p>
                  <p className="text-gray-700">{doctor.BIO}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* التبويبات */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8 space-x-reverse">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            التفاصيل
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'appointments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            المواعيد
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schedule'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            الجدول الزمني
          </button>
        </nav>
      </div>

      {/* محتوى التبويبات */}
      {activeTab === 'details' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">معلومات الاتصال</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">
                <span className="font-medium">البريد الإلكتروني:</span> {doctor.EMAIL}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">الهاتف:</span> {doctor.PHONE}
              </p>
            </div>
            <div>
              {doctor.EXPERIENCE && (
                <p className="text-gray-600">
                  <span className="font-medium">سنوات الخبرة:</span> {doctor.EXPERIENCE}
                </p>
              )}
              {doctor.QUALIFICATION && (
                <p className="text-gray-600">
                  <span className="font-medium">المؤهلات:</span> {doctor.QUALIFICATION}
                </p>
              )}
            </div>
          </div>
          
          {doctor.BIO && (
            <div className="mt-6">
              <h4 className="text-lg font-medium mb-2">السيرة الذاتية</h4>
              <p className="text-gray-700">{doctor.BIO}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">مواعيد الطبيب</h3>
              <Link
                href={`/appointments/new?doctorId=${doctorId}`}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                حجز موعد جديد
              </Link>
            </div>
            
            {appointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المريض
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        التاريخ والوقت
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        السبب
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الحالة
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appointments.map((appointment) => (
                      <tr key={appointment.APPOINTMENT_ID}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.PATIENT_NAME}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(appointment.SCHEDULE).toLocaleDateString('ar-SA')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(appointment.SCHEDULE).toLocaleTimeString('ar-SA')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {appointment.REASON}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${appointment.STATUS === 'scheduled' ? 'bg-green-100 text-green-800' : ''}
                            ${appointment.STATUS === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${appointment.STATUS === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                          `}>
                            {appointment.STATUS === 'scheduled' && 'مجدول'}
                            {appointment.STATUS === 'pending' && 'قيد الانتظار'}
                            {appointment.STATUS === 'cancelled' && 'ملغي'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                لا توجد مواعيد لهذا الطبيب
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">الجدول الزمني</h3>
          <p className="text-gray-600">هنا يمكن عرض الجدول الزمني للطبيب وأوقات العمل.</p>
          {/* يمكن إضافة تقويم أو جدول زمني تفاعلي هنا */}
        </div>
      )}
    </div>
  );
}