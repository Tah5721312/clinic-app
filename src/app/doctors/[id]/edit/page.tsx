'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, User, Mail, Phone, Stethoscope, Award, Calendar, ImageIcon, FileText, Save, ArrowLeft, Loader, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Doctor } from '@/lib/types';
import { useSpecialties } from '@/hooks/useApiData';
import { DOMAIN } from '@/lib/constants';
import { toastSuccess } from '@/lib/toast';


export default function EditDoctorPage() {
  const router = useRouter();
  const params = useParams();
  const doctorId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const { data: specialties } = useSpecialties();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    experience: '',
    qualification: '',
    image: '',
    bio: '',
    consultation_fee: '',
    is_available: '1'
  });

  // جلب بيانات الطبيب
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${DOMAIN}/api/doctors/${doctorId}`);

        if (!response.ok) {
          throw new Error('فشل في تحميل بيانات الطبيب');
        }

        const doctorData: Doctor = await response.json();
        setDoctor(doctorData);

        // تعبئة النموذج ببيانات الطبيب
        setFormData({
          name: doctorData.NAME || '',
          email: doctorData.EMAIL || '',
          phone: doctorData.PHONE || '',
          specialty: doctorData.SPECIALTY || '',
          experience: doctorData.EXPERIENCE?.toString() || '',
          qualification: doctorData.QUALIFICATION || '',
          image: doctorData.IMAGE || '',
          bio: doctorData.BIO || '',
          consultation_fee: doctorData.CONSULTATION_FEE?.toString() || '',
          is_available: doctorData.IS_AVAILABLE?.toString() || '1'
        });
      } catch (error) {
        setErrors({ general: 'فشل في تحميل بيانات الطبيب' });
      } finally {
        setLoading(false);
      }
    };

    if (doctorId) {
      fetchDoctor();
    }
  }, [doctorId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // مسح الخطأ عند التعديل
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'اسم الطبيب مطلوب';
    if (!formData.email.trim()) newErrors.email = 'البريد الإلكتروني مطلوب';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'صيغة البريد الإلكتروني غير صحيحة';
    if (!formData.phone.trim()) newErrors.phone = 'رقم الهاتف مطلوب';
    if (!formData.specialty.trim()) newErrors.specialty = 'التخصص مطلوب';

    if (formData.experience && isNaN(Number(formData.experience))) {
      newErrors.experience = 'يجب أن تكون سنوات الخبرة رقماً';
    }

    if (formData.consultation_fee && isNaN(Number(formData.consultation_fee))) {
      newErrors.consultation_fee = 'يجب أن يكون سعر الكشف رقماً';
    } else if (formData.consultation_fee && Number(formData.consultation_fee) < 0) {
      newErrors.consultation_fee = 'يجب أن يكون سعر الكشف موجباً';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setUpdating(true);

    try {
      const response = await fetch(`${DOMAIN}/api/doctors/${doctorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          specialty: formData.specialty,
          experience: formData.experience ? Number(formData.experience) : null,
          qualification: formData.qualification || null,
          image: formData.image || null,
          bio: formData.bio || null,
          consultation_fee: formData.consultation_fee ? Number(formData.consultation_fee) : 0,
          is_available: Number(formData.is_available)
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // نجح التحديث
        toastSuccess('تم تحديث بيانات الطبيب بنجاح!');
        router.push('/doctors');
      } else {
        // هناك خطأ
        if (result.error === 'Duplicate entry') {
          setErrors({ general: 'هذا الطبيب مسجل بالفعل (البريد الإلكتروني أو الهاتف مستخدم مسبقاً)' });
        } else if (result.error === 'Doctor not found') {
          setErrors({ general: 'الطبيب غير موجود' });
        } else {
          setErrors({ general: result.details || 'حدث خطأ أثناء تحديث بيانات الطبيب' });
        }
      }
    } catch (error) {
      setErrors({ general: 'فشل في الاتصال بالخادم' });
    } finally {
      setUpdating(false);
    }
  };


  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">جاري تحميل بيانات الطبيب...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          <p>لم يتم العثور على الطبيب المطلوب</p>
        </div>
        <button
          onClick={() => router.push('/doctors')}
          className="mt-4 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 ml-1" />
          العودة إلى قائمة الأطباء
        </button>
      </div>
    );
  }

  return (
    <div className="card max-w-4xl mx-auto p-6">
      {/* رأس الصفحة */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/doctors')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 ml-1" />
          العودة إلى قائمة الأطباء
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">تعديل بيانات الطبيب</h1>
        <p className="text-gray-600">قم بتعديل معلومات الطبيب {doctor.NAME}</p>
      </div>

      {/* نموذج التعديل */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        {errors.general && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* الاسم */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              <div className="flex items-center">
                <User className="w-4 h-4 ml-1" />
                اسم الطبيب *
              </div>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="أدخل اسم الطبيب الكامل"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          {/* التخصص */}
          <div className="space-y-2">
            <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">
              <div className="flex items-center">
                <Stethoscope className="w-4 h-4 ml-1" />
                التخصص *
              </div>
            </label>
            <select
              id="specialty"
              name="specialty"
              value={formData.specialty}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.specialty ? 'border-red-500' : 'border-gray-300'
                }`}
            >
              <option value="">اختر التخصص</option>
              {(specialties && specialties.length > 0 ? specialties : []).map((spec, index) => (
                <option key={spec || `specialty-${index}`} value={spec}>{spec}</option>
              ))}
            </select>
            {errors.specialty && <p className="text-red-500 text-sm">{errors.specialty}</p>}
          </div>

          {/* البريد الإلكتروني */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              <div className="flex items-center">
                <Mail className="w-4 h-4 ml-1" />
                البريد الإلكتروني *
              </div>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="example@clinic.com"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>

          {/* الهاتف */}
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              <div className="flex items-center">
                <Phone className="w-4 h-4 ml-1" />
                رقم الهاتف *
              </div>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="+201234567890"
            />
            {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
          </div>

          {/* الخبرة */}
          <div className="space-y-2">
            <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 ml-1" />
                سنوات الخبرة
              </div>
            </label>
            <input
              type="number"
              id="experience"
              name="experience"
              min="0"
              max="50"
              value={formData.experience}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.experience ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="عدد السنوات"
            />
            {errors.experience && <p className="text-red-500 text-sm">{errors.experience}</p>}
          </div>

          {/* المؤهلات */}
          <div className="space-y-2">
            <label htmlFor="qualification" className="block text-sm font-medium text-gray-700">
              <div className="flex items-center">
                <Award className="w-4 h-4 ml-1" />
                المؤهلات العلمية
              </div>
            </label>
            <input
              type="text"
              id="qualification"
              name="qualification"
              value={formData.qualification}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="المؤهلات والشهادات"
            />
          </div>

          {/* سعر الكشف */}
          <div className="space-y-2">
            <label htmlFor="consultation_fee" className="block text-sm font-medium text-gray-700">
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 ml-1" />
                سعر الكشف (جنيه مصري)
              </div>
            </label>
            <input
              type="number"
              id="consultation_fee"
              name="consultation_fee"
              min="0"
              step="0.01"
              value={formData.consultation_fee}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.consultation_fee ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="0.00"
            />
            {errors.consultation_fee && <p className="text-red-500 text-sm">{errors.consultation_fee}</p>}
          </div>

          {/* حالة التوفر */}
          <div className="space-y-2">
            <label htmlFor="is_available" className="block text-sm font-medium text-gray-700">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 ml-1" />
                حالة التوفر
              </div>
            </label>
            <select
              id="is_available"
              name="is_available"
              value={formData.is_available}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="1">متاح للحجز</option>
              <option value="0">غير متاح</option>
            </select>
          </div>
        </div>

        {/* صورة الطبيب */}
        <div className="mb-6">
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center">
              <ImageIcon className="w-4 h-4 ml-1" />
              صورة الطبيب (رابط)
            </div>
          </label>
          <input
            type="url"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="https://example.com/doctor-image.jpg"
          />
        </div>

        {/* السيرة الذاتية */}
        <div className="mb-8">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center">
              <FileText className="w-4 h-4 ml-1" />
              نبذة عن الطبيب
            </div>
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            value={formData.bio}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="أدخل نبذة مختصرة عن الطبيب وخبراته..."
          />
        </div>

        {/* أزرار */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/doctors')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={updating}
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={updating}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                جاري التحديث...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                حفظ التعديلات
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}