'use client';

import AppointmentCalendar from '@/components/AppointmentCalendar';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const doctorId = searchParams.get('doctorId') || '';
  const specialty = searchParams.get('specialty') || '';

  const appointmentsLink = `/appointments${doctorId ? `?doctorId=${doctorId}` : ''}${specialty ? `${doctorId ? '&' : '?'}specialty=${specialty}` : ''}`;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <div className="mb-3 sm:mb-4">
        <Link
          href={appointmentsLink}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base"
        >
          <ArrowRight className="w-4 h-4" />
          <span className="hidden sm:inline">العودة إلى قائمة المواعيد</span>
          <span className="sm:hidden">عودة</span>
        </Link>
      </div>
      <AppointmentCalendar 
        initialDoctorId={doctorId || undefined}
        initialSpecialty={specialty || undefined}
      />
    </div>
  );
}
