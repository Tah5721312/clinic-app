'use client';

import { useState, useMemo, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Stethoscope, Filter, Grid3x3, List, Search } from 'lucide-react';
import { Appointment, Doctor } from '@/lib/types';
import { useAppointmentsWithFilters, useDoctors, useSpecialties } from '@/hooks/useApiData';
import { DOMAIN } from '@/lib/constants';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type ViewMode = 'month' | 'week';
type AppointmentStatus = 'pending' | 'scheduled' | 'cancelled';

interface DraggedAppointment {
  appointment: Appointment;
  sourceDate: Date;
}

interface AppointmentCalendarProps {
  initialDoctorId?: string | number;
  initialSpecialty?: string;
}

export default function AppointmentCalendar({ initialDoctorId: propsDoctorId, initialSpecialty: propsSpecialty }: AppointmentCalendarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [isMobile, setIsMobile] = useState(false);
  
  // Get initial values from URL params (like appointments page)
  const initialSpecialty = searchParams.get('specialty') || propsSpecialty || '';
  const initialDoctorId = searchParams.get('doctorId') || propsDoctorId?.toString() || '';
  
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctorId);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(initialSpecialty);
  const [draggedAppointment, setDraggedAppointment] = useState<DraggedAppointment | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if current user is a doctor or patient
  const isDoctor = (session?.user as any)?.roleId === 213;
  const isPatient = (session?.user as any)?.roleId === 216;

  // Get current URL params values
  const currentSpecialty = searchParams.get('specialty') || '';
  const currentDoctorId = searchParams.get('doctorId') || '';

  // Update from URL params when they change (like appointments page)
  useEffect(() => {
    setSelectedSpecialty(currentSpecialty);
    setSelectedDoctorId(currentDoctorId);
  }, [currentSpecialty, currentDoctorId]);

  // Use URL params for filtering (like appointments page) - read directly from searchParams
  const filterParams = useMemo(() => {
    const specialtyFromUrl = searchParams.get('specialty') || undefined;
    const doctorIdFromUrl = searchParams.get('doctorId') || undefined;
    return {
      doctorId: isDoctor ? undefined : (doctorIdFromUrl || undefined),
      specialty: specialtyFromUrl || undefined,
    };
  }, [isDoctor, searchParams]);

  // Fetch appointments with filters
  const { data: appointments, loading, error, refetch } = useAppointmentsWithFilters(filterParams);

  const { data: doctors } = useDoctors(selectedSpecialty || undefined);
  const { data: specialties } = useSpecialties();

  // If doctor, automatically filter by their ID
  // Also remove duplicates based on APPOINTMENT_ID
  const finalAppointments = useMemo(() => {
    if (!appointments) return [];
    
    // Remove duplicates by APPOINTMENT_ID
    const seen = new Set<number>();
    return appointments.filter((appointment) => {
      if (seen.has(appointment.APPOINTMENT_ID)) {
        console.warn(`Duplicate appointment found: ${appointment.APPOINTMENT_ID}`);
        return false;
      }
      seen.add(appointment.APPOINTMENT_ID);
      return true;
    });
  }, [appointments]);

  // Get first and last day of current view
  // Week starts on Saturday (day 6) instead of Sunday (day 0)
  const getWeekStartDay = (date: Date) => {
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    // Convert to Saturday-based week: Saturday = 0, Sunday = 1, ..., Friday = 6
    return day === 6 ? 0 : day + 1;
  };

  const getViewDates = () => {
    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      return { start: firstDay, end: lastDay };
    } else {
      const start = new Date(currentDate);
      const weekStartOffset = getWeekStartDay(start);
      start.setDate(start.getDate() - weekStartOffset);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { start, end };
    }
  };

  // Get all dates to display in current view
  const getViewDatesList = () => {
    const { start, end } = getViewDates();
    const dates: Date[] = [];
    const current = new Date(start);
    
    // Start from the first day of the week (Saturday) that contains the first day of month
    if (viewMode === 'month') {
      const weekStartOffset = getWeekStartDay(current);
      current.setDate(current.getDate() - weekStartOffset);
    }
    
    while (current <= end || dates.length < (viewMode === 'month' ? 42 : 7)) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
      if (viewMode === 'week' && dates.length >= 7) break;
    }
    
    return dates;
  };

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    if (!finalAppointments) return [];
    return finalAppointments.filter((apt) => {
      const aptDate = new Date(apt.SCHEDULE);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Format date for display (Gregorian calendar)
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-EG', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Navigate to previous period
  const previousPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  // Navigate to next period
  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if current user is super admin
  const isSuperAdmin = (session?.user as any)?.isAdmin || (session?.user as any)?.roleId === 211;

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    // Don't allow dragging paid appointments unless super admin
    if (appointment.PAYMENT_STATUS === 'paid' && !isSuperAdmin) {
      e.preventDefault();
      return;
    }
    
    setDraggedAppointment({
      appointment,
      sourceDate: new Date(appointment.SCHEDULE),
    });
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    if (!draggedAppointment) return;

    const appointment = draggedAppointment.appointment;
    const newDateTime = new Date(targetDate);
    const oldDateTime = new Date(appointment.SCHEDULE);
    
    // Preserve the time from the original appointment
    newDateTime.setHours(oldDateTime.getHours());
    newDateTime.setMinutes(oldDateTime.getMinutes());

    // Don't update if dropped on the same date
    if (
      newDateTime.getDate() === oldDateTime.getDate() &&
      newDateTime.getMonth() === oldDateTime.getMonth() &&
      newDateTime.getFullYear() === oldDateTime.getFullYear()
    ) {
      setDraggedAppointment(null);
      return;
    }

    try {
      setIsUpdating(true);
      const response = await fetch(`${DOMAIN}/api/appointments/${appointment.APPOINTMENT_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedule: newDateTime.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }

      // Refetch appointments
      await refetch();
    } catch (err) {
      console.error('Error updating appointment:', err);
      alert('فشل تحديث الموعد. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUpdating(false);
      setDraggedAppointment(null);
    }
  };

  // Get status color
  const getStatusColor = (status: AppointmentStatus, paymentStatus?: string) => {
    if (paymentStatus === 'paid') {
      return 'bg-green-500';
    }
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get display status
  const getDisplayStatus = (appointment: Appointment) => {
    if (appointment.PAYMENT_STATUS === 'paid') {
      return 'scheduled';
    }
    return appointment.STATUS;
  };

  // Format time
  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  const viewDates = getViewDatesList();
  // Week starts from Saturday to Friday
  const weekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">جاري تحميل المواعيد...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold">تقويم المواعيد</h2>
          
          {/* Navigation */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={previousPeriod}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              title="الشهر السابق"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 sm:px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm sm:text-base flex-1 sm:flex-none"
            >
              اليوم
            </button>
            <button
              onClick={nextPeriod}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              title="الشهر التالي"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 ${
              viewMode === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>شهري</span>
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 ${
              viewMode === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <List className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>أسبوعي</span>
          </button>
        </div>
      </div>

      {/* Date Display */}
      <div className="text-center">
        <h3 className="text-base sm:text-xl font-semibold">
          {viewMode === 'month'
            ? new Intl.DateTimeFormat('ar-EG', { 
                month: 'long', 
                year: 'numeric',
              }).format(currentDate)
            : `${formatDate(getViewDates().start)} - ${formatDate(getViewDates().end)}`}
        </h3>
      </div>

      {/* Filters - Same as appointments page */}
      {!isDoctor && !isPatient && (
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[200px]">
            <span className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
              <Stethoscope className="w-4 h-4" />
            </span>
            <select
              id="specialtyFilter"
              value={selectedSpecialty}
              onChange={(e) => {
                setSelectedSpecialty(e.target.value);
                setSelectedDoctorId('');
              }}
              className="w-full pl-3 pr-10 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">اختر التخصص</option>
              {(specialties && specialties.length > 0 ? specialties : []).map((spec, index) => (
                <option key={spec || `specialty-${index}`} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[200px]">
            <span className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
              <User className="w-4 h-4" />
            </span>
            <select
              id="doctorFilter"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full pl-3 pr-10 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!selectedSpecialty}
            >
              <option value="">اختر الطبيب</option>
              {(doctors || []).map((d) => (
                <option key={d.DOCTOR_ID} value={d.DOCTOR_ID}>
                  {d.NAME}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                const sp = new URLSearchParams();
                if (selectedSpecialty) sp.set('specialty', selectedSpecialty);
                if (!isDoctor && selectedDoctorId) sp.set('doctorId', selectedDoctorId);
                const query = sp.toString();
                router.push(query ? `/appointments/calendar?${query}` : '/appointments/calendar', { scroll: false });
              }}
              className="inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1 sm:flex-none text-sm sm:text-base"
              title="بحث"
            >
              <Search className="w-4 h-4 ml-1" />
              <span>بحث</span>
            </button>

            {(currentSpecialty || currentDoctorId) && (
              <button
                onClick={() => {
                  setSelectedSpecialty('');
                  setSelectedDoctorId('');
                  router.push('/appointments/calendar', { scroll: false });
                }}
                className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-none text-sm sm:text-base"
                title="مسح"
              >
                ALL
              </button>
            )}
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="min-w-[600px] sm:min-w-0">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="p-1.5 sm:p-3 text-center font-semibold text-gray-700 bg-gray-50 min-w-[85px] sm:min-w-0 flex items-center justify-center"
              >
                <span className="hidden sm:inline text-sm">{day}</span>
                <span className="sm:hidden whitespace-nowrap text-[9px] leading-tight">{day}</span>
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {viewDates.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday =
                date.getDate() === new Date().getDate() &&
                date.getMonth() === new Date().getMonth() &&
                date.getFullYear() === new Date().getFullYear();
              const dayAppointments = getAppointmentsForDate(date);
              const isPast = date < new Date() && !isToday;

              return (
                <div
                  key={index}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, date)}
                  className={`min-h-20 sm:min-h-24 md:min-h-32 p-1 sm:p-2 border-r border-b border-gray-200 ${
                    !isCurrentMonth && viewMode === 'month' ? 'bg-gray-50' : 'bg-white'
                  } ${isPast ? 'opacity-60' : ''} ${isToday ? 'bg-blue-50' : ''}`}
                >
                  <div
                    className={`text-xs sm:text-sm font-medium mb-1 ${
                      isToday ? 'text-blue-600 font-bold' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {date.getDate()}
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                        {dayAppointments.slice(0, viewMode === 'month' ? (isMobile ? 2 : 3) : 10).map((appointment, aptIndex) => {
                      const status = getDisplayStatus(appointment);
                      const canDrag = !isPast && !isUpdating && (appointment.PAYMENT_STATUS !== 'paid' || isSuperAdmin);
                      // Create unique key combining appointment ID, date, and index
                      const uniqueKey = `apt-${appointment.APPOINTMENT_ID}-${date.getTime()}-${aptIndex}`;
                      return (
                        <div
                          key={uniqueKey}
                          draggable={canDrag}
                          onDragStart={(e) => handleDragStart(e, appointment)}
                          className={`${getStatusColor(
                            status as AppointmentStatus,
                            appointment.PAYMENT_STATUS
                          )} text-white text-[10px] sm:text-xs p-1 sm:p-1.5 rounded ${canDrag ? 'cursor-move hover:opacity-80' : 'cursor-default'} transition-opacity`}
                          title={`${appointment.PATIENT_NAME || 'مريض'} - ${formatTime(appointment.SCHEDULE)}${!canDrag ? ' (غير قابل للسحب)' : ''}`}
                        >
                          <Link
                            href={`/appointments/${appointment.APPOINTMENT_ID}`}
                            onClick={(e) => e.stopPropagation()}
                            className="block truncate"
                          >
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              <Clock className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
                              <span className="truncate text-[10px] sm:text-xs">
                                {formatTime(appointment.SCHEDULE)}
                              </span>
                            </div>
                            <div className="truncate mt-0.5 text-[10px] sm:text-xs">
                              {appointment.PATIENT_NAME || `#${appointment.APPOINTMENT_ID}`}
                            </div>
                            {appointment.DOCTOR_NAME && (
                              <div className="truncate text-[9px] sm:text-xs opacity-90 hidden sm:block">
                                {appointment.DOCTOR_NAME}
                              </div>
                            )}
                          </Link>
                        </div>
                      );
                    })}
                    {dayAppointments.length > (viewMode === 'month' ? (isMobile ? 2 : 3) : 10) && (
                      <div className="text-[10px] sm:text-xs text-gray-500 p-0.5 sm:p-1">
                        +{dayAppointments.length - (viewMode === 'month' ? (isMobile ? 2 : 3) : 10)} أكثر
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
        <span className="font-medium text-xs sm:text-sm w-full sm:w-auto">الدليل:</span>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded flex-shrink-0"></div>
          <span className="text-xs sm:text-sm">مؤكد (مدفوع)</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded flex-shrink-0"></div>
          <span className="text-xs sm:text-sm">مجدول</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded flex-shrink-0"></div>
          <span className="text-xs sm:text-sm">قيد الانتظار</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded flex-shrink-0"></div>
          <span className="text-xs sm:text-sm">ملغي</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-blue-800">
          <strong>ملاحظة:</strong> يمكنك سحب المواعيد وإفلاتها في أيام مختلفة لتحديث موعدها.
          <span className="hidden sm:inline"> انقر على أي موعد لعرض التفاصيل.</span>
        </p>
      </div>
    </div>
  );
}
