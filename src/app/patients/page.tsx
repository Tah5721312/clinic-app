'use client';

import { Plus, Search, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { Patient } from '@/lib/types';
import { usePatients } from '@/hooks/useApiData';

import ErrorBoundary, { ErrorFallback } from '@/components/ErrorBoundary';
import ButtonLink from '@/components/links/ButtonLink';
import LoadingSpinner from '@/components/LoadingSpinner';
import PatientCard from '@/components/PatientCard';

export default function PatientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const initialIdentificationNumber = searchParams.get('identificationNumber') || '';
  const initialName = searchParams.get('name') || '';

  const [identificationNumber, setIdentificationNumber] = useState(initialIdentificationNumber);
  const [patientName, setPatientName] = useState(initialName);

  // Determine user role and get their ID
  const currentUserId = (session?.user as any)?.id;
  const isAdmin = (session?.user as any)?.isAdmin;
  const isDoctor = (session?.user as any)?.roleId === 213;
  const isPatient = (session?.user as any)?.roleId === 216;
  
  // For doctors, automatically filter by their own patients
  const effectiveDoctorId = isDoctor ? currentUserId : undefined;

  const { data: patients, loading, error, refetch } = usePatients(
    isPatient 
      ? {} // For patients, don't pass any filters - backend will handle filtering
      : {
          doctorId: effectiveDoctorId,
          identificationNumber: initialIdentificationNumber || undefined,
          name: initialName || undefined,
        }
  );

  useEffect(() => {
    const i = searchParams.get('identificationNumber') || '';
    const n = searchParams.get('name') || '';
    setIdentificationNumber(i);
    setPatientName(n);
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
          </div>
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto'>
            <div className='grid grid-cols-2 gap-2 w-full sm:flex sm:items-center'>
              {/* Search by patient name - show for non-patients */}
              {!isPatient && (
                <div className='relative w-full sm:w-64'>
                  <span className='pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400'>
                    <User className='w-4 h-4' />
                  </span>
                  <input
                    type='text'
                    placeholder='اسم المريض'
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className='w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  />
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
                    if (patientName && patientName.trim()) sp.set('name', patientName.trim()); else sp.delete('name');
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
              {!isPatient && (patientName || identificationNumber) && (
                <button
                  onClick={() => {
                    setPatientName('');
                    setIdentificationNumber('');
                    const sp = new URLSearchParams(Array.from(searchParams.entries()));
                    sp.delete('name');
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
                ? 'لم يتم العثور على سجل مريض مرتبط بحسابك. يرجى إضافة بياناتك الشخصية للمتابعة.' 
                : 'ابدأ بإضافة أول مريض إلى النظام.'
              }
            </p>
            {isPatient ? (
              <ButtonLink href='/patients/new' variant='primary' leftIcon={Plus}>
                إضافة بياناتي الشخصية
              </ButtonLink>
            ) : (
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