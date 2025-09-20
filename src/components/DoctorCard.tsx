import Image from 'next/image';
import Link from 'next/link';

import { Doctor } from '@/lib/types';

interface DoctorCardProps {
  doctor: Doctor;
}

export default function DoctorCard({ doctor }: DoctorCardProps) {
  return (
    <div className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow'>
      {doctor.image && (
        <Image
          src={doctor.image}
          alt={doctor.name}
          width={400}
          height={192}
          className='w-full h-48 object-cover'
        />
      )}

      <div className='p-4'>
        <h3 className='text-xl font-semibold mb-2'>{doctor.name}</h3>
        <p className='text-blue-600 font-medium mb-2'>{doctor.specialty}</p>

        <div className='space-y-1 text-sm text-gray-600'>
          <p>
            <span className='font-medium'>Email:</span> {doctor.email}
          </p>
          <p>
            <span className='font-medium'>Phone:</span> {doctor.phone}
          </p>
          {doctor.experience && (
            <p>
              <span className='font-medium'>Experience:</span>{' '}
              {doctor.experience} years
            </p>
          )}
        </div>

        {doctor.bio && (
          <p className='mt-3 text-gray-700 line-clamp-3'>{doctor.bio}</p>
        )}

        <div className='mt-4 flex justify-between'>
          <Link
            href={`/doctors/${doctor.doctor_id}`}
            className='text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors'
          >
            View Details
          </Link>
          <Link
            href={`/appointments/new?doctorId=${doctor.doctor_id}`}
            className='bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors'
          >
            Book Appointment
          </Link>
        </div>
      </div>
    </div>
  );
}
