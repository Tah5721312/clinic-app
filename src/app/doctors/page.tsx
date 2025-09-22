'use client';

import { Plus, Stethoscope, Search } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Doctor } from '@/lib/types';
import { useDoctors, useSpecialties } from '@/hooks/useApiData';

import DoctorCard from '@/components/DoctorCard';
import ErrorBoundary, { ErrorFallback } from '@/components/ErrorBoundary';
import ButtonLink from '@/components/links/ButtonLink';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function DoctorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSpecialty = searchParams.get('specialty') || '';
  const { data: doctors, loading, error, refetch } = useDoctors(initialSpecialty);
  const { data: specialties } = useSpecialties();

  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
  const [appliedSpecialty, setAppliedSpecialty] = useState(initialSpecialty);

  // Sync state when URL changes (e.g., via back/forward or external link)
  useEffect(() => {
    const s = searchParams.get('specialty') || '';
    setSelectedSpecialty(s);
    setAppliedSpecialty(s);
  }, [searchParams]);

  const displayedDoctors = useMemo(() => {
    return (doctors || []) as Doctor[];
  }, [doctors]);

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
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto'>
            <div className='flex items-center gap-2'>
              <label htmlFor='specialtyFilter' className='sr-only'>Specialty</label>
              <div className='relative w-full sm:w-64'>
                <span className='pointer-events-none absolute inset-y-0 right-6 pr-3 flex items-center text-gray-400'>
                  <Stethoscope className='w-4 h-4' />
                </span>
                <select
                  id='specialtyFilter'
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className='w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value=''>اختر التخصص</option>
                  {(specialties && specialties.length > 0 ? specialties : []).map((spec, index) => (
                    <option key={spec || `specialty-${index}`} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  setAppliedSpecialty(selectedSpecialty);
                  const sp = new URLSearchParams(Array.from(searchParams.entries()));
                  if (selectedSpecialty) {
                    sp.set('specialty', selectedSpecialty);
                  } else {
                    sp.delete('specialty');
                  }
                  const query = sp.toString();
                  router.push(query ? `?${query}` : '?', { scroll: false });
                }}
                className='inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                title='بحث'
              >
                <Search className='w-4 h-4 ml-1' />
                <span>بحث</span>
              </button>
              {(selectedSpecialty || appliedSpecialty) && (
                <button
                  onClick={() => {
                    setSelectedSpecialty('');
                    setAppliedSpecialty('');
                    const sp = new URLSearchParams(Array.from(searchParams.entries()));
                    sp.delete('specialty');
                    const query = sp.toString();
                    router.push(query ? `?${query}` : '?', { scroll: false });
                  }}
                  className='inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
                  title='مسح الفلتر'
                >
                  <span>ALL</span>
                </button>
              )}
            </div>
            <ButtonLink href='/doctors/new' variant='primary' leftIcon={Plus}>
              Add New Doctor
            </ButtonLink>
          </div>
        </div>

        {/* Doctors Grid */}
        {displayedDoctors && displayedDoctors.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {displayedDoctors.map((doctor: Doctor, index: number) => (
              <DoctorCard
                key={doctor.DOCTOR_ID || `doctor-${index}`}
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