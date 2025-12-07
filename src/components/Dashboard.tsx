'use client';

import { Calendar, Stethoscope, Users, DollarSign, TrendingUp, Clock, Settings, FileText, Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useState, useMemo } from 'react';

import { useAppointments, useDoctors, usePatients, useMedicalRecords } from '@/hooks/useApiData';
import { useRevenue } from '@/hooks/useRevenue';
import { Appointment, Doctor, Patient } from '@/lib/types';

import ErrorBoundary, { ErrorFallback } from '@/components/ErrorBoundary';
import RoleDebugger from '@/components/RoleDebugger';
import UserManagement from '@/components/UserManagement';
import SpecialtiesManagement from '@/components/SpecialtiesManagement';
import { StatCardSkeleton } from '@/components/LoadingSkeleton';

 


interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  isCurrency?: boolean;
}

function StatCard({ title, value, icon, color, loading, isCurrency = false }: StatCardProps) {
  const formatValue = (val: number) => {
    if (isCurrency) {
      return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }
    return val;
  };

  return (
    <div className={`${color} rounded-lg shadow-lg p-6 text-white`}>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-medium opacity-90'>{title}</p>
          <div className='text-3xl font-bold'>
            {loading ? (
              <span className='animate-pulse bg-white/20 h-8 w-16 rounded inline-block'></span>
            ) : (
              formatValue(value)
            )}
          </div>
        </div>
        <div className='opacity-80'>{icon}</div>
      </div>
    </div>
  );
}

interface DashboardProps {
  userId: string;
  role?: string;
}

export default function Dashboard({ userId, role }: DashboardProps) {
  const [isSpecialtiesModalOpen, setIsSpecialtiesModalOpen] = useState(false);
  
  const {
    data: patients,
    loading: patientsLoading,
    error: patientsError,
  } = usePatients();
  const {
    data: doctors,
    loading: doctorsLoading,
    error: doctorsError,
  } = useDoctors();
  const {
    data: appointments,
    loading: appointmentsLoading,
    error: appointmentsError,
  } = useAppointments();
  const {
    data: revenueData,
    loading: revenueLoading,
    error: revenueError,
  } = useRevenue();
  const {
    data: medicalRecords,
    loading: medicalRecordsLoading,
    error: medicalRecordsError,
  } = useMedicalRecords();

  const _loading = patientsLoading || doctorsLoading || appointmentsLoading || revenueLoading || medicalRecordsLoading;
  const error = patientsError || doctorsError || appointmentsError || revenueError || medicalRecordsError;

  // Calculate additional statistics
  const statistics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const appointmentsList = Array.isArray(appointments) ? appointments : [];
    const doctorsList = Array.isArray(doctors) ? doctors : [];
    const patientsList = Array.isArray(patients) ? patients : [];
    const recordsList = Array.isArray(medicalRecords) ? medicalRecords : [];

    // Appointments by status
    const pendingAppointments = appointmentsList.filter((apt: Appointment) => apt.STATUS === 'pending').length;
    const scheduledAppointments = appointmentsList.filter((apt: Appointment) => apt.STATUS === 'scheduled').length;
    const cancelledAppointments = appointmentsList.filter((apt: Appointment) => apt.STATUS === 'cancelled').length;

    // Appointments by time period
    const todayAppointments = appointmentsList.filter((apt: Appointment) => {
      const aptDate = typeof apt.SCHEDULE === 'string' ? new Date(apt.SCHEDULE) : apt.SCHEDULE;
      aptDate.setHours(0, 0, 0, 0);
      return aptDate.getTime() === today.getTime();
    }).length;

    const weekAppointments = appointmentsList.filter((apt: Appointment) => {
      const aptDate = typeof apt.SCHEDULE === 'string' ? new Date(apt.SCHEDULE) : apt.SCHEDULE;
      return aptDate >= startOfWeek && aptDate <= today;
    }).length;

    const monthAppointments = appointmentsList.filter((apt: Appointment) => {
      const aptDate = typeof apt.SCHEDULE === 'string' ? new Date(apt.SCHEDULE) : apt.SCHEDULE;
      return aptDate >= startOfMonth;
    }).length;

    // Available doctors
    const availableDoctors = doctorsList.filter((doc: Doctor) => doc.IS_AVAILABLE === 1).length;

    // New patients this month
    const newPatientsThisMonth = patientsList.filter((pat: Patient) => {
      // Assuming we can check creation date if available, otherwise return 0
      // This would need to be adjusted based on your Patient interface
      return true; // Placeholder - adjust based on actual data structure
    }).length;

    return {
      totalMedicalRecords: recordsList.length,
      pendingAppointments,
      scheduledAppointments,
      cancelledAppointments,
      todayAppointments,
      weekAppointments,
      monthAppointments,
      availableDoctors,
      newPatientsThisMonth,
    };
  }, [appointments, doctors, patients, medicalRecords]);

  if (error) {
    return (
      <ErrorFallback
        error={new Error(error)}
        reset={() => window.location.reload()}
      />
    );
  }

  
  return (
    <ErrorBoundary>
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold '>
            Medical Clinic Dashboard
          </h1>
          <p className=' mt-2'>
            Overview of your clinic's key statistics
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {patientsLoading || doctorsLoading || appointmentsLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title='إجمالي المرضى'
                value={Array.isArray(patients) ? patients.length : 0}
                icon={<Users size={32} />}
                color='bg-gradient-to-r from-blue-500 to-blue-600'
                loading={false}
              />

              <StatCard
                title='إجمالي الأطباء'
                value={Array.isArray(doctors) ? doctors.length : 0}
                icon={<Stethoscope size={32} />}
                color='bg-gradient-to-r from-green-500 to-green-600'
                loading={false}
              />

              <StatCard
                title='إجمالي المواعيد'
                value={Array.isArray(appointments) ? appointments.length : 0}
                icon={<Calendar size={32} />}
                color='bg-gradient-to-r from-purple-500 to-purple-600'
                loading={false}
              />

              <StatCard
                title='السجلات الطبية'
                value={statistics.totalMedicalRecords}
                icon={<FileText size={32} />}
                color='bg-gradient-to-r from-indigo-500 to-indigo-600'
                loading={medicalRecordsLoading}
              />
            </>
          )}
        </div>

        {/* Appointments Statistics */}
        <div className='card rounded-lg shadow p-6'>
          <h2 className='text-xl font-semibold card-title mb-4'>
            إحصائيات المواعيد
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <StatCard
              title='مواعيد اليوم'
              value={statistics.todayAppointments}
              icon={<Clock size={32} />}
              color='bg-gradient-to-r from-cyan-500 to-cyan-600'
              loading={appointmentsLoading}
            />

            <StatCard
              title='مواعيد هذا الأسبوع'
              value={statistics.weekAppointments}
              icon={<Calendar size={32} />}
              color='bg-gradient-to-r from-teal-500 to-teal-600'
              loading={appointmentsLoading}
            />

            <StatCard
              title='مواعيد هذا الشهر'
              value={statistics.monthAppointments}
              icon={<TrendingUp size={32} />}
              color='bg-gradient-to-r from-blue-500 to-blue-600'
              loading={appointmentsLoading}
            />

            <StatCard
              title='أطباء متاحون'
              value={statistics.availableDoctors}
              icon={<CheckCircle size={32} />}
              color='bg-gradient-to-r from-emerald-500 to-emerald-600'
              loading={doctorsLoading}
            />
          </div>
        </div>

        {/* Appointments by Status */}
        <div className='card rounded-lg shadow p-6'>
          <h2 className='text-xl font-semibold card-title mb-4'>
            حالة المواعيد
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <StatCard
              title='مواعيد معلقة'
              value={statistics.pendingAppointments}
              icon={<AlertCircle size={32} />}
              color='bg-gradient-to-r from-yellow-500 to-yellow-600'
              loading={appointmentsLoading}
            />

            <StatCard
              title='مواعيد مجدولة'
              value={statistics.scheduledAppointments}
              icon={<CheckCircle size={32} />}
              color='bg-gradient-to-r from-green-500 to-green-600'
              loading={appointmentsLoading}
            />

            <StatCard
              title='مواعيد ملغاة'
              value={statistics.cancelledAppointments}
              icon={<XCircle size={32} />}
              color='bg-gradient-to-r from-red-500 to-red-600'
              loading={appointmentsLoading}
            />
          </div>
        </div>

        {/* Revenue Section */}
        <div className='card rounded-lg shadow p-6'>
          <h2 className='text-xl font-semibold card-title mb-4'>
            إحصائيات الإيرادات
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {revenueLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  title='إجمالي الإيرادات'
                  value={revenueData?.total || 0}
                  icon={<DollarSign size={32} />}
                  color='bg-gradient-to-r from-emerald-500 to-emerald-600'
                  loading={false}
                  isCurrency={true}
                />

                <StatCard
                  title='الإيرادات الشهرية'
                  value={revenueData?.monthly || 0}
                  icon={<TrendingUp size={32} />}
                  color='bg-gradient-to-r from-orange-500 to-orange-600'
                  loading={false}
                  isCurrency={true}
                />

                <StatCard
                  title='الإيرادات اليومية'
                  value={revenueData?.daily || 0}
                  icon={<Clock size={32} />}
                  color='bg-gradient-to-r from-cyan-500 to-cyan-600'
                  loading={false}
                  isCurrency={true}
                />

                <StatCard
                  title='الإيرادات المدفوعة'
                  value={revenueData?.paid || 0}
                  icon={<DollarSign size={32} />}
                  color='bg-gradient-to-r from-green-500 to-green-600'
                  loading={false}
                  isCurrency={true}
                />

                <StatCard
                  title='الإيرادات المتبقية'
                  value={revenueData?.remaining || 0}
                  icon={<DollarSign size={32} />}
                  color='bg-gradient-to-r from-red-500 to-red-600'
                  loading={false}
                  isCurrency={true}
                />
              </>
            )}
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className='card rounded-lg shadow p-6'>
          <h2 className='text-xl font-semibold card-title mb-4'>
            Quick Actions
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <a
              href='/patients'
              className='flex items-center p-4 card-border rounded-lg card-hover transition-colors'
            >
              <Users className='text-blue-500 mr-3' size={24} />
              <div>
                <h3 className='font-medium card-title'>Manage Patients</h3>
                <p className='text-sm card-title'>
                  View and manage patient records
                </p>
              </div>
            </a>

            <a
              href='/doctors'
              className='flex items-center p-4 card-border rounded-lg card-hover transition-colors'
            >
              <Stethoscope className='text-green-500 mr-3' size={24} />
              <div>
                <h3 className='font-medium card-title'>Manage Doctors</h3>
                <p className='text-sm card-title'>
                  View and manage doctor profiles
                </p>
              </div>
            </a>

            <a
              href='/appointments'
              className='flex items-center p-4 card-border rounded-lg card-hover transition-colors'
            >
              <Calendar className='text-purple-500 mr-3' size={24} />
              <div>
                <h3 className='font-medium card-title'>
                  Manage Appointments
                </h3>
                <p className='text-sm card-title'>
                  Schedule and manage appointments
                </p>
              </div>
            </a>

            <a
              href='/medical-records'
              className='flex items-center p-4 card-border rounded-lg card-hover transition-colors'
            >
              <FileText className='text-indigo-500 mr-3' size={24} />
              <div>
                <h3 className='font-medium card-title'>Medical Records</h3>
                <p className='text-sm card-title'>
                  عرض وإدارة السجلات الطبية
                </p>
              </div>
            </a>

            <button
              onClick={() => setIsSpecialtiesModalOpen(true)}
              className='flex items-center p-4 card-border rounded-lg card-hover transition-colors text-left w-full'
            >
              <Settings className='text-orange-500 mr-3' size={24} />
              <div>
                <h3 className='font-medium card-title'>Manage Specialties</h3>
                <p className='text-sm card-title'>
                  إدارة التخصصات الطبية
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Specialties Management Modal */}
        <SpecialtiesManagement
          isOpen={isSpecialtiesModalOpen}
          onClose={() => setIsSpecialtiesModalOpen(false)}
        />

        <UserManagement />

        {/* معلومات تشخيصية للأدوار والصلاحيات */}
        <RoleDebugger userId={userId} role={role} />
      </div>
    </ErrorBoundary>
  );
}
