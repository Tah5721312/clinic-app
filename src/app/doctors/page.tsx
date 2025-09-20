'use client';

import { Plus } from 'lucide-react';

import { Doctor } from '@/lib/types';
import { useDoctors } from '@/hooks/useApiData';

import DoctorCard from '@/components/DoctorCard';
import ErrorBoundary, { ErrorFallback } from '@/components/ErrorBoundary';
import ButtonLink from '@/components/links/ButtonLink';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function DoctorsPage() {
  const { data: doctors, loading, error, refetch } = useDoctors();

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <LoadingSpinner size='lg' text='Loading doctors...' />
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
            <h1 className='text-3xl font-bold text-gray-900'>Doctors</h1>
            <p className='text-gray-600 mt-1'>
              Manage and view doctor profiles
            </p>
          </div>
          <ButtonLink href='/doctors/new' variant='primary' leftIcon={Plus}>
            Add New Doctor
          </ButtonLink>
        </div>

        {/* Doctors Grid */}
        {doctors && doctors.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {doctors.map((doctor: Doctor, index: number) => (
              <DoctorCard
                key={doctor.doctor_id || `doctor-${index}`}
                doctor={doctor}
              />
            ))}
          </div>
        ) : (
          <div className='text-center py-12'>
            <div className='bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center'>
              <Plus className='w-8 h-8 text-gray-400' />
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No doctors found
            </h3>
            <p className='text-gray-600 mb-6'>
              Get started by adding your first doctor to the system.
            </p>
            <ButtonLink href='/doctors/new' variant='primary' leftIcon={Plus}>
              Add First Doctor
            </ButtonLink>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
