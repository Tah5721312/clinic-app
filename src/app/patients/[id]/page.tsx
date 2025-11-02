'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Mail, Phone, Calendar, FileText, User, Clock, AlertCircle, Trash2, Edit } from 'lucide-react';
import { Appointment, Patient } from '@/lib/types';
import { DOMAIN } from '@/lib/constants';
import { Can } from '@/components/Can';
import { toastError, toastSuccess, toastWarning } from '@/lib/toast';

interface LoadingSpinnerProps {
  size?: 'sm' | 'lg';
  text?: string;
}

interface ButtonLinkProps {
  href: string;
  children: React.ReactNode;
  variant: 'primary' | 'outline' | 'danger';
  onClick?: () => void;
}

interface ErrorFallbackProps {
  error: Error;
  onRetry?: () => void;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'sm', text }) => {
  const spinnerSize = size === 'lg' ? 'w-16 h-16' : 'w-8 h-8';
  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`animate-spin rounded-full border-t-2 border-b-2 border-blue-500 ${spinnerSize}`}></div>
      {text && <p className="mt-2 text-gray-500">{text}</p>}
    </div>
  );
};

const ButtonLink: React.FC<ButtonLinkProps> = ({ href, children, variant, onClick }) => {
  const baseStyle = "font-bold py-2 px-4 rounded transition-colors duration-200 ease-in-out inline-block text-center";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-100",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  if (onClick) {
    return (
      <button onClick={onClick} className={`${baseStyle} ${variants[variant]}`}>
        {children}
      </button>
    );
  }

  return (
    <a href={href} className={`${baseStyle} ${variants[variant]}`}>
      {children}
    </a>
  );
};

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onRetry }) => {
  return (
    <div className="bg-red-100 text-red-700 p-4 rounded-lg text-center">
      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
      <p className="font-bold">حدث خطأ:</p>
      <pre className="mt-2 text-sm whitespace-pre-wrap">{error.message}</pre>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
};

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params?.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'appointments'>('details');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingAppointment, setDeletingAppointment] = useState<number | null>(null);
  const [cancellingAppointment, setCancellingAppointment] = useState<number | null>(null);

  const fetchPatientData = useCallback(async () => {
    if (!patientId) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${DOMAIN}/api/patients/${patientId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: فشل في تحميل بيانات المريض`);
      }

      const patientData = await response.json();
      setPatient(patientData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف في تحميل بيانات المريض';
      setError(errorMessage);
      console.error('Error fetching patient:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const fetchAppointments = useCallback(async () => {
    if (!patientId) return;

    try {
      const response = await fetch(`${DOMAIN}/api/appointments?patientId=${patientId}`);

      if (response.ok) {
        const appointmentsData = await response.json();
        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      } else {
        console.warn('فشل في تحميل مواعيد المريض');
        setAppointments([]);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setAppointments([]);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
      fetchAppointments();
    }
  }, [patientId, fetchPatientData, fetchAppointments]);

  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المريض؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`${DOMAIN}/api/patients/${patientId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      // Check if deletion was blocked due to constraints
      if (data.cannotDelete) {
        toastWarning(data.message); // Show constraint message
        return; // Exit without error
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete patient');
      }

      toastSuccess('تم حذف المريض بنجاح');
      window.location.href = '/patients';

    } catch (err: any) {
      console.error('Error deleting patient:', err);
      toastError('حدث خطأ أثناء حذف المريض');
    } finally {
      setIsDeleting(false);
    }
  };

  // const handleCancelAppointment = async (appointmentId: string) => {
  //   if (!window.confirm('هل تريد إلغاء هذا الموعد؟')) return;

  //   try {
  //     const response = await fetch(`${DOMAIN}/api/appointments/${appointmentId}`, {
  //       method: 'PATCH',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ status: 'cancelled' }),
  //     });

  //     if (response.ok) {
  //       fetchAppointments();
  //       alert('تم إلغاء الموعد بنجاح');
  //     } else {
  //       throw new Error('فشل في إلغاء الموعد');
  //     }
  //   } catch (err) {
  //     alert('حدث خطأ أثناء إلغاء الموعد');
  //     console.error('Cancel appointment error:', err);
  //   }
  // };


  /**
   * دالة إلغاء الموعد - محسنة مع معالجة أفضل للأخطاء
   */
  const handleCancelAppointment = async (appointmentId: number) => {
    if (!window.confirm('هل تريد إلغاء هذا الموعد؟')) return;

    try {
      setCancellingAppointment(appointmentId);
      const response = await fetch(`${DOMAIN}/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to cancel appointment`);
      }

      // تحديث قائمة المواعيد
      if (typeof fetchAppointments === 'function') {
        fetchAppointments();
      }

      toastSuccess('تم إلغاء الموعد بنجاح');

      return data;

    } catch (err) {
      console.error('Cancel appointment error:', err);
      toastError(`حدث خطأ أثناء إلغاء الموعد: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
      throw err;
    } finally {
      setCancellingAppointment(null);
    }
  };


  const handleDeleteAppointment = async (appointmentId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموعد؟')) return;

    setDeletingAppointment(appointmentId);

    try {
      const response = await fetch(`${DOMAIN}/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete appointment');
      }

      setAppointments(prev => prev.filter(apt => apt.APPOINTMENT_ID !== appointmentId));
      toastSuccess('تم حذف الموعد بنجاح');

    } catch (error) {
      console.error('Error deleting appointment:', error);
      toastError('حدث خطأ أثناء حذف الموعد');
    } finally {
      setDeletingAppointment(null);
    }
  };

  const formatDateTime = (dateString: string | Date): string => {
    if (!dateString) return 'تاريخ غير صحيح';
    try {
      const dateObj = new Date(dateString);
      if (isNaN(dateObj.getTime())) return 'تاريخ غير صحيح';
      return dateObj.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'تاريخ غير صحيح';
    }
  };

  const formatDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return 'غير محدد';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'غير محدد';
      return date.toLocaleDateString('ar-EG');
    } catch {
      return 'غير محدد';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'مجدول';
      case 'pending':
        return 'في الانتظار';
      case 'cancelled':
        return 'ملغي';
      case 'completed':
        return 'مكتمل';
      default:
        return status || 'غير محدد';
    }
  };

  const calculateAge = (birthDate: string | Date): string => {
    if (!birthDate) return '';
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

      return age >= 0 ? `${age} سنة` : '';
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" text="جاري تحميل بيانات المريض..." />
      </div>
    );
  }

  if (error) {
    return <ErrorFallback error={new Error(error)} onRetry={fetchPatientData} />;
  }

  if (!patient) {
    return (
      <div className="text-center py-8">
        <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-2xl font-bold mb-4">المريض غير موجود</h2>
        <p className="text-gray-600 mb-4">لم يتم العثور على المريض المطلوب</p>
        <ButtonLink href="/patients" variant="outline">
          العودة لقائمة المرضى
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">تفاصيل المريض</h2>
          <p className="">معلومات المريض الكاملة وتاريخ المواعيد</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/patients/${patientId}/edit`} variant="primary">
            تعديل
          </ButtonLink>

          <Can do="delete" on="Patient">
          <ButtonLink
            href="#"
            variant="danger"
            onClick={handleDelete}
          >
            {isDeleting ? 'جاري الحذف...' : 'حذف المريض'}
          </ButtonLink>
          </Can>

          <ButtonLink  href="/patients" variant="outline">
            رجوع
          </ButtonLink>
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="card rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-16 h-16 text-gray-400" />
              </div>
            </div>
            <div className="flex-grow">
              <h3 className="card-title text-2xl font-bold mb-2">{patient.NAME}</h3>
              <p className="text-blue-600 font-medium text-lg mb-4">
                معرف المريض: {patient.PATIENT_ID}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  {patient.EMAIL && (
                    <p className="text-gray-600 flex items-center mb-2">
                      <Mail className="w-4 h-4 ml-2" />
                      <span className="font-medium">البريد الإلكتروني:</span>
                      <a href={`mailto:${patient.EMAIL}`} className="text-blue-600 hover:underline mr-1">
                        {patient.EMAIL}
                      </a>
                    </p>
                  )}
                  {patient.PHONE && (
                    <p className="text-gray-600 flex items-center mb-2">
                      <Phone className="w-4 h-4 ml-2" />
                      <span className="font-medium">الهاتف:</span>
                      <a href={`tel:${patient.PHONE}`} className="text-blue-600 hover:underline mr-1">
                        {patient.PHONE}
                      </a>
                    </p>
                  )}
                  {patient.DATEOFBIRTH && (
                    <p className="text-gray-600 flex items-center mb-2">
                      <Calendar className="w-4 h-4 ml-2" />
                      <span className="font-medium">تاريخ الميلاد:</span>
                      {formatDate(patient.DATEOFBIRTH)}
                      {calculateAge(patient.DATEOFBIRTH) && (
                        <span className="text-sm text-gray-500 mr-2">
                          ({calculateAge(patient.DATEOFBIRTH)})
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div>
                  {patient.GENDER && (
                    <p className="text-gray-600 mb-2">
                      <span className="font-medium">الجنس:</span> {patient.GENDER === 'Male' ? 'ذكر' : patient.GENDER === 'Female' ? 'أنثى' : patient.GENDER}
                    </p>
                  )}
                  {patient.OCCUPATION && (
                    <p className="text-gray-600 mb-2">
                      <span className="font-medium">المهنة:</span> {patient.OCCUPATION}
                    </p>
                  )}
                  {patient.PRIMARYPHYSICIANNAME && (
                    <p className="text-gray-600 mb-2">
                      <span className="font-medium">الطبيب المعالج:</span> {patient.PRIMARYPHYSICIANNAME}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4" role="tablist">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'details'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent card-text'
            }`}
            role="tab"
            aria-selected={activeTab === 'details'}
          >
            التفاصيل
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'appointments'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent card-text'
            }`}
            role="tab"
            aria-selected={activeTab === 'appointments'}
          >
            المواعيد ({appointments.length})
          </button>
        </nav>
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="card rounded-lg shadow-md p-6">
          <h3 className="card-title text-xl font-bold mb-4">معلومات مفصلة</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="card-title text-lg font-medium mb-3">معلومات الاتصال</h4>
              <div className="space-y-2">
                {patient.EMAIL && (
                  <p className="text-gray-600 flex items-center">
                    <Mail className="w-4 h-4 ml-2" />
                    <span className="font-medium">البريد الإلكتروني:</span>
                    <a href={`mailto:${patient.EMAIL}`} className="text-blue-600 hover:underline mr-1">
                      {patient.EMAIL}
                    </a>
                  </p>
                )}
                {patient.PHONE && (
                  <p className="text-gray-600 flex items-center">
                    <Phone className="w-4 h-4 ml-2" />
                    <span className="font-medium">الهاتف:</span>
                    <a href={`tel:${patient.PHONE}`} className="text-blue-600 hover:underline mr-1">
                      {patient.PHONE}
                    </a>
                  </p>
                )}
                {patient.EMERGENCYCONTACTNAME && (
                  <p className="text-gray-600">
                    <span className="font-medium">جهة اتصال الطوارئ:</span> {patient.EMERGENCYCONTACTNAME}
                    {patient.EMERGENCYCONTACTNUMBER && (
                      <span className="block text-sm">
                        <a href={`tel:${patient.EMERGENCYCONTACTNUMBER}`} className="text-blue-600 hover:underline">
                          {patient.EMERGENCYCONTACTNUMBER}
                        </a>
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h4 className="card-title text-lg font-medium mb-3">المعلومات الشخصية</h4>
              <div className="space-y-2">
                {patient.DATEOFBIRTH && (
                  <p className="text-gray-600 flex items-center">
                    <Calendar className="w-4 h-4 ml-2" />
                    <span className="font-medium">تاريخ الميلاد:</span>
                    {formatDate(patient.DATEOFBIRTH)}
                    {calculateAge(patient.DATEOFBIRTH) && (
                      <span className="text-sm text-gray-500 mr-2">
                        ({calculateAge(patient.DATEOFBIRTH)})
                      </span>
                    )}
                  </p>
                )}
                {patient.GENDER && (
                  <p className="text-gray-600">
                    <span className="font-medium">الجنس:</span> {patient.GENDER === 'Male' ? 'ذكر' : patient.GENDER === 'Female' ? 'أنثى' : patient.GENDER}
                  </p>
                )}
                {patient.OCCUPATION && (
                  <p className="text-gray-600">
                    <span className="font-medium">المهنة:</span> {patient.OCCUPATION}
                  </p>
                )}
                {patient.IDENTIFICATIONTYPE && patient.IDENTIFICATIONNUMBER && (
                  <p className="text-gray-600">
                    <span className="font-medium">{patient.IDENTIFICATIONTYPE}:</span> {patient.IDENTIFICATIONNUMBER}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Insurance Information */}
          {(patient.INSURANCEPROVIDER || patient.INSURANCEPOLICYNUMBER) && (
            <div className="mt-6">
              <h4 className="card-title text-lg font-medium mb-2">معلومات التأمين</h4>
              <div className="bg-blue-50 p-3 rounded">
                {patient.INSURANCEPROVIDER && (
                  <p className="text-gray-700 mb-1">
                    <span className="font-medium">شركة التأمين:</span> {patient.INSURANCEPROVIDER}
                  </p>
                )}
                {patient.INSURANCEPOLICYNUMBER && (
                  <p className="text-gray-700">
                    <span className="font-medium">رقم البوليصة:</span> {patient.INSURANCEPOLICYNUMBER}
                  </p>
                )}
              </div>
            </div>
          )}

          {patient.ADDRESS && (
            <div className="mt-6">
              <h4 className="card-title text-lg font-medium mb-2">العنوان</h4>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">{patient.ADDRESS}</p>
            </div>
          )}

          {/* Medical Information */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {patient.PASTMEDICALHISTORY && (
              <div>
                <h4 className="card-title text-lg font-medium mb-2">التاريخ الطبي</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">{patient.PASTMEDICALHISTORY}</p>
              </div>
            )}

            {patient.FAMILYMEDICALHISTORY && (
              <div>
                <h4 className="card-title text-lg font-medium mb-2">التاريخ الطبي العائلي</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">{patient.FAMILYMEDICALHISTORY}</p>
              </div>
            )}
          </div>

          {patient.ALLERGIES && (
            <div className="mt-6">
              <h4 className="text-lg font-medium mb-2 text-red-600">الحساسيات</h4>
              <p className="text-gray-700 bg-red-50 p-3 rounded border-l-4 border-red-400 whitespace-pre-wrap">{patient.ALLERGIES}</p>
            </div>
          )}

          {patient.CURRENTMEDICATION && (
            <div className="mt-6">
              <h4 className="text-lg font-medium mb-2 text-blue-600">الأدوية الحالية</h4>
              <p className="text-gray-700 bg-blue-50 p-3 rounded border-l-4 border-blue-400 whitespace-pre-wrap">{patient.CURRENTMEDICATION}</p>
            </div>
          )}
        </div>
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="card rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="card-title text-xl font-bold">
                مواعيد المريض
                <span className="text-sm text-gray-500 mr-2">({appointments.length} مواعيد)</span>
              </h3>
              <ButtonLink href={`/appointments/new?patientId=${patientId}`} variant="primary">
                حجز موعد جديد
              </ButtonLink>
            </div>

            {appointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الطبيب
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
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appointments.map((appointment) => (
                      <tr key={appointment.APPOINTMENT_ID} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.DOCTOR_NAME || `طبيب رقم: ${appointment.DOCTOR_ID}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDateTime(appointment.SCHEDULE)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                          <div className="truncate" title={appointment.REASON}>
                            {appointment.REASON || 'غير محدد'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.STATUS)}`}>
                            {getStatusText(appointment.STATUS)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            {/* View Details Link */}
                            <a
                              href={`/appointments/${appointment.APPOINTMENT_ID}`}
                              className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded"
                              title="عرض التفاصيل"
                            >
                              <FileText className="w-4 h-4" />
                            </a>

                            {/* Edit Appointment Button */}
                            <a
                              href={`/appointments/${appointment.APPOINTMENT_ID}/edit`}
                              className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded"
                              title="تعديل الموعد"
                            >
                              <Edit className="w-4 h-4" />
                            </a>

                            {/* Delete Appointment Button */}
                            <button
                              onClick={() => handleDeleteAppointment(appointment.APPOINTMENT_ID)}
                              disabled={deletingAppointment === appointment.APPOINTMENT_ID}
                              className="text-red-600 hover:text-red-900 transition-colors p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              title="حذف الموعد"
                            >
                              {deletingAppointment === appointment.APPOINTMENT_ID ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>

                            {/* Cancel Appointment Button (Legacy) */}
                            {appointment.STATUS === 'scheduled' && (
                              <button
                                onClick={() => handleCancelAppointment(appointment.APPOINTMENT_ID)}
                                disabled={cancellingAppointment === appointment.APPOINTMENT_ID}
                                className={`
                                  text-xs px-3 py-1 rounded-full border transition-colors
                                  ${cancellingAppointment === appointment.APPOINTMENT_ID
                                    ? 'bg-orange-100 text-orange-400 border-orange-200 cursor-not-allowed opacity-70'
                                    : 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100'}
                                `}
                                title="إلغاء الموعد"
                              >
                                {cancellingAppointment === appointment.APPOINTMENT_ID ? (
                                  <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  'إلغاء'
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Calendar className="w-16 h-16 mx-auto" />
                </div>
                <p className="text-gray-500 text-lg mb-4">لا توجد مواعيد لهذا المريض</p>
                <p className="text-sm mb-4 text-gray-400">يمكنك حجز أول موعد للمريض</p>
                <ButtonLink href={`/appointments/new?patientId=${patientId}`} variant="primary">
                  حجز أول موعد
                </ButtonLink>
              </div>
            )}
          </div>
        </div>
      )}

      
    </div>
  );
}