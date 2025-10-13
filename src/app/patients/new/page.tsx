'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DOMAIN } from '@/lib/constants';
import { useDoctors, useSpecialties } from '@/hooks/useApiData';

interface ApiError {
  error: string;
  details?: string;
}

export default function AddPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState(false);
  const [newPatientId, setNewPatientId] = useState<number | null>(null);
  
  // Specialty and doctor filtering
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  
  // Fetch specialties and doctors
  const { data: specialties, loading: specialtiesLoading, error: specialtiesError } = useSpecialties();
  const { data: doctors } = useDoctors(selectedSpecialty || undefined);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    occupation: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    primaryPhysician: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    allergies: '',
    currentMedication: '',
    familyMedicalHistory: '',
    pastMedicalHistory: '',
    identificationType: '',
    identificationNumber: '',
    privacyConsent: false,
    treatmentConsent: false,
    disclosureConsent: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // إخفاء الرسائل عند بدء التعديل
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await fetch(`${DOMAIN}/api/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          primaryPhysician: selectedDoctorId || formData.primaryPhysician,
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.details || responseData.error || 'فشل في إضافة المريض');
      }
      
      setSuccess(true);
      setNewPatientId(responseData.id);
      
      // إعادة تعيين النموذج بعد النجاح
      setFormData({
        name: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        occupation: '',
        emergencyContactName: '',
        emergencyContactNumber: '',
        primaryPhysician: '',
        insuranceProvider: '',
        insurancePolicyNumber: '',
        allergies: '',
        currentMedication: '',
        familyMedicalHistory: '',
        pastMedicalHistory: '',
        identificationType: '',
        identificationNumber: '',
        privacyConsent: false,
        treatmentConsent: false,
        disclosureConsent: false,
      });
      
      // Reset specialty and doctor selections
      setSelectedSpecialty('');
      setSelectedDoctorId('');

      // توجيه إلى صفحة المريض بعد 3 ثواني
      setTimeout(() => {
        if (responseData.id) {
          router.push(`/patients/${responseData.id}`);
        }
      }, 3000);
    } catch (err) {
      setError({
        error: 'فشل في إضافة المريض',
        details: err instanceof Error ? err.message : 'حدث خطأ غير متوقع',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">إضافة مريض جديد</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">خطأ</p>
          <p>{error.error}</p>
          {error.details && <p className="text-sm mt-2">{error.details}</p>}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>تم إضافة المريض بنجاح!</p>
          <p className="text-sm mt-2">رقم المريض: {newPatientId}</p>
          <p className="text-sm mt-2">سيتم توجيهك إلى صفحة المريض خلال ثواني...</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* المعلومات الأساسية */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              الاسم الكامل *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
              رقم الهاتف *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dateOfBirth">
              تاريخ الميلاد
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="gender">
              الجنس
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">اختر الجنس</option>
              <option value="ذكر">ذكر</option>
              <option value="أنثى">أنثى</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
              العنوان
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="occupation">
              المهنة
            </label>
            <input
              type="text"
              id="occupation"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          {/* معلومات الطوارئ */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="emergencyContactName">
              اسم جهة الاتصال في حالات الطوارئ
            </label>
            <input
              type="text"
              id="emergencyContactName"
              name="emergencyContactName"
              value={formData.emergencyContactName}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="emergencyContactNumber">
              رقم جهة الاتصال في حالات الطوارئ
            </label>
            <input
              type="tel"
              id="emergencyContactNumber"
              name="emergencyContactNumber"
              value={formData.emergencyContactNumber}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          {/* معلومات الطبيب */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="selectedSpecialty">
              تخصص الطبيب
            </label>
            <select
              id="selectedSpecialty"
              value={selectedSpecialty}
              onChange={(e) => {
                setSelectedSpecialty(e.target.value);
                setSelectedDoctorId(''); // Reset doctor selection when specialty changes
              }}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">اختر التخصص</option>
              {specialtiesLoading ? (
                <option disabled>جاري التحميل...</option>
              ) : specialtiesError ? (
                <option disabled>خطأ في التحميل</option>
              ) : specialties && specialties.length > 0 ? (
                specialties.map((spec, index) => (
                  <option key={spec || `specialty-${index}`} value={spec}>{spec}</option>
                ))
              ) : (
                <option disabled>لا توجد تخصصات</option>
              )}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="selectedDoctorId">
              الطبيب المعالج
            </label>
            <select
              id="selectedDoctorId"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              disabled={!selectedSpecialty}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">اختر الطبيب</option>
              {doctors && doctors.length > 0 ? (
                doctors.map((doctor) => (
                  <option key={doctor.DOCTOR_ID} value={doctor.DOCTOR_ID}>
                    {doctor.NAME}
                  </option>
                ))
              ) : (
                <option disabled>لا توجد أطباء في هذا التخصص</option>
              )}
            </select>
          </div>
          
          {/* معلومات التأمين */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="insuranceProvider">
              شركة التأمين
            </label>
            <input
              type="text"
              id="insuranceProvider"
              name="insuranceProvider"
              value={formData.insuranceProvider}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="insurancePolicyNumber">
              رقم بوليصة التأمين
            </label>
            <input
              type="text"
              id="insurancePolicyNumber"
              name="insurancePolicyNumber"
              value={formData.insurancePolicyNumber}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          {/* المعلومات الطبية */}
          <div className="mb-4 md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="allergies">
              الحساسيات
            </label>
            <textarea
              id="allergies"
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              rows={3}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4 md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currentMedication">
              الأدوية الحالية
            </label>
            <textarea
              id="currentMedication"
              name="currentMedication"
              value={formData.currentMedication}
              onChange={handleChange}
              rows={3}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4 md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="familyMedicalHistory">
              التاريخ الطبي العائلي
            </label>
            <textarea
              id="familyMedicalHistory"
              name="familyMedicalHistory"
              value={formData.familyMedicalHistory}
              onChange={handleChange}
              rows={3}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4 md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pastMedicalHistory">
              التاريخ الطبي السابق
            </label>
            <textarea
              id="pastMedicalHistory"
              name="pastMedicalHistory"
              value={formData.pastMedicalHistory}
              onChange={handleChange}
              rows={3}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          {/* معلومات الهوية */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="identificationType">
              نوع الهوية
            </label>
            <select
              id="identificationType"
              name="identificationType"
              value={formData.identificationType}
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
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="identificationNumber">
              رقم الهوية
            </label>
            <input
              type="text"
              id="identificationNumber"
              name="identificationNumber"
              value={formData.identificationNumber}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          {/* الموافقات */}
          <div className="mb-4 md:col-span-2">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="privacyConsent"
                name="privacyConsent"
                checked={formData.privacyConsent}
                onChange={handleChange}
                className="mr-2 leading-tight"
              />
              <label htmlFor="privacyConsent" className="text-sm text-gray-700">
                أوافق على سياسة الخصوصية *
              </label>
            </div>
            
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="treatmentConsent"
                name="treatmentConsent"
                checked={formData.treatmentConsent}
                onChange={handleChange}
                className="mr-2 leading-tight"
              />
              <label htmlFor="treatmentConsent" className="text-sm text-gray-700">
                أوافق على خطة العلاج *
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="disclosureConsent"
                name="disclosureConsent"
                checked={formData.disclosureConsent}
                onChange={handleChange}
                className="mr-2 leading-tight"
              />
              <label htmlFor="disclosureConsent" className="text-sm text-gray-700">
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
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {loading ? 'جاري الإضافة...' : 'إضافة المريض'}
          </button>
        </div>
      </form>
    </div>
  );
}