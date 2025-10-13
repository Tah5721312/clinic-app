'use client';

import { Calendar, Clock, FileText, Plus, User, Stethoscope, Search } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { Appointment } from '@/lib/types';
import { useAppointmentsWithFilters, useDoctors, useSpecialties } from '@/hooks/useApiData';

import ErrorBoundary, { ErrorFallback } from '@/components/ErrorBoundary';
import ButtonLink from '@/components/links/ButtonLink';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AppointmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const initialSpecialty = searchParams.get('specialty') || '';
  const initialDoctorId = searchParams.get('doctorId') || '';
  const initialIdentificationNumber = searchParams.get('identificationNumber') || '';

  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId);
  const [identificationNumber, setIdentificationNumber] = useState(initialIdentificationNumber);
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
  });
  const { data: doctors } = useDoctors(selectedSpecialty || undefined);
  const { data: specialties } = useSpecialties();

  useEffect(() => {
    const s = searchParams.get('specialty') || '';
    const d = searchParams.get('doctorId') || '';
    const i = searchParams.get('identificationNumber') || '';
    setSelectedSpecialty(s);
    setSelectedDoctorId(d);
    setIdentificationNumber(i);
  }, [searchParams]);

  const filteredAppointments =
    appointments?.filter((appointment: Appointment) => {
      if (filter === 'all') return true;
      return appointment.STATUS === filter;
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

      // تنسيق التاريخ
      return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      // console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
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

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <LoadingSpinner size='lg' text='Loading appointments...' />
      </div>
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
            <h1 className='text-3xl font-bold text-gray-900'>المواعيد</h1>
            <p className='text-gray-600 mt-1'>
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
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto'>
            <div className='flex items-center gap-2'>
       
            {!isDoctor && !isPatient && (
           
               <div className='relative w-full sm:w-56'>
                <span className='pointer-events-none absolute inset-y-0 right-6 pr-3 flex items-center text-gray-400'>
                  <Stethoscope className='w-4 h-4' />
                </span>
                <select
                  id='specialtyFilter'
                  value={selectedSpecialty}
                  onChange={(e) => {
                    setSelectedSpecialty(e.target.value);
                    setSelectedDoctorId('');
                  }}
                  className='w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value=''>اختر التخصص</option>
                  {(specialties && specialties.length > 0 ? specialties : []).map((spec, index) => (
                    <option key={spec || `specialty-${index}`} value={spec}>{spec}</option>
                  ))}
                </select>
              </div> 
            )}

         {!isDoctor && !isPatient && (
                <div className='relative w-full sm:w-56'>
                  <span className='pointer-events-none absolute inset-y-0 right-6 pr-3 flex items-center text-gray-400'>
                    <User className='w-4 h-4' />
                  </span>
                  <select
                    id='doctorFilter'
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className='w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
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
                <div className='relative w-full sm:w-64'>
                  <span className='pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400'>
                    <Search className='w-4 h-4' />
                  </span>

                  <input
                    type='text'
                    placeholder='الرقم القومى'
                    value={identificationNumber}
                    onChange={(e) => setIdentificationNumber(e.target.value)}
                    className='w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
              )}
              {!isPatient && (
                <button
                  onClick={() => {
                    const sp = new URLSearchParams(Array.from(searchParams.entries()));
                    if (selectedSpecialty) sp.set('specialty', selectedSpecialty); else sp.delete('specialty');
                    // Don't set doctorId for doctors since they can only see their own appointments
                    if (!isDoctor && selectedDoctorId) sp.set('doctorId', selectedDoctorId); else sp.delete('doctorId');
                    if (identificationNumber && identificationNumber.trim()) sp.set('identificationNumber', identificationNumber.trim()); else sp.delete('identificationNumber');
                    const query = sp.toString();
                    router.push(query ? `?${query}` : '?', { scroll: false });
                  }}
                  className='inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                  title='بحث'
                >
                  <Search className='w-4 h-4 ml-1' />
                  <span>بحث</span>
                </button>
              )}
              {!isPatient && (selectedSpecialty || (!isDoctor && selectedDoctorId) || identificationNumber) && (
                <button
                  onClick={() => {
                    setSelectedSpecialty('');
                    setSelectedDoctorId('');
                    setIdentificationNumber('');
                    const sp = new URLSearchParams(Array.from(searchParams.entries()));
                    sp.delete('specialty');
                    sp.delete('doctorId');
                    sp.delete('identificationNumber');
                    const query = sp.toString();
                    router.push(query ? `?${query}` : '?', { scroll: false });
                  }}
                  className='inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
                  title='مسح'
                >
                  ALL
                </button>
              )}
            </div>
            <ButtonLink
              href='/appointments/new'
              variant='primary'
              leftIcon={Plus}
            >
              {isPatient ? 'حجز موعد جديد' : 'Book New Appointment'}
            </ButtonLink>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className='flex flex-wrap gap-2'>
          {(['all', 'scheduled', 'pending', 'cancelled'] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            )
          )}
        </div>

        {/* Appointments List */}
        {filteredAppointments.length > 0 ? (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {filteredAppointments.map(
              (appointment: Appointment, index: number) => (
                <div
                  key={appointment.APPOINTMENT_ID || `appointment-${index}`}
                  className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'
                >
                  <div className='flex justify-between items-start mb-4'>
                    <div className='flex items-center space-x-2'>
                      <Calendar className='w-5 h-5 text-blue-600' />
                      <span className='font-semibold text-gray-900'>
                        Appointment #{appointment.APPOINTMENT_ID}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        appointment.STATUS
                      )}`}
                    >
                      {appointment.STATUS}
                    </span>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex items-center text-sm text-gray-600'>
                      <Clock className='w-4 h-4 mr-2 text-gray-400' />
                      <span>{formatDateTime(appointment.SCHEDULE)}</span>
                    </div>

                    <div className='flex items-center text-sm text-gray-600'>
                      <User className='w-4 h-4 mr-2 text-gray-400' />
                      <span>
                        <strong>Patient:</strong>{' '}
                        {appointment.PATIENT_NAME ||
                          `ID: ${appointment.PATIENT_ID}`}
                      </span>
                    </div>

                    <div className='flex items-center text-sm text-gray-600'>
                      <User className='w-4 h-4 mr-2 text-gray-400' />
                      <span>
                        <strong>Doctor:</strong>{' '}
                        {appointment.DOCTOR_NAME ||
                          `ID: ${appointment.DOCTOR_ID}`}
                      </span>
                    </div>

                    {appointment.REASON && (
                      <div className='flex items-start text-sm text-gray-600'>
                        <FileText className='w-4 h-4 mr-2 text-gray-400 mt-0.5' />
                        <div>
                          <strong>Reason:</strong> {appointment.REASON}
                        </div>
                      </div>
                    )}

                    {appointment.NOTE && (
                      <div className='flex items-start text-sm text-gray-600'>
                        <FileText className='w-4 h-4 mr-2 text-gray-400 mt-0.5' />
                        <div>
                          <strong>Note:</strong> {appointment.NOTE}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className='flex justify-between items-center mt-4 pt-4 border-t'>
                    <div className='flex gap-2'>
                      <Link
                        href={`/appointments/${appointment.APPOINTMENT_ID}`}
                        className='text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors'
                      >
                        View Details
                      </Link>
                      {appointment.DOCTOR_ID && (
                        <Link
                          href={`/doctors/${appointment.DOCTOR_ID}`}
                          className='text-green-600 hover:text-green-800 font-medium text-sm transition-colors'
                        >
                          View Doctor
                        </Link>
                      )}
                      {appointment.PATIENT_ID && (
                        <Link
                          href={`/patients/${appointment.PATIENT_ID}`}
                          className='text-purple-600 hover:text-purple-800 font-medium text-sm transition-colors'
                        >
                          View Patient
                        </Link>
                      )}
                    </div>
                    <Link
                      href={`/appointments/new?doctorId=${appointment.DOCTOR_ID}&patientId=${appointment.PATIENT_ID}`}
                      className='bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors'
                    >
                      Book Similar
                    </Link>
                  </div>
                </div>
              )
            )}
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
