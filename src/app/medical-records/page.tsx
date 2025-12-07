'use client';

import { Plus, FileText, Calendar, User, Stethoscope, Edit2, Trash2, Eye, Search, X } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { MedicalRecord, Patient } from '@/lib/types';
import { useMedicalRecords, usePatients } from '@/hooks/useApiData';

import ErrorBoundary, { ErrorFallback } from '@/components/ErrorBoundary';
import ButtonLink from '@/components/links/ButtonLink';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Can } from '@/components/Can';
import { DOMAIN } from '@/lib/constants';
import { toast } from 'react-toastify';

export default function MedicalRecordsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedPatientId, setSelectedPatientId] = useState<number | undefined>(undefined);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentUserId = (session?.user as any)?.id;
  const isAdmin = (session?.user as any)?.isAdmin;
  const isDoctor = (session?.user as any)?.roleId === 213;
  const isPatient = (session?.user as any)?.roleId === 216;

  // Get patients list (for admin/doctor to filter)
  const { data: patients } = usePatients({});

  // Get medical records with proper filtering
  const { data: records, loading, error, refetch } = useMedicalRecords(
    selectedPatientId ? { patientId: selectedPatientId } : undefined
  );

  // Filter patients based on search query
  const filteredPatients = React.useMemo(() => {
    if (!patients || !Array.isArray(patients)) return [];
    if (!patientSearchQuery.trim()) return patients;
    
    const query = patientSearchQuery.toLowerCase().trim();
    return patients.filter((patient: Patient) =>
      patient.NAME?.toLowerCase().includes(query) ||
      patient.EMAIL?.toLowerCase().includes(query) ||
      patient.PHONE?.includes(query)
    );
  }, [patients, patientSearchQuery]);

  // Get selected patient name
  const selectedPatient = React.useMemo(() => {
    if (!selectedPatientId || !patients) return null;
    return patients.find((p: Patient) => p.PATIENT_ID === selectedPatientId);
  }, [selectedPatientId, patients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPatientDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatientId(patient.PATIENT_ID);
    setPatientSearchQuery(patient.NAME || '');
    setIsPatientDropdownOpen(false);
  };

  const handleClearPatient = () => {
    setSelectedPatientId(undefined);
    setPatientSearchQuery('');
    setIsPatientDropdownOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل الطبي؟')) {
      return;
    }

    try {
      const response = await fetch(`${DOMAIN}/api/medical-records/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('تم حذف السجل الطبي بنجاح');
        refetch();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'فشل في حذف السجل الطبي');
      }
    } catch (error) {
      toast.error('فشل في حذف السجل الطبي');
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <LoadingSpinner size='lg' text='جاري تحميل السجلات الطبية...' />
      </div>
    );
  }

  if (error) {
    return <ErrorFallback error={new Error(error)} reset={refetch} />;
  }

  return (
    <ErrorBoundary>
      <Can do="read" on="MedicalRecord">
        <div className='space-y-6'>
          {/* Header */}
          <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
            <div>
              <h1 className='text-3xl font-bold'>السجلات الطبية</h1>
              <p className='mt-1 card-text'>
                {isPatient
                  ? 'سجلاتي الطبية - عرض جميع السجلات الطبية الخاصة بي'
                  : isDoctor
                    ? 'سجلاتي الطبية - السجلات التي قمت بإنشائها'
                    : 'إدارة وعرض جميع السجلات الطبية'}
              </p>
            </div>
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2'>
              {/* Patient filter for admin/doctor - Searchable Dropdown */}
              {!isPatient && (
                <div className='relative w-full sm:w-72' ref={dropdownRef}>
                  <div className='relative'>
                    <input
                      type='text'
                      placeholder='ابحث عن مريض بالاسم...'
                      value={selectedPatient ? selectedPatient.NAME : patientSearchQuery}
                      onChange={(e) => {
                        setPatientSearchQuery(e.target.value);
                        setIsPatientDropdownOpen(true);
                        if (!e.target.value) {
                          setSelectedPatientId(undefined);
                        }
                      }}
                      onFocus={() => setIsPatientDropdownOpen(true)}
                      className='w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right bg-white'
                    />
                    <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                      <Search className='w-4 h-4 text-gray-400' />
                    </div>
                    {selectedPatientId && (
                      <button
                        onClick={handleClearPatient}
                        className='absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 hover:text-red-500 transition-colors'
                        type='button'
                        title='مسح الاختيار'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    )}
                  </div>
                  
                  {/* Dropdown List */}
                  {isPatientDropdownOpen && filteredPatients.length > 0 && (
                    <div className='absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-64 overflow-auto'>
                      {filteredPatients.map((patient: Patient) => (
                        <button
                          key={patient.PATIENT_ID}
                          type='button'
                          onClick={() => handlePatientSelect(patient)}
                          className={`w-full text-right px-4 py-3 hover:bg-blue-50 active:bg-blue-100 transition-colors border-b border-gray-100 last:border-b-0 ${
                            selectedPatientId === patient.PATIENT_ID ? 'bg-blue-50 border-r-4 border-r-blue-500' : ''
                          }`}
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex-1'>
                              <div className='font-semibold text-gray-900'>{patient.NAME}</div>
                              {patient.EMAIL && (
                                <div className='text-sm text-gray-600 mt-0.5'>{patient.EMAIL}</div>
                              )}
                              {patient.PHONE && (
                                <div className='text-xs text-gray-500 mt-0.5'>{patient.PHONE}</div>
                              )}
                            </div>
                            {selectedPatientId === patient.PATIENT_ID && (
                              <div className='mr-2'>
                                <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {isPatientDropdownOpen && filteredPatients.length === 0 && patientSearchQuery && (
                    <div className='absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-2xl'>
                      <div className='px-4 py-4 text-gray-500 text-center text-sm'>
                        <div className='flex flex-col items-center gap-2'>
                          <Search className='w-5 h-5 text-gray-400' />
                          <span>لا توجد نتائج لـ "{patientSearchQuery}"</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <Can do="create" on="MedicalRecord">
                <ButtonLink href='/medical-records/new' variant='primary' leftIcon={Plus}>
                  إضافة سجل طبي جديد
                </ButtonLink>
              </Can>
            </div>
          </div>

          {/* Records List */}
          {records && records.length > 0 ? (
            <div className='space-y-4'>
              {records.map((record: MedicalRecord) => (
                <div
                  key={record.MEDICALRECORD_ID}
                  className='bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow'
                >
                  <div className='flex justify-between items-start mb-4'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <FileText className='w-5 h-5 text-blue-600' />
                        <h3 className='text-xl font-semibold'>
                          {record.PATIENT_NAME} - {record.DOCTOR_NAME}
                        </h3>
                        {record.DOCTOR_SPECIALTY && (
                          <span className='px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm'>
                            {record.DOCTOR_SPECIALTY}
                          </span>
                        )}
                      </div>
                      <div className='flex items-center gap-4 text-sm text-gray-600'>
                        <div className='flex items-center gap-1'>
                          <Calendar className='w-4 h-4' />
                          <span>{formatDate(record.CREATED_AT)}</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <User className='w-4 h-4' />
                          <span>المريض: {record.PATIENT_NAME}</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <Stethoscope className='w-4 h-4' />
                          <span>الطبيب: {record.DOCTOR_NAME}</span>
                        </div>
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => router.push(`/medical-records/${record.MEDICALRECORD_ID}`)}
                        className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg'
                        title='عرض'
                      >
                        <Eye className='w-5 h-5' />
                      </button>
                      <Can do="update" on="MedicalRecord">
                        <button
                          onClick={() => router.push(`/medical-records/${record.MEDICALRECORD_ID}/edit`)}
                          className='p-2 text-green-600 hover:bg-green-50 rounded-lg'
                          title='تعديل'
                        >
                          <Edit2 className='w-5 h-5' />
                        </button>
                      </Can>
                      <Can do="delete" on="MedicalRecord">
                        <button
                          onClick={() => handleDelete(record.MEDICALRECORD_ID)}
                          className='p-2 text-red-600 hover:bg-red-50 rounded-lg'
                          title='حذف'
                        >
                          <Trash2 className='w-5 h-5' />
                        </button>
                      </Can>
                    </div>
                  </div>

                  {/* Quick Info */}
                  {record.DIAGNOSIS && (
                    <div className='mb-2'>
                      <span className='font-medium text-gray-700'>التشخيص: </span>
                      <span className='text-gray-600'>{record.DIAGNOSIS}</span>
                    </div>
                  )}
                  {record.TREATMENTPLAN && (
                    <div className='mb-2'>
                      <span className='font-medium text-gray-700'>خطة العلاج: </span>
                      <span className='text-gray-600'>{record.TREATMENTPLAN.substring(0, 100)}...</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-12'>
              <div className='bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center'>
                <FileText className='w-8 h-8 text-gray-400' />
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                لا توجد سجلات طبية
              </h3>
              <p className='text-gray-600 mb-6'>
                {isPatient
                  ? 'لا توجد سجلات طبية مسجلة لك'
                  : 'ابدأ بإضافة أول سجل طبي'}
              </p>
              <Can do="create" on="MedicalRecord">
                <ButtonLink href='/medical-records/new' variant='primary' leftIcon={Plus}>
                  إضافة سجل طبي جديد
                </ButtonLink>
              </Can>
            </div>
          )}
        </div>
      </Can>
    </ErrorBoundary>
  );
}

