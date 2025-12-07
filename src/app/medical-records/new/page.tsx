'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Save, ArrowLeft, FileText, Search, X } from 'lucide-react';
import { DOMAIN } from '@/lib/constants';
import { usePatients } from '@/hooks/useApiData';
import { Patient } from '@/lib/types';
import ButtonLink from '@/components/links/ButtonLink';
import { toast } from 'react-toastify';
import { Can } from '@/components/Can';

export default function NewMedicalRecordPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDoctor = (session?.user as any)?.roleId === 213;
  const isAdmin = (session?.user as any)?.isAdmin;
  const currentUserId = (session?.user as any)?.id;

  // Get patients list (for admin to select, doctor will see their patients)
  const { data: patients } = usePatients({});

  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    patient_id: '',
    diagnosis: '',
    symptoms: '',
    medications: '',
    treatmentplan: '',
    notes: '',
    blood_pressure: '',
    temperature: '',
    height: '',
    weight: '',
    images: '',
  });

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
    if (!formData.patient_id || !patients) return null;
    return patients.find((p: Patient) => p.PATIENT_ID === Number(formData.patient_id));
  }, [formData.patient_id, patients]);

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
    setFormData(prev => ({ ...prev, patient_id: String(patient.PATIENT_ID) }));
    setPatientSearchQuery(patient.NAME || '');
    setIsPatientDropdownOpen(false);
  };

  const handleClearPatient = () => {
    setFormData(prev => ({ ...prev, patient_id: '' }));
    setPatientSearchQuery('');
    setIsPatientDropdownOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.patient_id) {
      setError('يرجى اختيار المريض');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${DOMAIN}/api/medical-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          patient_id: Number(formData.patient_id),
          temperature: formData.temperature ? Number(formData.temperature) : undefined,
          height: formData.height ? Number(formData.height) : undefined,
          weight: formData.weight ? Number(formData.weight) : undefined,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || responseData.details || 'فشل في إضافة السجل الطبي');
      }

      toast.success('تم إضافة السجل الطبي بنجاح');
      router.push(`/medical-records/${responseData.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل في إضافة السجل الطبي';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Can do="create" on="MedicalRecord">
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-4'>
            <ButtonLink href='/medical-records' variant='outline' leftIcon={ArrowLeft}>
              رجوع
            </ButtonLink>
            <div>
              <h1 className='text-3xl font-bold'>إضافة سجل طبي جديد</h1>
              <p className='text-gray-600 mt-1'>إدخال تحليل وتوصيات طبية</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='bg-white rounded-lg shadow-md p-6 space-y-6'>
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
              {error}
            </div>
          )}

          {/* Patient Selection - Searchable Dropdown */}
          <div>
            <label htmlFor='patient_id' className='block text-sm font-medium text-gray-700 mb-2'>
              المريض *
            </label>
            <div className='relative w-full' ref={dropdownRef}>
              <div className='relative'>
                <input
                  type='text'
                  placeholder='ابحث عن مريض بالاسم...'
                  value={selectedPatient ? selectedPatient.NAME : patientSearchQuery}
                  onChange={(e) => {
                    setPatientSearchQuery(e.target.value);
                    setIsPatientDropdownOpen(true);
                    if (!e.target.value) {
                      setFormData(prev => ({ ...prev, patient_id: '' }));
                    }
                  }}
                  onFocus={() => setIsPatientDropdownOpen(true)}
                  className='w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right bg-white'
                  required={!formData.patient_id}
                />
                <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                  <Search className='w-4 h-4 text-gray-400' />
                </div>
                {formData.patient_id && (
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
                        formData.patient_id === String(patient.PATIENT_ID) ? 'bg-blue-50 border-r-4 border-r-blue-500' : ''
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
                        {formData.patient_id === String(patient.PATIENT_ID) && (
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
            {/* Hidden input for form validation */}
            <input
              type='hidden'
              name='patient_id'
              value={formData.patient_id}
              required
            />
          </div>

          {/* Diagnosis */}
          <div>
            <label htmlFor='diagnosis' className='block text-sm font-medium text-gray-700 mb-2'>
              التشخيص
            </label>
            <textarea
              id='diagnosis'
              name='diagnosis'
              value={formData.diagnosis}
              onChange={handleChange}
              rows={3}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='أدخل التشخيص...'
            />
          </div>

          {/* Symptoms */}
          <div>
            <label htmlFor='symptoms' className='block text-sm font-medium text-gray-700 mb-2'>
              الأعراض
            </label>
            <textarea
              id='symptoms'
              name='symptoms'
              value={formData.symptoms}
              onChange={handleChange}
              rows={4}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='أدخل الأعراض...'
            />
          </div>

          {/* Medications */}
          <div>
            <label htmlFor='medications' className='block text-sm font-medium text-gray-700 mb-2'>
              الأدوية
            </label>
            <textarea
              id='medications'
              name='medications'
              value={formData.medications}
              onChange={handleChange}
              rows={4}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='أدخل الأدوية الموصوفة...'
            />
          </div>

          {/* Treatment Plan */}
          <div>
            <label htmlFor='treatmentplan' className='block text-sm font-medium text-gray-700 mb-2'>
              خطة العلاج
            </label>
            <textarea
              id='treatmentplan'
              name='treatmentplan'
              value={formData.treatmentplan}
              onChange={handleChange}
              rows={4}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='أدخل خطة العلاج...'
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor='notes' className='block text-sm font-medium text-gray-700 mb-2'>
              ملاحظات
            </label>
            <textarea
              id='notes'
              name='notes'
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='أدخل ملاحظات إضافية...'
            />
          </div>

          {/* Vital Signs */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div>
              <label htmlFor='blood_pressure' className='block text-sm font-medium text-gray-700 mb-2'>
                ضغط الدم
              </label>
              <input
                type='text'
                id='blood_pressure'
                name='blood_pressure'
                value={formData.blood_pressure}
                onChange={handleChange}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                placeholder='120/80'
              />
            </div>
            <div>
              <label htmlFor='temperature' className='block text-sm font-medium text-gray-700 mb-2'>
                درجة الحرارة (°C)
              </label>
              <input
                type='number'
                step='0.1'
                id='temperature'
                name='temperature'
                value={formData.temperature}
                onChange={handleChange}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                placeholder='36.5'
              />
            </div>
            <div>
              <label htmlFor='height' className='block text-sm font-medium text-gray-700 mb-2'>
                الطول (cm)
              </label>
              <input
                type='number'
                step='0.1'
                id='height'
                name='height'
                value={formData.height}
                onChange={handleChange}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                placeholder='170'
              />
            </div>
            <div>
              <label htmlFor='weight' className='block text-sm font-medium text-gray-700 mb-2'>
                الوزن (kg)
              </label>
              <input
                type='number'
                step='0.1'
                id='weight'
                name='weight'
                value={formData.weight}
                onChange={handleChange}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                placeholder='70'
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className='flex justify-end gap-4'>
            <button
              type='button'
              onClick={() => router.back()}
              className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50'
            >
              إلغاء
            </button>
            <button
              type='submit'
              disabled={loading}
              className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2'
            >
              <Save className='w-4 h-4' />
              {loading ? 'جاري الحفظ...' : 'حفظ السجل الطبي'}
            </button>
          </div>
        </form>
      </div>
    </Can>
  );
}

