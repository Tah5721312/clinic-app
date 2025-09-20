import { Calendar, Mail, Phone, User } from 'lucide-react';
import Link from 'next/link';

import { Patient } from '@/lib/types';

interface PatientCardProps {
  patient: Patient;
}

export default function PatientCard({ patient }: PatientCardProps) {
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Unknown';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // التحقق من صحة التاريخ
    if (isNaN(dateObj.getTime())) return 'Invalid Date';

    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth: Date | string | null | undefined) => {
    if (!dateOfBirth) return 'Unknown';

    const today = new Date();
    const birthDate =
      typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;

    // التحقق من صحة التاريخ
    if (isNaN(birthDate.getTime())) return 'Invalid Date';

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  return (
    <div className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200'>
      <div className='p-6'>
        {/* Header with avatar and basic info */}
        <div className='flex items-start space-x-4 mb-4'>
          <div className='bg-blue-100 rounded-full p-3'>
            <User className='w-6 h-6 text-blue-600' />
          </div>
          <div className='flex-1'>
            <h3 className='text-xl font-semibold text-gray-900 mb-1'>
              {patient.name}
            </h3>
            <p className='text-gray-600 text-sm'>
              {patient.gender} • Age {calculateAge(patient.dateOfBirth)}
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className='space-y-2 mb-4'>
          <div className='flex items-center text-sm text-gray-600'>
            <Mail className='w-4 h-4 mr-2 text-gray-400' />
            <span className='truncate'>{patient.email}</span>
          </div>
          <div className='flex items-center text-sm text-gray-600'>
            <Phone className='w-4 h-4 mr-2 text-gray-400' />
            <span>{patient.phone}</span>
          </div>
          <div className='flex items-center text-sm text-gray-600'>
            <Calendar className='w-4 h-4 mr-2 text-gray-400' />
            <span>Born {formatDate(patient.dateOfBirth)}</span>
          </div>
        </div>

        {/* Additional Info */}
        {(patient.address || patient.occupation) && (
          <div className='border-t pt-3 mb-4'>
            {patient.address && (
              <p className='text-sm text-gray-600 mb-1'>
                <span className='font-medium'>Address:</span> {patient.address}
              </p>
            )}
            {patient.occupation && (
              <p className='text-sm text-gray-600'>
                <span className='font-medium'>Occupation:</span>{' '}
                {patient.occupation}
              </p>
            )}
          </div>
        )}

        {/* Medical Info */}
        {(patient.allergies || patient.currentMedication) && (
          <div className='border-t pt-3 mb-4'>
            {patient.allergies && (
              <p className='text-sm text-gray-600 mb-1'>
                <span className='font-medium text-red-600'>Allergies:</span>{' '}
                {patient.allergies}
              </p>
            )}
            {patient.currentMedication && (
              <p className='text-sm text-gray-600'>
                <span className='font-medium text-blue-600'>Medication:</span>{' '}
                {patient.currentMedication}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex justify-between items-center pt-3 border-t'>
          <Link
            href={`/patients/${patient.patient_id}`}
            className='text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors'
          >
            View Profile
          </Link>
          <Link
            href={`/appointments/new?patientId=${patient.patient_id}`}
            className='bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors'
          >
            Book Appointment
          </Link>
        </div>
      </div>
    </div>
  );
}
