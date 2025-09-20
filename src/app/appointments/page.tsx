'use client';

import { Calendar, Clock, FileText, Plus, User } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Appointment } from '@/lib/types';
import { useAppointments } from '@/hooks/useApiData';

import ErrorBoundary, { ErrorFallback } from '@/components/ErrorBoundary';
import ButtonLink from '@/components/links/ButtonLink';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AppointmentsPage() {
  const { data: appointments, loading, error, refetch } = useAppointments();
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'scheduled' | 'cancelled'
  >('all');

  const filteredAppointments =
    appointments?.filter((appointment: Appointment) => {
      if (filter === 'all') return true;
      return appointment.status === filter;
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
            <h1 className='text-3xl font-bold text-gray-900'>Appointments</h1>
            <p className='text-gray-600 mt-1'>
              Manage and view all appointments
            </p>
          </div>
          <ButtonLink
            href='/appointments/new'
            variant='primary'
            leftIcon={Plus}
          >
            Book New Appointment
          </ButtonLink>
        </div>

        {/* Filter Tabs */}
        <div className='flex flex-wrap gap-2'>
          {(['all', 'scheduled', 'pending', 'cancelled'] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
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
                  key={appointment.appointment_id || `appointment-${index}`}
                  className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'
                >
                  <div className='flex justify-between items-start mb-4'>
                    <div className='flex items-center space-x-2'>
                      <Calendar className='w-5 h-5 text-blue-600' />
                      <span className='font-semibold text-gray-900'>
                        Appointment #{appointment.appointment_id}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        appointment.status
                      )}`}
                    >
                      {appointment.status}
                    </span>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex items-center text-sm text-gray-600'>
                      <Clock className='w-4 h-4 mr-2 text-gray-400' />
                      <span>{formatDateTime(appointment.schedule)}</span>
                    </div>

                    <div className='flex items-center text-sm text-gray-600'>
                      <User className='w-4 h-4 mr-2 text-gray-400' />
                      <span>
                        <strong>Patient:</strong>{' '}
                        {appointment.patient_name ||
                          `ID: ${appointment.patient_id}`}
                      </span>
                    </div>

                    <div className='flex items-center text-sm text-gray-600'>
                      <User className='w-4 h-4 mr-2 text-gray-400' />
                      <span>
                        <strong>Doctor:</strong>{' '}
                        {appointment.doctor_name ||
                          `ID: ${appointment.doctor_id}`}
                      </span>
                    </div>

                    {appointment.reason && (
                      <div className='flex items-start text-sm text-gray-600'>
                        <FileText className='w-4 h-4 mr-2 text-gray-400 mt-0.5' />
                        <div>
                          <strong>Reason:</strong> {appointment.reason}
                        </div>
                      </div>
                    )}

                    {appointment.note && (
                      <div className='flex items-start text-sm text-gray-600'>
                        <FileText className='w-4 h-4 mr-2 text-gray-400 mt-0.5' />
                        <div>
                          <strong>Note:</strong> {appointment.note}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className='flex justify-end mt-4 pt-4 border-t'>
                    <Link
                      href={`/appointments/${appointment.appointment_id}`}
                      className='text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors'
                    >
                      View Details
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
              No {filter === 'all' ? '' : filter} appointments found
            </h3>
            <p className='text-gray-600 mb-6'>
              {filter === 'all'
                ? 'Get started by booking your first appointment.'
                : `No appointments with status "${filter}" found.`}
            </p>
            <ButtonLink
              href='/appointments/new'
              variant='primary'
              leftIcon={Plus}
            >
              Book New Appointment
            </ButtonLink>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
