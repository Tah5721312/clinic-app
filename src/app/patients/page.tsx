'use client';

import { Plus } from 'lucide-react';

import { Patient } from '@/lib/types';
import { usePatients } from '@/hooks/useApiData';

import ErrorBoundary, { ErrorFallback } from '@/components/ErrorBoundary';
import ButtonLink from '@/components/links/ButtonLink';
import LoadingSpinner from '@/components/LoadingSpinner';
import PatientCard from '@/components/PatientCard';

export default function PatientsPage() {
  const { data: patients, loading, error, refetch } = usePatients();

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
          </div>
          <ButtonLink href='/patients/new' variant='primary' leftIcon={Plus}>
            إضافة مريض جديد
          </ButtonLink>
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