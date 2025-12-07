'use client';

import { use } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import { DOMAIN } from '@/lib/constants';
import ButtonLink from '@/components/links/ButtonLink';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary, { ErrorFallback } from '@/components/ErrorBoundary';
import { toast } from 'react-toastify';
import { Can } from '@/components/Can';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditMedicalRecordPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<any>(null);

  const [formData, setFormData] = useState({
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

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const response = await fetch(`${DOMAIN}/api/medical-records/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch medical record');
        }
        const data = await response.json();
        setRecord(data);
        setFormData({
          diagnosis: data.DIAGNOSIS || '',
          symptoms: data.SYMPTOMS || '',
          medications: data.MEDICATIONS || '',
          treatmentplan: data.TREATMENTPLAN || '',
          notes: data.NOTES || '',
          blood_pressure: data.BLOOD_PRESSURE || '',
          temperature: data.TEMPERATURE?.toString() || '',
          height: data.HEIGHT?.toString() || '',
          weight: data.WEIGHT?.toString() || '',
          images: data.IMAGES || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${DOMAIN}/api/medical-records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          temperature: formData.temperature ? Number(formData.temperature) : undefined,
          height: formData.height ? Number(formData.height) : undefined,
          weight: formData.weight ? Number(formData.weight) : undefined,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || responseData.details || 'فشل في تحديث السجل الطبي');
      }

      toast.success('تم تحديث السجل الطبي بنجاح');
      router.push(`/medical-records/${id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل في تحديث السجل الطبي';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
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
      <Can do="update" on="MedicalRecord">
        <div className='space-y-6'>
          {/* Header */}
          <div className='flex justify-between items-center'>
            <div className='flex items-center gap-4'>
              <ButtonLink href={`/medical-records/${id}`} variant='outline' leftIcon={ArrowLeft}>
                رجوع
              </ButtonLink>
              <div>
                <h1 className='text-3xl font-bold'>تعديل السجل الطبي</h1>
                <p className='text-gray-600 mt-1'>
                  {record.PATIENT_NAME} - {record.DOCTOR_NAME}
                </p>
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
                disabled={saving}
                className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2'
              >
                <Save className='w-4 h-4' />
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </form>
        </div>
      </Can>
    </ErrorBoundary>
  );
}

