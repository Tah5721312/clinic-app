'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Calendar, User, Stethoscope, Edit2, ArrowLeft } from 'lucide-react';
import { DOMAIN } from '@/lib/constants';
import ButtonLink from '@/components/links/ButtonLink';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary, { ErrorFallback } from '@/components/ErrorBoundary';
import { Can } from '@/components/Can';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MedicalRecordDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [record, setRecord] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchRecord = async () => {
      try {
        const response = await fetch(`${DOMAIN}/api/medical-records/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch medical record');
        }
        const data = await response.json();
        setRecord(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id]);

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <LoadingSpinner size='lg' text='جاري تحميل السجل الطبي...' />
      </div>
    );
  }

  if (error || !record) {
    return <ErrorFallback error={new Error(error || 'Record not found')} reset={() => router.refresh()} />;
  }

  return (
    <ErrorBoundary>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-4'>
            <ButtonLink href='/medical-records' variant='outline' leftIcon={ArrowLeft}>
              رجوع
            </ButtonLink>
            <div>
              <h1 className='text-3xl font-bold'>السجل الطبي</h1>
              <p className='text-gray-600 mt-1'>تفاصيل السجل الطبي</p>
            </div>
          </div>
          <Can do="update" on="MedicalRecord">
            <ButtonLink href={`/medical-records/${id}/edit`} variant='primary' leftIcon={Edit2}>
              تعديل
            </ButtonLink>
          </Can>
        </div>

        {/* Record Details */}
        <div className='bg-white rounded-lg shadow-md p-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Patient Info */}
            <div className='space-y-4'>
              <h2 className='text-xl font-semibold border-b pb-2'>معلومات المريض</h2>
              <div className='flex items-center gap-2'>
                <User className='w-5 h-5 text-gray-500' />
                <div>
                  <span className='text-sm text-gray-600'>اسم المريض:</span>
                  <p className='font-medium'>{record.PATIENT_NAME}</p>
                </div>
              </div>
            </div>

            {/* Doctor Info */}
            <div className='space-y-4'>
              <h2 className='text-xl font-semibold border-b pb-2'>معلومات الطبيب</h2>
              <div className='flex items-center gap-2'>
                <Stethoscope className='w-5 h-5 text-gray-500' />
                <div>
                  <span className='text-sm text-gray-600'>اسم الطبيب:</span>
                  <p className='font-medium'>{record.DOCTOR_NAME}</p>
                  {record.DOCTOR_SPECIALTY && (
                    <p className='text-sm text-gray-500'>{record.DOCTOR_SPECIALTY}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Date Info */}
            <div className='space-y-4'>
              <h2 className='text-xl font-semibold border-b pb-2'>التاريخ</h2>
              <div className='flex items-center gap-2'>
                <Calendar className='w-5 h-5 text-gray-500' />
                <div>
                  <span className='text-sm text-gray-600'>تاريخ الإنشاء:</span>
                  <p className='font-medium'>{formatDate(record.CREATED_AT)}</p>
                </div>
              </div>
              {record.UPDATED_AT && record.UPDATED_AT !== record.CREATED_AT && (
                <div className='flex items-center gap-2'>
                  <Calendar className='w-5 h-5 text-gray-500' />
                  <div>
                    <span className='text-sm text-gray-600'>آخر تحديث:</span>
                    <p className='font-medium'>{formatDate(record.UPDATED_AT)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Medical Information */}
          <div className='mt-8 space-y-6'>
            <h2 className='text-xl font-semibold border-b pb-2'>المعلومات الطبية</h2>

            {record.DIAGNOSIS && (
              <div>
                <h3 className='font-semibold text-gray-700 mb-2'>التشخيص</h3>
                <p className='text-gray-600 bg-gray-50 p-4 rounded-lg'>{record.DIAGNOSIS}</p>
              </div>
            )}

            {record.SYMPTOMS && (
              <div>
                <h3 className='font-semibold text-gray-700 mb-2'>الأعراض</h3>
                <p className='text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap'>{record.SYMPTOMS}</p>
              </div>
            )}

            {record.MEDICATIONS && (
              <div>
                <h3 className='font-semibold text-gray-700 mb-2'>الأدوية</h3>
                <p className='text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap'>{record.MEDICATIONS}</p>
              </div>
            )}

            {record.TREATMENTPLAN && (
              <div>
                <h3 className='font-semibold text-gray-700 mb-2'>خطة العلاج</h3>
                <p className='text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap'>{record.TREATMENTPLAN}</p>
              </div>
            )}

            {record.NOTES && (
              <div>
                <h3 className='font-semibold text-gray-700 mb-2'>ملاحظات</h3>
                <p className='text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap'>{record.NOTES}</p>
              </div>
            )}

            {/* Vital Signs */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              {record.BLOOD_PRESSURE && (
                <div className='bg-blue-50 p-4 rounded-lg'>
                  <h3 className='font-semibold text-blue-700 mb-1'>ضغط الدم</h3>
                  <p className='text-blue-900'>{record.BLOOD_PRESSURE}</p>
                </div>
              )}
              {record.TEMPERATURE && (
                <div className='bg-red-50 p-4 rounded-lg'>
                  <h3 className='font-semibold text-red-700 mb-1'>درجة الحرارة</h3>
                  <p className='text-red-900'>{record.TEMPERATURE}°C</p>
                </div>
              )}
              {record.HEIGHT && (
                <div className='bg-green-50 p-4 rounded-lg'>
                  <h3 className='font-semibold text-green-700 mb-1'>الطول</h3>
                  <p className='text-green-900'>{record.HEIGHT} cm</p>
                </div>
              )}
              {record.WEIGHT && (
                <div className='bg-purple-50 p-4 rounded-lg'>
                  <h3 className='font-semibold text-purple-700 mb-1'>الوزن</h3>
                  <p className='text-purple-900'>{record.WEIGHT} kg</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

