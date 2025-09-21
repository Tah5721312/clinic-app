'use client';

import { useSearchParams } from 'next/navigation';
import AppointmentForm from '@/components/AppointmentForm';

export default function NewAppointmentPage() {
  const searchParams = useSearchParams();
  const doctorId = searchParams.get('doctorId');
  const patientId = searchParams.get('patientId');

  return (
    <div className='container mx-auto py-8'>
      <AppointmentForm
        doctorId={doctorId || undefined}
        patientId={patientId || undefined}
      />
    </div>
  );
}
