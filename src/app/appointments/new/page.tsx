'use client';

import { useSearchParams } from 'next/navigation';
import EnhancedAppointmentForm from '@/components/EnhancedAppointmentForm';

export default function NewAppointmentPage() {
  const searchParams = useSearchParams();
  const doctorId = searchParams.get('doctorId');
  const patientId = searchParams.get('patientId');

  return (
    <div className='container mx-auto py-8'>
      <EnhancedAppointmentForm
        doctorId={doctorId || undefined}
        patientId={patientId || undefined}
      />
    </div>
  );
}
