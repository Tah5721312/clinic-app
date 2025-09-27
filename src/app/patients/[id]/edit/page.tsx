'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { DOMAIN } from '@/lib/constants';

interface Patient {
  PATIENT_ID: number;
  NAME: string;
  EMAIL: string;
  PHONE: string;
  DATEOFBIRTH: string;
  GENDER: string;
  ADDRESS: string;
  OCCUPATION: string;
  EMERGENCYCONTACTNAME: string;
  EMERGENCYCONTACTNUMBER: string;
  PRIMARYPHYSICIAN: number;
  INSURANCEPROVIDER: string;
  INSURANCEPOLICYNUMBER: string;
  ALLERGIES: string;
  CURRENTMEDICATION: string;
  FAMILYMEDICALHISTORY: string;
  PASTMEDICALHISTORY: string;
  IDENTIFICATIONTYPE: string;
  IDENTIFICATIONNUMBER: string;
  PRIVACYCONSENT: boolean;
  TREATMENTCONSENT: boolean;
  DISCLOSURECONSENT: boolean;
}

export default function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Fix: Use React.use() to unwrap the params Promise
  const resolvedParams = use(params);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`${DOMAIN}/api/patients/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error('فشل في تحميل بيانات المريض');
        }
        const data = await response.json();
        setPatient(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [resolvedParams.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setPatient(prev => prev ? { ...prev, [name]: checked } : null);
    } else {
      setPatient(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch(`${DOMAIN}/api/patients/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patient),
      });
      
      if (!response.ok) {
        throw new Error('فشل في تحديث بيانات المريض');
      }
      
      router.push(`/patients/${resolvedParams.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">جاري تحميل البيانات...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">لم يتم العثور على المريض</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">تعديل بيانات المريض</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* المعلومات الأساسية */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="NAME">
              الاسم الكامل
            </label>
            <input
              type="text"
              id="NAME"
              name="NAME"
              value={patient.NAME || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="EMAIL">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              id="EMAIL"
              name="EMAIL"
              value={patient.EMAIL || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="PHONE">
              رقم الهاتف
            </label>
            <input
              type="tel"
              id="PHONE"
              name="PHONE"
              value={patient.PHONE || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="DATEOFBIRTH">
              تاريخ الميلاد
            </label>
            <input
              type="date"
              id="DATEOFBIRTH"
              name="DATEOFBIRTH"
              value={patient.DATEOFBIRTH ? new Date(patient.DATEOFBIRTH).toISOString().split('T')[0] : ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="GENDER">
              الجنس
            </label>
            <select
              id="GENDER"
              name="GENDER"
              value={patient.GENDER || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">اختر الجنس</option>
              <option value="ذكر">ذكر</option>
              <option value="أنثى">أنثى</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ADDRESS">
              العنوان
            </label>
            <input
              type="text"
              id="ADDRESS"
              name="ADDRESS"
              value={patient.ADDRESS || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="OCCUPATION">
              المهنة
            </label>
            <input
              type="text"
              id="OCCUPATION"
              name="OCCUPATION"
              value={patient.OCCUPATION || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          {/* معلومات الطوارئ */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="EMERGENCYCONTACTNAME">
              اسم جهة الاتصال في حالات الطوارئ
            </label>
            <input
              type="text"
              id="EMERGENCYCONTACTNAME"
              name="EMERGENCYCONTACTNAME"
              value={patient.EMERGENCYCONTACTNAME || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="EMERGENCYCONTACTNUMBER">
              رقم جهة الاتصال في حالات الطوارئ
            </label>
            <input
              type="tel"
              id="EMERGENCYCONTACTNUMBER"
              name="EMERGENCYCONTACTNUMBER"
              value={patient.EMERGENCYCONTACTNUMBER || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          {/* معلومات التأمين */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="INSURANCEPROVIDER">
              شركة التأمين
            </label>
            <input
              type="text"
              id="INSURANCEPROVIDER"
              name="INSURANCEPROVIDER"
              value={patient.INSURANCEPROVIDER || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="INSURANCEPOLICYNUMBER">
              رقم بوليصة التأمين
            </label>
            <input
              type="text"
              id="INSURANCEPOLICYNUMBER"
              name="INSURANCEPOLICYNUMBER"
              value={patient.INSURANCEPOLICYNUMBER || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          {/* المعلومات الطبية */}
          <div className="mb-4 md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ALLERGIES">
              الحساسيات
            </label>
            <textarea
              id="ALLERGIES"
              name="ALLERGIES"
              value={patient.ALLERGIES || ''}
              onChange={handleChange}
              rows={3}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4 md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="CURRENTMEDICATION">
              الأدوية الحالية
            </label>
            <textarea
              id="CURRENTMEDICATION"
              name="CURRENTMEDICATION"
              value={patient.CURRENTMEDICATION || ''}
              onChange={handleChange}
              rows={3}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4 md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="FAMILYMEDICALHISTORY">
              التاريخ الطبي العائلي
            </label>
            <textarea
              id="FAMILYMEDICALHISTORY"
              name="FAMILYMEDICALHISTORY"
              value={patient.FAMILYMEDICALHISTORY || ''}
              onChange={handleChange}
              rows={3}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4 md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="PASTMEDICALHISTORY">
              التاريخ الطبي السابق
            </label>
            <textarea
              id="PASTMEDICALHISTORY"
              name="PASTMEDICALHISTORY"
              value={patient.PASTMEDICALHISTORY || ''}
              onChange={handleChange}
              rows={3}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          {/* معلومات الهوية */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="IDENTIFICATIONTYPE">
              نوع الهوية
            </label>
            <select
              id="IDENTIFICATIONTYPE"
              name="IDENTIFICATIONTYPE"
              value={patient.IDENTIFICATIONTYPE || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">اختر نوع الهوية</option>
              <option value="بطاقة شخصية">بطاقة شخصية</option>
              <option value="جواز سفر">جواز سفر</option>
              <option value="رخصة قيادة">رخصة قيادة</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="IDENTIFICATIONNUMBER">
              رقم الهوية
            </label>
            <input
              type="text"
              id="IDENTIFICATIONNUMBER"
              name="IDENTIFICATIONNUMBER"
              value={patient.IDENTIFICATIONNUMBER || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          {/* الموافقات */}
          <div className="mb-4 md:col-span-2">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="PRIVACYCONSENT"
                name="PRIVACYCONSENT"
                checked={patient.PRIVACYCONSENT || false}
                onChange={handleChange}
                className="mr-2 leading-tight"
              />
              <label htmlFor="PRIVACYCONSENT" className="text-sm text-gray-700">
                أوافق على سياسة الخصوصية
              </label>
            </div>
            
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="TREATMENTCONSENT"
                name="TREATMENTCONSENT"
                checked={patient.TREATMENTCONSENT || false}
                onChange={handleChange}
                className="mr-2 leading-tight"
              />
              <label htmlFor="TREATMENTCONSENT" className="text-sm text-gray-700">
                أوافق على خطة العلاج
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="DISCLOSURECONSENT"
                name="DISCLOSURECONSENT"
                checked={patient.DISCLOSURECONSENT || false}
                onChange={handleChange}
                className="mr-2 leading-tight"
              />
              <label htmlFor="DISCLOSURECONSENT" className="text-sm text-gray-700">
                أوافق على مشاركة المعلومات الطبية لأغراض البحث العلمي
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>
      </form>
    </div>
  );
}