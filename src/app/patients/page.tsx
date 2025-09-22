'use client';

import { Plus, Stethoscope, Search, User } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Patient } from '@/lib/types';
import { useDoctors, usePatients, useSpecialties } from '@/hooks/useApiData';

import ErrorBoundary, { ErrorFallback } from '@/components/ErrorBoundary';
import ButtonLink from '@/components/links/ButtonLink';
import LoadingSpinner from '@/components/LoadingSpinner';
import PatientCard from '@/components/PatientCard';

export default function PatientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSpecialty = searchParams.get('specialty') || '';
  const initialDoctorId = searchParams.get('doctorId') || '';
  const initialIdentificationNumber = searchParams.get('identificationNumber') || '';

  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId);
  const [identificationNumber, setIdentificationNumber] = useState(initialIdentificationNumber);

  const { data: patients, loading, error, refetch } = usePatients({
    doctorId: initialDoctorId || undefined,
    specialty: initialSpecialty || undefined,
    identificationNumber: initialIdentificationNumber || undefined,
  });
  const { data: doctors } = useDoctors(selectedSpecialty || undefined);
  const { data: specialties, loading: specialtiesLoading, error: specialtiesError } = useSpecialties();

  // Debug logging
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
            <h1 className='text-3xl font-bold text-gray-900'>المرضى</h1>
            <p className='text-gray-600 mt-1'>
              إدارة وعرض سجلات المرضى
            </p>
            {/* Debug Info */}
            <div className='text-xs text-gray-500 mt-2'>
              Specialties: {specialties?.length || 0} | Loading: {specialtiesLoading ? 'Yes' : 'No'} | Error: {specialtiesError ? 'Yes' : 'No'}
            </div>
          </div>
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto'>
            <div className='flex items-center gap-2'>
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
              <button
                onClick={() => {
                  const sp = new URLSearchParams(Array.from(searchParams.entries()));
                  if (selectedSpecialty) sp.set('specialty', selectedSpecialty); else sp.delete('specialty');
                  if (selectedDoctorId) sp.set('doctorId', selectedDoctorId); else sp.delete('doctorId');
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
              {(selectedSpecialty || selectedDoctorId || identificationNumber) && (
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
            <ButtonLink href='/patients/new' variant='primary' leftIcon={Plus}>
              إضافة مريض جديد
            </ButtonLink>
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
              لا توجد بيانات مرضى
            </h3>
            <p className='text-gray-600 mb-6'>
              ابدأ بإضافة أول مريض إلى النظام.
            </p>
            <ButtonLink href='/patients/new' variant='primary' leftIcon={Plus}>
              إضافة أول مريض
            </ButtonLink>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}