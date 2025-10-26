'use client';

import { Plus, Stethoscope, Search, User } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { Patient } from '@/lib/types';
import { useDoctors, usePatients, useSpecialties } from '@/hooks/useApiData';

import ErrorBoundary, { ErrorFallback } from '@/components/ErrorBoundary';
import ButtonLink from '@/components/links/ButtonLink';
import LoadingSpinner from '@/components/LoadingSpinner';
import PatientCard from '@/components/PatientCard';

export default function PatientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const initialSpecialty = searchParams.get('specialty') || '';
  const initialDoctorId = searchParams.get('doctorId') || '';
  const initialIdentificationNumber = searchParams.get('identificationNumber') || '';

  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId);
  const [identificationNumber, setIdentificationNumber] = useState(initialIdentificationNumber);

  // Determine user role and get their ID
  const currentUserId = (session?.user as any)?.id;
  const isAdmin = (session?.user as any)?.isAdmin;
  const isDoctor = (session?.user as any)?.roleId === 213;
  const isPatient = (session?.user as any)?.roleId === 216;
  
  // For doctors, automatically filter by their own patients
  const effectiveDoctorId = isDoctor ? currentUserId : (initialDoctorId || undefined);

  const { data: patients, loading, error, refetch } = usePatients(
    isPatient 
      ? {} // For patients, don't pass any filters - backend will handle filtering
      : {
          doctorId: effectiveDoctorId,
          specialty: initialSpecialty || undefined,
          identificationNumber: initialIdentificationNumber || undefined,
        }
  );
  const { data: doctors } = useDoctors(selectedSpecialty || undefined);
  const { data: specialties, loading: specialtiesLoading, error: specialtiesError } = useSpecialties();

  // Debug logging
  console.log('🔍 Frontend Debug:', {
    roleId: (session?.user as any)?.roleId,
    email: (session?.user as any)?.email,
    isPatient: isPatient,
    patientsCount: patients?.length || 0,
    patients: patients?.map(p => ({ name: p.NAME, email: p.EMAIL }))
  });
  
  console.log('🔍 Specialties Debug:', {
    data: specialties,
    loading: specialtiesLoading,
    error: specialtiesError,
    length: specialties?.length
  });

  useEffect(() => {
    const s = searchParams.get('specialty') || '';
    const d = searchParams.get('doctorId') || '';
    const i = searchParams.get('identificationNumber') || '';
    setSelectedSpecialty(s);
    setSelectedDoctorId(d);
    setIdentificationNumber(i);
  }, [searchParams]);

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <LoadingSpinner size='lg' text='جاري تحميل بيانات المرضى...' />
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
            <h1 className='text-3xl font-bold '>المرضى</h1>
            <p className='mt-1 card-text'>
              {isPatient 
                ? 'بياناتي الشخصية - عرض معلوماتي الطبية' 
                : isDoctor 
                  ? 'مرضاي - عرض المرضى المسجلين تحت رعايتك' 
                  : 'إدارة وعرض سجلات المرضى'
              }
            </p>
            {isPatient && (
              <p className='text-sm card-text mt-1'>
                أنت تشاهد بياناتك الشخصية فقط
              </p>
            )}
            {/* Debug Info */}
            <div className='hidden sm:block text-xs card-text mt-2'>
              Specialties: {specialties?.length || 0} | Loading: {specialtiesLoading ? 'Yes' : 'No'} | Error: {specialtiesError ? 'Yes' : 'No'}
              {isDoctor && ` | Doctor ID: ${currentUserId}`}
              {isPatient && ` | Patient ID: ${currentUserId}`}
            </div>
          </div>
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto'>
            <div className='grid grid-cols-2 gap-2 w-full sm:flex sm:items-center'>
              {/* Only show specialty filter for admins */}
              {!isDoctor && !isPatient && (
                <div className='relative w-full sm:w-56'>
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
                    className='w-full pl-3 pr-10  py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value=''>اختر التخصص</option>
                    {specialtiesLoading ? (
                      <option disabled>جاري التحميل...</option>
                    ) : specialtiesError ? (
                      <option disabled>خطأ في التحميل</option>
                    ) : specialties && specialties.length > 0 ? (
                      specialties.map((spec, index) => (
                        <option key={spec || `specialty-${index}`} value={spec}>{spec}</option>
                      ))
                    ) : (
                      <option disabled>لا توجد تخصصات</option>
                    )}
                  </select>
                </div>
              )}
              {/* Only show doctor filter for admins */}
              {!isDoctor && !isPatient && (
                <div className='relative w-full sm:w-56'>
                  <span className='pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400'>
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
              {/* Only show identification number filter for non-patients */}
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
                    if (!isDoctor) {
                      if (selectedSpecialty) sp.set('specialty', selectedSpecialty); else sp.delete('specialty');
                      if (selectedDoctorId) sp.set('doctorId', selectedDoctorId); else sp.delete('doctorId');
                    }
                    if (identificationNumber && identificationNumber.trim()) sp.set('identificationNumber', identificationNumber.trim()); else sp.delete('identificationNumber');
                    const query = sp.toString();
                    router.push(query ? `?${query}` : '?', { scroll: false });
                  }}
                  className='inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto'
                  title='بحث'
                >
                  <Search className='w-4 h-4 ml-1' />
                  <span>بحث</span>
                </button>
              )}
              {!isPatient && (identificationNumber || (!isDoctor && (selectedSpecialty || selectedDoctorId))) && (
                <button
                  onClick={() => {
                    setSelectedSpecialty('');
                    setSelectedDoctorId('');
                    setIdentificationNumber('');
                    const sp = new URLSearchParams(Array.from(searchParams.entries()));
                    if (!isDoctor) {
                      sp.delete('specialty');
                      sp.delete('doctorId');
                    }
                    sp.delete('identificationNumber');
                    const query = sp.toString();
                    router.push(query ? `?${query}` : '?', { scroll: false });
                  }}
                  className='inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto'
                  title='مسح'
                >
                  ALL
                </button>
              )}
            </div>
            {!isPatient && (
              <ButtonLink href='/patients/new' variant='primary' leftIcon={Plus}>
                إضافة مريض جديد
              </ButtonLink>
            )}
          </div>
        </div>

        {/* Patients Grid */}
        {patients && patients.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {patients.map((patient: Patient, index: number) => (
              <PatientCard
                key={patient.PATIENT_ID || `patient-${index}`}
                patient={patient}
              />
            ))}
          </div>
        ) : (
          <div className='text-center py-12'>
            <div className='bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center'>
              <Plus className='w-8 h-8 text-gray-400' />
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              {isPatient ? 'لا توجد بيانات شخصية' : 'لا توجد بيانات مرضى'}
            </h3>
            <p className='text-gray-600 mb-6'>
              {isPatient 
                ? 'لم يتم العثور على سجل مريض مرتبط بحسابك. يرجى التواصل مع الإدارة لإضافة بياناتك الطبية.' 
                : 'ابدأ بإضافة أول مريض إلى النظام.'
              }
            </p>
            {!isPatient && (
              <ButtonLink href='/patients/new' variant='primary' leftIcon={Plus}>
                إضافة أول مريض
              </ButtonLink>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}