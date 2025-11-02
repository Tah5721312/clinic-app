'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, User, Mail, Phone, Stethoscope, Award, Calendar, ImageIcon, FileText, Save, ArrowLeft, Camera, X, Upload } from 'lucide-react';
import { useSpecialties } from '@/hooks/useApiData';
import { DOMAIN } from '@/lib/constants';
import { toastSuccess } from '@/lib/toast';

// File Path Input Component
interface FilePathInputProps {
  onFileSelect: (fileName: string, filePath: string) => void;
  currentFileName?: string;
}

function FilePathInput({ onFileSelect, currentFileName }: FilePathInputProps) {
  const [fileName, setFileName] = useState(currentFileName || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setSelectedFile(file);

      // Generate a simple file path (you can customize this)
      const filePath = `/images/${file.name}`;
      onFileSelect(file.name, filePath);
    }
  };

  const clearFile = () => {
    setFileName('');
    setSelectedFile(null);
    onFileSelect('', '');
  };

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        id="doctorFileInput"
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* File selection area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
        {fileName ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center text-green-600">
              <ImageIcon className="w-8 h-8 mr-2" />
              <span className="font-medium">تم اختيار الملف</span>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-green-800">{fileName}</p>
              <p className="text-xs text-green-600">المسار: /images/{fileName}</p>
            </div>

            <div className="flex justify-center space-x-2">
              <label
                htmlFor="doctorFileInput"
                className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 cursor-pointer transition-colors"
              >
                تغيير الملف
              </label>
              <button
                type="button"
                onClick={clearFile}
                className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-gray-600 mb-2">اختر صورة الطبيب</p>
              <label
                htmlFor="doctorFileInput"
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors"
              >
                <Camera className="w-4 h-4 mr-2" />
                اختيار ملف
              </label>
            </div>
            <p className="text-xs text-gray-500">
              سيتم حفظ مسار الملف في قاعدة البيانات
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AddDoctorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFilePath, setSelectedFilePath] = useState('');

    // ✅ جلب التخصصات من قاعدة البيانات
  const { data: specialties, loading: specialtiesLoading, error: specialtiesError } = useSpecialties();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    experience: '',
    qualification: '',
    image: '', // This will store the file path, not base64
    bio: '',
    consultation_fee: '',
    is_available: '1'
  });

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

  const handleFileSelect = (fileName: string, filePath: string) => {
    setSelectedFileName(fileName);
    setSelectedFilePath(filePath);

    // Update form data with the file path (not base64)
    setFormData(prev => ({ ...prev, image: filePath }));

    console.log('File selected:', { fileName, filePath });
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

    setLoading(true);

    try {
      const response = await fetch(`${DOMAIN}/api/doctors`, {
        method: 'POST',
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
          image: selectedFilePath || formData.image || null, // Send file path only
          bio: formData.bio || null,
          consultation_fee: formData.consultation_fee ? Number(formData.consultation_fee) : 0,
          is_available: Number(formData.is_available)
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toastSuccess('تم إضافة الطبيب بنجاح!');
        router.push('/doctors');
      } else {
        if (result.error === 'Duplicate entry') {
          setErrors({ general: 'هذا الطبيب مسجل بالفعل (البريد الإلكتروني أو الهاتف مستخدم مسبقاً)' });
        } else {
          setErrors({ general: result.details || 'حدث خطأ أثناء إضافة الطبيب' });
        }
      }
    } catch (error) {
      setErrors({ general: 'فشل في الاتصال بالخادم' });
    } finally {
      setLoading(false);
    }
  };
  // ✅ عرض رسالة خطأ إذا فشل تحميل التخصصات
  if (specialtiesError) {
    console.error('Error loading specialties:', specialtiesError);
  }

  // ✅ تحديد التخصصات المتاحة - من قاعدة البيانات أو fallback
  const availableSpecialties = specialties || [];


  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* رأس الصفحة */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 ml-1" />
          رجوع
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">إضافة طبيب جديد</h1>
        <p className="text-gray-600">أدخل معلومات الطبيب لإضافته إلى النظام</p>
      </div>

      {/* نموذج الإضافة */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        {errors.general && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
            {errors.general}
          </div>
        )}

   {/* ✅ عرض رسالة تحذير إذا فشل تحميل التخصصات */}
        {specialtiesError && (
          <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg mb-6 border border-yellow-200">
            تعذر تحميل التخصصات من قاعدة البيانات. يرجى المحاولة مرة أخرى.
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

               {/* ✅ عرض عدد التخصصات المحملة */}
            {!specialtiesLoading && availableSpecialties.length > 0 && (
              <p className="text-xs text-green-600">
                تم تحميل {availableSpecialties.length} تخصص من قاعدة البيانات
              </p>
            )}
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
                <Award className="w-4 h-4 ml-1" />
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

        {/* صورة الطبيب - File Path Only */}
        <div className="mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center">
                <ImageIcon className="w-4 h-4 ml-1" />
                صورة الطبيب
              </div>
            </label>
            <p className="text-sm text-gray-500 mb-3">
              اختر صورة من جهازك - سيتم حفظ مسار الملف فقط في قاعدة البيانات
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File Path Input */}
            <div>
              <FilePathInput
                onFileSelect={handleFileSelect}
                currentFileName={selectedFileName}
              />
            </div>

            {/* URL Input Alternative */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                أو أدخل رابط الصورة
              </label>
              <input
                type="url"
                id="image"
                name="image"
                value={selectedFilePath ? '' : formData.image}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="https://example.com/doctor.jpg"
                disabled={!!selectedFilePath}
              />
              <p className="text-xs text-gray-500">
                {selectedFilePath ? 'تم اختيار ملف من الجهاز' : 'أو ألصق رابط الصورة هنا'}
              </p>
            </div>
          </div>
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
            disabled={loading}
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                حفظ الطبيب
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}