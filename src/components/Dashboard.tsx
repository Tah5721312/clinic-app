'use client';

import { Calendar, Stethoscope, Users, DollarSign, TrendingUp, Clock } from 'lucide-react';

import { useAppointments, useDoctors, usePatients } from '@/hooks/useApiData';
import { useRevenue } from '@/hooks/useRevenue';

import ErrorBoundary, { ErrorFallback } from '@/components/ErrorBoundary';
import RoleDebugger from '@/components/RoleDebugger';
import UserManagement from '@/components/UserManagement';
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

  const _loading = patientsLoading || doctorsLoading || appointmentsLoading || revenueLoading;
  const error = patientsError || doctorsError || appointmentsError || revenueError;

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

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {patientsLoading || doctorsLoading || appointmentsLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title='Total Patients'
                value={Array.isArray(patients) ? patients.length : 0}
                icon={<Users size={32} />}
                color='bg-gradient-to-r from-blue-500 to-blue-600'
                loading={false}
              />

              <StatCard
                title='Total Doctors'
                value={Array.isArray(doctors) ? doctors.length : 0}
                icon={<Stethoscope size={32} />}
                color='bg-gradient-to-r from-green-500 to-green-600'
                loading={false}
              />

              <StatCard
                title='Total Appointments'
                value={Array.isArray(appointments) ? appointments.length : 0}
                icon={<Calendar size={32} />}
                color='bg-gradient-to-r from-purple-500 to-purple-600'
                loading={false}
              />
            </>
          )}
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
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
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
          </div>
        </div>

        <UserManagement />

        {/* معلومات تشخيصية للأدوار والصلاحيات */}
        <RoleDebugger userId={userId} role={role} />
      </div>
    </ErrorBoundary>
  );
}
