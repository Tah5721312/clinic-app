'use client';

import { Calendar, Clock, FileText, Plus, User, Stethoscope, Search, CreditCard, DollarSign, Receipt, CheckCircle, XCircle, Trash2, Grid3x3, Download, FileDown } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toastError } from '@/lib/toast';

import { Appointment } from '@/lib/types';
import { useAppointmentsWithFilters, useDoctors, useSpecialties } from '@/hooks/useApiData';
import { DOMAIN } from '@/lib/constants';
import { exportAppointmentsToPDF, exportAppointmentsToExcel } from '@/lib/exportUtils';

import ErrorBoundary, { ErrorFallback } from '@/components/ErrorBoundary';
import ButtonLink from '@/components/links/ButtonLink';
import LoadingSpinner from '@/components/LoadingSpinner';
import { TableSkeleton } from '@/components/LoadingSkeleton';

export default function AppointmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const initialSpecialty = searchParams.get('specialty') || '';
  const initialDoctorId = searchParams.get('doctorId') || '';
  const initialIdentificationNumber = searchParams.get('identificationNumber') || '';
  const initialInvoiceNumber = searchParams.get('invoiceNumber') || '';
  const initialScheduleDate = searchParams.get('scheduleDate') || '';

  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId);
  const [identificationNumber, setIdentificationNumber] = useState(initialIdentificationNumber);
  const [invoiceNumber, setInvoiceNumber] = useState(initialInvoiceNumber);
  const [scheduleDate, setScheduleDate] = useState(initialScheduleDate);
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'scheduled' | 'cancelled'
  >('all');

  // Check if current user is a doctor or patient
  const isDoctor = (session?.user as any)?.roleId === 213;
  const isPatient = (session?.user as any)?.roleId === 216;

  const { data: appointments, loading, error, refetch } = useAppointmentsWithFilters({
    doctorId: initialDoctorId || undefined,
    specialty: initialSpecialty || undefined,
    identificationNumber: initialIdentificationNumber || undefined,
    invoiceNumber: initialInvoiceNumber || undefined,
    scheduleDate: initialScheduleDate || undefined,
  });
  const { data: doctors } = useDoctors(selectedSpecialty || undefined);
  const { data: specialties } = useSpecialties();

  useEffect(() => {
    const s = searchParams.get('specialty') || '';
    const d = searchParams.get('doctorId') || '';
    const i = searchParams.get('identificationNumber') || '';
    const inv = searchParams.get('invoiceNumber') || '';
    const sd = searchParams.get('scheduleDate') || '';
    setSelectedSpecialty(s);
    setSelectedDoctorId(d);
    setIdentificationNumber(i);
    setInvoiceNumber(inv);
    setScheduleDate(sd);
  }, [searchParams]);

  // Helper function to get display status
  const getDisplayStatus = (appointment: Appointment) => {
    // If payment is paid, status should be scheduled
    if (appointment.PAYMENT_STATUS === 'paid') {
      return 'scheduled';
    }
    return appointment.STATUS;
  };

  const filteredAppointments =
    appointments?.filter((appointment: Appointment) => {
      if (filter === 'all') return true;
      return getDisplayStatus(appointment) === filter;
    }) || [];

  const formatDateTime = (date: Date | string | null | undefined) => {
    // التحقق من وجود التاريخ
    if (!date) {
      return 'Invalid Date';
    }

    try {
      // تحويل التاريخ إلى كائن Date
      let dateObj: Date;

      if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        return 'Invalid Date';
      }

      // التحقق من صحة التاريخ
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }

      // تنسيق التاريخ بصيغة yyyy/mm/dd
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    } catch (error) {
      // console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const handleDeleteAppointment = async (appointmentId: number) => {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      const response = await fetch(`${DOMAIN}/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete appointment');
      }

      // Refetch appointments after deletion
      refetch();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to delete appointment');
    }
  };

  // Check if current user is super admin
  const isSuperAdmin = session?.user?.isAdmin || (session?.user as any)?.roleId === 211;

  // Check if appointment can be deleted
  const canDeleteAppointment = (appointment: Appointment) => {
    // Super Admin can delete all appointments
    if (isSuperAdmin) {
      return true;
    }
    
    // Regular users can only delete if: Status is cancelled OR (Status is pending AND Payment is unpaid)
    return (
      appointment.STATUS === 'cancelled' ||
      (appointment.STATUS === 'pending' && (appointment.PAYMENT_STATUS || 'unpaid') === 'unpaid')
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-blue-100 text-blue-800';
      case 'follow_up':
        return 'bg-purple-100 text-purple-800';
      case 'emergency':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !appointments) {
    return (
      <ErrorBoundary>
        <div className='space-y-6'>
          <div>
            <h1 className='text-3xl font-bold '>المواعيد</h1>
            <p className=' mt-1'>جاري تحميل المواعيد...</p>
          </div>
          <TableSkeleton rows={8} />
        </div>
      </ErrorBoundary>
    );
  }

  if (error) {
    return <ErrorFallback error={new Error(error)} reset={refetch} />;
  }

  return (
    <ErrorBoundary>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
          <div>
            <h1 className='text-3xl font-bold '>المواعيد</h1>
            <p className=' mt-1'>
              {isPatient 
                ? 'مواعيدي - عرض مواعيدي الطبية' 
                : isDoctor 
                  ? 'مواعيدي - عرض وإدارة مواعيدي' 
                  : 'إدارة وعرض جميع المواعيد'
              }
            </p>
            {isPatient && (
              <p className='text-sm text-blue-600 mt-1'>
                أنت تشاهد مواعيدك الشخصية فقط
              </p>
            )}
            {isDoctor && (
              <p className='text-sm text-blue-600 mt-1'>
                أنت تشاهد مواعيدك فقط
              </p>
            )}
          </div>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-col lg:flex-row items-stretch lg:items-center gap-2 w-full'>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 w-full lg:w-auto'>
                {!isDoctor && !isPatient && (
                  <div className='relative w-full sm:w-auto lg:w-56'>
                    <span className='pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400'>
                      <Stethoscope className='w-4 h-4' />
                    </span>
                    <select
                      id='specialtyFilter'
                      value={selectedSpecialty}
                      onChange={(e) => {
                        setSelectedSpecialty(e.target.value);
                        setSelectedDoctorId('');
                      }}
                      className='w-full pl-3 pr-10 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    >
                      <option value=''>اختر التخصص</option>
                      {(specialties && specialties.length > 0 ? specialties : []).map((spec, index) => (
                        <option key={spec || `specialty-${index}`} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>
                )}

                {!isDoctor && !isPatient && (
                  <div className='relative w-full sm:w-auto lg:w-56'>
                    <span className='pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400'>
                      <User className='w-4 h-4' />
                    </span>
                    <select
                      id='doctorFilter'
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className='w-full pl-3 pr-10 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      disabled={!selectedSpecialty}
                    >
                      <option value=''>اختر الطبيب</option>
                      {(doctors || []).map((d) => (
                        <option key={d.DOCTOR_ID} value={d.DOCTOR_ID}>
                          {d.NAME}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!isPatient && (
                  <div className='relative w-full sm:w-auto lg:w-56'>
                    <span className='pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400'>
                      <Search className='w-4 h-4' />
                    </span>
                    <input
                      type='text'
                      placeholder='الرقم القومى'
                      value={identificationNumber}
                      onChange={(e) => setIdentificationNumber(e.target.value)}
                      className='w-full pl-3 pr-10 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                )}

                {!isPatient && (
                  <div className='relative w-full sm:w-auto lg:w-56'>
                    <span className='pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400'>
                      <Receipt className='w-4 h-4' />
                    </span>
                    <input
                      type='text'
                      placeholder='رقم الفاتورة'
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className='w-full pl-3 pr-10 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                )}

                {!isPatient && (
                  <div className='relative w-full sm:w-auto lg:w-48'>
                    <span className='pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400'>
                      <Calendar className='w-4 h-4' />
                    </span>
                    <input
                      type='date'
                      placeholder='تاريخ الموعد'
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className='w-full pl-3 pr-10 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                )}

                <div className='flex gap-2 w-full sm:w-auto'>
                  {!isPatient && (
                    <button
                      onClick={() => {
                        const sp = new URLSearchParams(Array.from(searchParams.entries()));
                        if (selectedSpecialty) sp.set('specialty', selectedSpecialty); else sp.delete('specialty');
                        if (!isDoctor && selectedDoctorId) sp.set('doctorId', selectedDoctorId); else sp.delete('doctorId');
                        if (identificationNumber && identificationNumber.trim()) sp.set('identificationNumber', identificationNumber.trim()); else sp.delete('identificationNumber');
                        if (invoiceNumber && invoiceNumber.trim()) sp.set('invoiceNumber', invoiceNumber.trim()); else sp.delete('invoiceNumber');
                        if (scheduleDate && scheduleDate.trim()) sp.set('scheduleDate', scheduleDate.trim()); else sp.delete('scheduleDate');
                        const query = sp.toString();
                        router.push(query ? `?${query}` : '?', { scroll: false });
                      }}
                      className='inline-flex items-center justify-center px-3 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1 sm:flex-none'
                      title='بحث'
                    >
                      <Search className='w-4 h-4 ml-1' />
                      <span>بحث</span>
                    </button>
                  )}
                  {!isPatient && (selectedSpecialty || (!isDoctor && selectedDoctorId) || identificationNumber || invoiceNumber || scheduleDate) && (
                    <button
                      onClick={() => {
                        setSelectedSpecialty('');
                        setSelectedDoctorId('');
                        setIdentificationNumber('');
                        setInvoiceNumber('');
                        setScheduleDate('');
                        const sp = new URLSearchParams(Array.from(searchParams.entries()));
                        sp.delete('specialty');
                        sp.delete('doctorId');
                        sp.delete('identificationNumber');
                        sp.delete('invoiceNumber');
                        sp.delete('scheduleDate');
                        const query = sp.toString();
                        router.push(query ? `?${query}` : '?', { scroll: false });
                      }}
                      className='inline-flex items-center justify-center px-3 py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-none'
                      title='مسح'
                    >
                      ALL
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className='flex flex-wrap gap-2 w-full sm:w-auto'>
              <ButtonLink
                href={`/appointments/calendar${selectedDoctorId ? `?doctorId=${selectedDoctorId}` : ''}${selectedSpecialty ? `${selectedDoctorId ? '&' : '?'}specialty=${selectedSpecialty}` : ''}`}
                variant='outline'
                leftIcon={Grid3x3}
                className='w-full sm:w-auto'
              >
                التقويم
              </ButtonLink>
              {!isPatient && filteredAppointments.length > 0 && (
                <>
                  <button
                    onClick={async () => {
                      const filename = `appointments_${new Date().toISOString().split('T')[0]}.pdf`;
                      await exportAppointmentsToPDF(filteredAppointments, filename);
                    }}
                    className='inline-flex items-center justify-center px-3 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors w-full sm:w-auto gap-2'
                    title='تصدير PDF'
                  >
                    <FileDown className='w-4 h-4' />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      const filename = `appointments_${new Date().toISOString().split('T')[0]}.xlsx`;
                      exportAppointmentsToExcel(filteredAppointments, filename);
                    }}
                    className='inline-flex items-center justify-center px-3 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto gap-2'
                    title='تصدير Excel'
                  >
                    <Download className='w-4 h-4' />
                    <span>Excel</span>
                  </button>
                </>
              )}
              <ButtonLink
                href='/appointments/new'
                variant='primary'
                leftIcon={Plus}
                className='w-full sm:w-auto'
              >
                {isPatient ? 'حجز موعد جديد' : 'Book New Appointment'}
              </ButtonLink>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className='flex flex-wrap justify-center gap-2'>
          {(['all', 'scheduled', 'pending', 'cancelled'] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            )
          )}
        </div>

        {/* Appointments Table */}
        {filteredAppointments.length > 0 ? (
          <div className='card rounded-lg shadow overflow-hidden'>
            {/* Desktop Table */}
            <div className=' hidden lg:block overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='card'>
                  <tr>
                    <th className='px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Appointment
                    </th>
                    <th className='px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Date
                    </th>
                    <th className='px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Patient
                    </th>
                    <th className='px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Doctor
                    </th>
                   
                    <th className='px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Status
                    </th>
                    <th className='px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Payment
                    </th>
                    <th className='px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Method
                    </th>
                    <th className='px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Invoice
                    </th>
                    <th className='px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {filteredAppointments.map((appointment: Appointment, index: number) => (
                    <tr key={`appointment-${appointment.APPOINTMENT_ID}-${appointment.PATIENT_ID}-${appointment.DOCTOR_ID}-${index}`} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <Calendar className='w-4 h-4 text-blue-600 mr-2' />
                          <div>
                            <div className='text-sm font-medium text-gray-900'>
                              #{appointment.APPOINTMENT_ID}
                            </div>
                            <div className='text-sm text-gray-500'>
                              {appointment.APPOINTMENT_TYPE || 'consultation'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {formatDateTime(appointment.SCHEDULE)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900'>
                          {appointment.PATIENT_NAME || `ID: ${appointment.PATIENT_ID}`}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900'>
                          {appointment.DOCTOR_NAME || `ID: ${appointment.DOCTOR_ID}`}
                        </div>
                      </td>
                      {/* <td className='px-6 py-4'>
                        <div className='text-sm text-gray-900 max-w-xs truncate' title={appointment.REASON}>
                          {appointment.REASON}
                        </div>
                        {appointment.NOTE && (
                          <div className='text-xs text-gray-500 max-w-xs truncate' title={appointment.NOTE}>
                            Note: {appointment.NOTE}
                          </div>
                        )}
                      </td> */}
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getDisplayStatus(appointment))}`}>
                          {getDisplayStatus(appointment)}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex flex-col gap-1'>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(appointment.PAYMENT_STATUS || 'unpaid')}`}>
                            {appointment.PAYMENT_STATUS || 'unpaid'}
                          </span>
                          {appointment.PAYMENT_AMOUNT && appointment.PAYMENT_AMOUNT > 0 && (
                            <span className='text-xs text-gray-600'>
                              {appointment.PAYMENT_AMOUNT} EGP
                            </span>
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900'>
                          {appointment.PAYMENT_METHOD || '-'}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center justify-center'>
                          {appointment.HAS_INVOICE ? (
                            <div className='flex flex-col items-center gap-1'>
                              <div className='flex items-center gap-1'>
                                <CheckCircle className='w-4 h-4 text-green-600' />
                                <span className='text-xs text-green-600 font-medium'>Yes</span>
                              </div>
                              {appointment.INVOICE_NUMBER && (
                                <Link
                                  href={`/invoices/${appointment.INVOICE_ID}`}
                                  className='text-xs text-blue-600 hover:text-blue-800 underline'
                                >
                                 <p> #{appointment.INVOICE_NUMBER}</p>
                                </Link>
                              )}
                            </div>
                          ) : (
                            <div className='flex items-center gap-1'>
                              <XCircle className='w-4 h-4 text-gray-400' />
                              <span className='text-xs text-gray-500'>No</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                        <div className='flex flex-col gap-1'>
                          <Link
                            href={`/appointments/${appointment.APPOINTMENT_ID}`}
                            className='text-blue-600 hover:text-blue-900'
                          >
                            View
                          </Link>
                          {!appointment.HAS_INVOICE && (
                            <Link
                              href={`/invoices/new?patientId=${appointment.PATIENT_ID}&appointmentId=${appointment.APPOINTMENT_ID}`}
                              className='text-purple-600 hover:text-purple-900'
                            >
                              Create Invoice
                            </Link>
                          )}
                          <Link
                            href={`/appointments/new?doctorId=${appointment.DOCTOR_ID}&patientId=${appointment.PATIENT_ID}`}
                            className='text-green-600 hover:text-green-900'
                          >
                            Book Similar
                          </Link>
                          {canDeleteAppointment(appointment) && (
                            <button
                              onClick={() => handleDeleteAppointment(appointment.APPOINTMENT_ID)}
                              className='text-red-600 hover:text-red-900 flex items-center gap-1'
                            >
                              <Trash2 className='w-4 h-4' />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className='lg:hidden'>
              {filteredAppointments.map((appointment: Appointment, index: number) => (
                <div key={`mobile-appointment-${appointment.APPOINTMENT_ID}-${appointment.PATIENT_ID}-${appointment.DOCTOR_ID}-${index}`} className='border border-gray-200 rounded-lg mb-3 p-3 sm:p-4 bg-white shadow-sm last:mb-0'>
                  <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3 pb-3 border-b border-gray-100'>
                    <div className='flex items-center gap-2'>
                      <Calendar className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0' />
                      <span className='font-semibold text-base sm:text-lg text-gray-900'>
                        #{appointment.APPOINTMENT_ID}
                      </span>
                    </div>
                    <div className='flex flex-wrap gap-1.5 sm:gap-2'>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(getDisplayStatus(appointment))}`}>
                        {getDisplayStatus(appointment)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getAppointmentTypeColor(appointment.APPOINTMENT_TYPE || 'consultation')}`}>
                        {appointment.APPOINTMENT_TYPE || 'consultation'}
                      </span>
                    </div>
                  </div>

                  <div className='space-y-2.5 sm:space-y-3 text-sm sm:text-base'>
                    <div className='flex items-start gap-2 text-gray-700'>
                      <Clock className='w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0' />
                      <span className='break-words'>{formatDateTime(appointment.SCHEDULE)}</span>
                    </div>

                    <div className='flex items-start gap-2 text-gray-700'>
                      <User className='w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0' />
                      <div className='flex-1 min-w-0'>
                        <span className='font-medium text-gray-900'>Patient: </span>
                        <span className='break-words'>{appointment.PATIENT_NAME || `ID: ${appointment.PATIENT_ID}`}</span>
                      </div>
                    </div>

                    <div className='flex items-start gap-2 text-gray-700'>
                      <User className='w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0' />
                      <div className='flex-1 min-w-0'>
                        <span className='font-medium text-gray-900'>Doctor: </span>
                        <span className='break-words'>{appointment.DOCTOR_NAME || `ID: ${appointment.DOCTOR_ID}`}</span>
                      </div>
                    </div>

                    {appointment.REASON && (
                      <div className='flex items-start gap-2 text-gray-700'>
                        <FileText className='w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0' />
                        <div className='flex-1 min-w-0'>
                          <span className='font-medium text-gray-900'>Reason: </span>
                          <span className='break-words'>{appointment.REASON}</span>
                        </div>
                      </div>
                    )}

                    {appointment.NOTE && (
                      <div className='flex items-start gap-2 text-gray-700'>
                        <FileText className='w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0' />
                        <div className='flex-1 min-w-0'>
                          <span className='font-medium text-gray-900'>Note: </span>
                          <span className='break-words'>{appointment.NOTE}</span>
                        </div>
                      </div>
                    )}

                    <div className='flex items-start gap-2 text-gray-700'>
                      <CreditCard className='w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0' />
                      <div className='flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2'>
                        <span className='font-medium text-gray-900'>Payment: </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getPaymentStatusColor(appointment.PAYMENT_STATUS || 'unpaid')}`}>
                          {appointment.PAYMENT_STATUS || 'unpaid'}
                        </span>
                        {appointment.PAYMENT_AMOUNT && appointment.PAYMENT_AMOUNT > 0 && (
                          <span className='text-gray-600 whitespace-nowrap'>{appointment.PAYMENT_AMOUNT} EGP</span>
                        )}
                      </div>
                    </div>

                    {appointment.PAYMENT_METHOD && (
                      <div className='flex items-start gap-2 text-gray-700'>
                        <CreditCard className='w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0' />
                        <div className='flex-1 min-w-0'>
                          <span className='font-medium text-gray-900'>Method: </span>
                          <span className='break-words'>{appointment.PAYMENT_METHOD}</span>
                        </div>
                      </div>
                    )}

                    <div className='flex items-start gap-2 text-gray-700'>
                      <Receipt className='w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0' />
                      <div className='flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2'>
                        <span className='font-medium text-gray-900'>Invoice: </span>
                        {appointment.HAS_INVOICE ? (
                          <span className='flex items-center gap-1 flex-wrap'>
                            <CheckCircle className='w-4 h-4 text-green-600 flex-shrink-0' />
                            <span className='text-green-600 font-medium'>Yes</span>
                            {appointment.INVOICE_NUMBER && (
                              <Link
                                href={`/invoices/${appointment.INVOICE_ID}`}
                                className='text-blue-600 hover:text-blue-800 underline break-all'
                              >
                                #{appointment.INVOICE_NUMBER}
                              </Link>
                            )}
                          </span>
                        ) : (
                          <span className='flex items-center gap-1'>
                            <XCircle className='w-4 h-4 text-gray-400 flex-shrink-0' />
                            <span className='text-gray-500'>No</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-4 pt-3 border-t border-gray-200'>
                    <div className='flex flex-wrap gap-2 text-xs sm:text-sm'>
                      <Link
                        href={`/appointments/${appointment.APPOINTMENT_ID}`}
                        className='px-2 py-1.5 text-blue-600 hover:text-blue-800 font-medium rounded hover:bg-blue-50 transition-colors'
                      >
                        View
                      </Link>
                      {!appointment.HAS_INVOICE && (
                        <Link
                          href={`/invoices/new?patientId=${appointment.PATIENT_ID}&appointmentId=${appointment.APPOINTMENT_ID}`}
                          className='px-2 py-1.5 text-purple-600 hover:text-purple-800 font-medium rounded hover:bg-purple-50 transition-colors'
                        >
                          Invoice
                        </Link>
                      )}
                      {appointment.DOCTOR_ID && (
                        <Link
                          href={`/doctors/${appointment.DOCTOR_ID}`}
                          className='px-2 py-1.5 text-green-600 hover:text-green-800 font-medium rounded hover:bg-green-50 transition-colors'
                        >
                          Doctor
                        </Link>
                      )}
                      {appointment.PATIENT_ID && (
                        <Link
                          href={`/patients/${appointment.PATIENT_ID}`}
                          className='px-2 py-1.5 text-purple-600 hover:text-purple-800 font-medium rounded hover:bg-purple-50 transition-colors'
                        >
                          Patient
                        </Link>
                      )}
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {canDeleteAppointment(appointment) && (
                        <button
                          onClick={() => handleDeleteAppointment(appointment.APPOINTMENT_ID)}
                          className='bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs sm:text-sm transition-colors flex items-center gap-1.5 flex-1 sm:flex-none justify-center'
                        >
                          <Trash2 className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                          <span>Delete</span>
                        </button>
                      )}
                      <Link
                        href={`/appointments/new?doctorId=${appointment.DOCTOR_ID}&patientId=${appointment.PATIENT_ID}`}
                        className='bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs sm:text-sm transition-colors flex-1 sm:flex-none text-center'
                      >
                        Book Similar
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className='text-center py-12'>
            <div className='bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center'>
              <Calendar className='w-8 h-8 text-gray-400' />
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              {isPatient 
                ? `لا توجد مواعيد ${filter === 'all' ? '' : filter}`
                : `No ${filter === 'all' ? '' : filter} appointments found`
              }
            </h3>
            <p className='text-gray-600 mb-6'>
              {isPatient 
                ? (filter === 'all'
                  ? 'ابدأ بحجز أول موعد طبي لك.'
                  : `لا توجد مواعيد بحالة "${filter}".`)
                : (filter === 'all'
                  ? 'Get started by booking your first appointment.'
                  : `No appointments with status "${filter}" found.`)
              }
            </p>
            <ButtonLink
              href='/appointments/new'
              variant='primary'
              leftIcon={Plus}
            >
              {isPatient ? 'حجز موعد جديد' : 'Book New Appointment'}
            </ButtonLink>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
