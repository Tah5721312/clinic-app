'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Doctor, Appointment } from '@/lib/types';
import { Camera, X, Upload, Trash2, Edit, DollarSign, CheckCircle, XCircle, CreditCard, Calendar, Clock, User, Stethoscope } from 'lucide-react';
import { DOMAIN } from '@/lib/constants';
import { Can } from '@/components/Can';
import DoctorScheduleManager from '@/components/DoctorScheduleManager';
import { toastError, toastSuccess, toastWarning } from '@/lib/toast';

// Image Edit Modal Component
interface ImageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage?: string;
  doctorName: string;
  onImageUpdate: (newImagePath: string) => void;
}

function ImageEditModal({ isOpen, onClose, currentImage, doctorName, onImageUpdate }: ImageEditModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setUrlInput(''); // Clear URL input when file is selected
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value);
    if (e.target.value) {
      setSelectedFile(null);
      setPreviewUrl('');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let newImagePath = '';
      
      if (selectedFile) {
        // Generate file path for uploaded file
        newImagePath = `/images/${selectedFile.name}`;
      } else if (urlInput) {
        // Use URL input
        newImagePath = urlInput;
      }

      if (newImagePath) {
        onImageUpdate(newImagePath);
        onClose();
      }
    } catch (error) {
      console.error('Error updating image:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearImage = () => {
    onImageUpdate(''); // Set empty image path
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">تعديل صورة الطبيب</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">الطبيب: {doctorName}</p>
          
          {/* Current Image */}
          {currentImage && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">الصورة الحالية:</p>
              <img 
                src={currentImage} 
                alt={doctorName}
                className="w-20 h-20 object-cover rounded-full border-2 border-gray-300"
              />
            </div>
          )}
        </div>

        {/* File Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">اختيار صورة جديدة:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          
          {previewUrl && (
            <div className="mt-2">
              <p className="text-sm font-medium mb-1">معاينة:</p>
              <img 
                src={previewUrl} 
                alt="Preview"
                className="w-20 h-20 object-cover rounded-full border-2 border-blue-300"
              />
            </div>
          )}
        </div>

        {/* URL Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">أو أدخل رابط الصورة:</label>
          <input
            type="url"
            value={urlInput}
            onChange={handleUrlChange}
            placeholder="https://example.com/doctor-image.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={!!selectedFile}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-between gap-2">
          <button
            onClick={handleClearImage}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
          >
            حذف الصورة
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={loading || (!selectedFile && !urlInput)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const doctorId = params.id as string;
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [showImageModal, setShowImageModal] = useState(false);

  // Check if current user can edit this doctor's image
  const canEditImage = () => {
    if (!session?.user) return false;
    
    const currentUserId = (session.user as any)?.id;
    const isAdmin = (session.user as any)?.isAdmin;
    const isGuest = (session.user as any)?.isGuest;
    
    // Admin can edit any doctor's image
    if (isAdmin) return true;
    
    // Guest cannot edit any image
    if (isGuest) return false;
    
    // Doctor can only edit their own image
    // Note: This assumes the doctor's user ID matches the doctor ID
    // You might need to adjust this logic based on your data structure
    return currentUserId === doctorId;
  };

  // Check if current user can edit this doctor's data
  const canEditDoctorData = () => {
    if (!session?.user) return false;
    
    const currentUserId = (session.user as any)?.id;
    const isAdmin = (session.user as any)?.isAdmin;
    const isGuest = (session.user as any)?.isGuest;
    
    // Admin can edit any doctor's data
    if (isAdmin) return true;
    
    // Guest cannot edit any doctor's data
    if (isGuest) return false;
    
    // Doctor can only edit their own data
    return currentUserId === doctorId;
  };

  // Check if current user can delete this doctor
  const canDeleteDoctor = () => {
    if (!session?.user) return false;
    
    const isAdmin = (session.user as any)?.isAdmin;
    const isGuest = (session.user as any)?.isGuest;
    
    // Only admin can delete doctors
    if (isAdmin) return true;
    
    // Guest and doctors cannot delete doctors
    return false;
  };

  // Check if current user can view this doctor's schedule
  const canViewSchedule = () => {
    if (!session?.user) return false;
    
    const currentUserId = (session.user as any)?.id;
    const isAdmin = (session.user as any)?.isAdmin;
    const isGuest = (session.user as any)?.isGuest;
    
    // Admin can view any doctor's schedule
    if (isAdmin) return true;
    
    // Guest cannot view any schedule
    if (isGuest) return false;
    
    // Doctor can only view their own schedule
    return currentUserId === doctorId;
  };
  const [deletingAppointment, setDeletingAppointment] = useState<number | null>(null);

  useEffect(() => {
    if (doctorId) {
      fetchDoctor();
      fetchDoctorAppointments();
    }
  }, [doctorId]);

  const fetchDoctor = async () => {
    try {
      const response = await fetch(`${DOMAIN}/api/doctors/${doctorId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch doctor details');
      }
      const data = await response.json();
      setDoctor(data);
    } catch (err) {
      setError('حدث خطأ أثناء جلب بيانات الطبيب');
      console.error('Error fetching doctor:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorAppointments = async () => {
    try {
      const response = await fetch(`${DOMAIN}/api/appointments?doctorId=${doctorId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      const data = await response.json();
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  const handleImageUpdate = async (newImagePath: string) => {
    try {
      const response = await fetch(`${DOMAIN}/api/doctors/${doctorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: newImagePath
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update image');
      }

      // Update local state
      setDoctor(prev => prev ? { ...prev, IMAGE: newImagePath } : null);
      
      // Show success message
      toastSuccess('تم تحديث الصورة بنجاح!');
      
    } catch (error) {
      console.error('Error updating image:', error);
      toastError('حدث خطأ أثناء تحديث الصورة');
    }
  };

  // Enhanced handleDelete function for doctor deletion
  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا الطبيب؟')) return;
    
    try {
      const response = await fetch(`${DOMAIN}/api/doctors/${doctorId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      // Check if deletion was blocked due to constraints
      if (data.cannotDelete) {
        toastWarning(data.message); // Show constraint message in modal
        return; // Exit without error
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete doctor');
      }
      
      toastSuccess('تم حذف الطبيب بنجاح');
      router.push('/doctors');
      
    } catch (err: any) {
      console.error('Error deleting doctor:', err);
      toastError('حدث خطأ أثناء حذف الطبيب');
    }
  };

  // New function to handle appointment deletion
  const handleDeleteAppointment = async (appointmentId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموعد؟')) return;
    
    setDeletingAppointment(appointmentId);
    
    try {
      const response = await fetch(`${DOMAIN}/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete appointment');
      }
      
      // Remove appointment from local state
      setAppointments(prev => prev.filter(apt => apt.APPOINTMENT_ID !== appointmentId));
      toastSuccess('تم حذف الموعد بنجاح');
      
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toastError('حدث خطأ أثناء حذف الموعد');
    } finally {
      setDeletingAppointment(null);
    }
  };

  // Helper function to get initials for fallback avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper functions for appointment display
  const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-blue-100 text-blue-800';
      case 'follow_up': return 'bg-green-100 text-green-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentTypeText = (type: string) => {
    switch (type) {
      case 'consultation': return 'استشارة';
      case 'follow_up': return 'متابعة';
      case 'emergency': return 'طوارئ';
      default: return type;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'مدفوع';
      case 'partial': return 'مدفوع جزئياً';
      case 'unpaid': return 'غير مدفوع';
      case 'refunded': return 'مسترد';
      default: return status;
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500 text-white',
      'bg-blue-500 text-white',
      'bg-green-500 text-white',
      'bg-purple-500 text-white',
      'bg-orange-500 text-white',
      'bg-teal-500 text-white',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">جاري تحميل البيانات...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        {error}
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">الطبيب غير موجود</h2>
        <Link href="/doctors" className="text-blue-600 hover:underline">
          العودة إلى قائمة الأطباء
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Image Edit Modal */}
      <ImageEditModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        currentImage={doctor.IMAGE ?? undefined}
        doctorName={doctor.NAME}
        onImageUpdate={handleImageUpdate}
      />

      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">تفاصيل الطبيب</h2>
          <p className="">معلومات كاملة عن الطبيب وجدول المواعيد</p>
        </div>
        <div className="flex gap-2">

          {canEditDoctorData() && (
            <Link
              href={`/doctors/${doctorId}/edit`}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              تعديل البيانات
            </Link>
          )}

            {canDeleteDoctor() && (
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                حذف الطبيب
              </button>
            )}

          <Link
            href="/doctors"
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            رجوع
          </Link>

        </div>
      </div>

      {/* معلومات الطبيب */}
      <div className="card rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Doctor Image - Clickable */}
            <div className="flex-shrink-0">
              <div
              onClick={() => {
                if (canEditImage()) {
                  setShowImageModal(true);
                }
              }}
                className={`relative group w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100 ${canEditImage() ? 'cursor-pointer group-hover:border-blue-300' : 'cursor-default'} transition-colors`}
              >
                {doctor.IMAGE ? (
                  <img
                    src={doctor.IMAGE}
                    alt={doctor.NAME}
                    className="w-full h-full object-cover"
                  />
                ) : 
              
                (
                  <div className={`w-full h-full rounded-full transition-colors flex items-center justify-center text-2xl font-bold ${getAvatarColor(doctor.NAME)}`}>
                    {getInitials(doctor.NAME)}
                  </div>
                )
                }
                
                {/* Camera overlay on hover - Only show if user can edit */}
                {canEditImage() && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                )}
                
                {/* Edit hint - Only show if user can edit */}
                {canEditImage() && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      اضغط لتغيير الصورة
                    </div> */}
                  </div>
                )}

              </div>
            </div>
            
            <div className="flex-grow">
              <h3 className="card-title text-2xl font-bold mb-2">{doctor.NAME}</h3>
              <p className="text-blue-600 font-medium text-lg mb-4">{doctor.SPECIALTY}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <p className="text-gray-600">
                    <span className="font-medium">DOCTOR_ID :</span> {doctor.DOCTOR_ID}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">البريد الإلكتروني:</span> {doctor.EMAIL}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">الهاتف:</span> {doctor.PHONE}
                  </p>
                  {doctor.EXPERIENCE && (
                    <p className="text-gray-600">
                      <span className="font-medium">سنوات الخبرة:</span> {doctor.EXPERIENCE}
                    </p>
                  )}
                </div>
                <div>
                  {doctor.QUALIFICATION && (
                    <p className="text-gray-600">
                      <span className="font-medium">المؤهلات:</span> {doctor.QUALIFICATION}
                    </p>
                  )}
                  
                  {/* Consultation Fee */}
                  {doctor.CONSULTATION_FEE && doctor.CONSULTATION_FEE > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <p className="text-gray-600">
                        <span className="font-medium">سعر الكشف:</span> 
                        <span className="text-green-600 font-semibold mr-1">
                          {doctor.CONSULTATION_FEE} جنيه مصري
                        </span>
                      </p>
                    </div>
                  )}
                  
                  {/* Availability Status */}
                  <div className="flex items-center gap-2 mt-2">
                    {doctor.IS_AVAILABLE === 1 ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-medium">متاح للحجز</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-red-600 font-medium">غير متاح</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {doctor.BIO && (
                <div className="mt-4">
                  <p className="card-title font-medium mb-2">السيرة الذاتية:</p>
                  <p className="card-title">{doctor.BIO}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* التبويبات */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent card-text'
            }`}
          >
            التفاصيل
          </button>
          {canViewSchedule() && (
          <button
            onClick={() => setActiveTab('appointments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'appointments'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent card-text'
            }`}
          >
            المواعيد ({appointments.length})
          </button>
          )}
          {canViewSchedule() && (
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedule'
                ? 'border-orange-500 text-orange-400'
                  : 'border-transparent card-text'
              }`}
            >
              الجدول الزمني
            </button>
          )}
        </nav>
      </div>

      {/* محتوى التبويبات */}
      {activeTab === 'details' && (
        <div className="card rounded-lg shadow-md p-6">
          <h3 className="card-title text-xl font-bold mb-4">معلومات الاتصال</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">
                <span className="font-medium">البريد الإلكتروني:</span> {doctor.EMAIL}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">الهاتف:</span> {doctor.PHONE}
              </p>
            </div>
            <div>
              {doctor.EXPERIENCE && (
                <p className="text-gray-600">
                  <span className="font-medium">سنوات الخبرة:</span> {doctor.EXPERIENCE}
                </p>
              )}
              {doctor.QUALIFICATION && (
                <p className="text-gray-600">
                  <span className="font-medium">المؤهلات:</span> {doctor.QUALIFICATION}
                </p>
              )}
              
              {/* Consultation Fee */}
              {doctor.CONSULTATION_FEE && doctor.CONSULTATION_FEE > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <p className="text-gray-600">
                    <span className="font-medium">سعر الكشف:</span> 
                    <span className="text-green-600 font-semibold mr-1">
                      {doctor.CONSULTATION_FEE} جنيه مصري
                    </span>
                  </p>
                </div>
              )}
              
              {/* Availability Status */}
              <div className="flex items-center gap-2 mt-2">
                {doctor.IS_AVAILABLE === 1 ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">متاح للحجز</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-600 font-medium">غير متاح</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {doctor.BIO && (
            <div className="mt-6">
              <h4 className="card-title text-lg font-medium mb-2">السيرة الذاتية</h4>
              <p className="text-gray-700">{doctor.BIO}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="card rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="card-title text-xl font-bold">
                مواعيد الطبيب 
                <span className="text-sm text-gray-500 mr-2">({appointments.length} مواعيد)</span>
              </h3>

              <Can do="create" on="Appointment">
              <Link
                href={`/appointments/new?doctorId=${doctorId}`}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                حجز موعد جديد
              </Link>
              </Can>

            </div>

            {/* Appointment Statistics */}
            {appointments.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">إجمالي المواعيد</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{appointments.length}</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">مجدولة</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {appointments.filter(apt => apt.STATUS === 'scheduled').length}
                  </p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">قيد الانتظار</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">
                    {appointments.filter(apt => apt.STATUS === 'pending').length}
                  </p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-800">ملغية</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900 mt-1">
                    {appointments.filter(apt => apt.STATUS === 'cancelled').length}
                  </p>
                </div>
              </div>
            )}

            {/* Payment Statistics */}
            {appointments.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">مدفوعة</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {appointments.filter(apt => apt.PAYMENT_STATUS === 'paid').length}
                  </p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">مدفوعة جزئياً</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">
                    {appointments.filter(apt => apt.PAYMENT_STATUS === 'partial').length}
                  </p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-800">غير مدفوعة</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900 mt-1">
                    {appointments.filter(apt => apt.PAYMENT_STATUS === 'unpaid').length}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-800">إجمالي المبالغ</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {appointments
                      .filter(apt => apt.PAYMENT_AMOUNT && apt.PAYMENT_AMOUNT > 0)
                      .reduce((sum, apt) => sum + (apt.PAYMENT_AMOUNT || 0), 0)
                    } جنيه
                  </p>
                </div>
              </div>
            )}
            
            {appointments.length > 0 ? (
              <>
                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.APPOINTMENT_ID}
                      className="rounded-lg border border-gray-200 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <p className="text-sm text-gray-500">المريض</p>
                          </div>
                          <p className="text-base font-semibold text-gray-900">
                            {appointment.PATIENT_NAME}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full h-fit
                            ${appointment.STATUS === 'scheduled' ? 'bg-green-100 text-green-800' : ''}
                            ${appointment.STATUS === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${appointment.STATUS === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                          `}>
                            {appointment.STATUS === 'scheduled' && 'مجدول'}
                            {appointment.STATUS === 'pending' && 'قيد الانتظار'}
                            {appointment.STATUS === 'cancelled' && 'ملغي'}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getAppointmentTypeColor(appointment.APPOINTMENT_TYPE || 'consultation')}`}>
                            {getAppointmentTypeText(appointment.APPOINTMENT_TYPE || 'consultation')}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            <p className="text-sm text-gray-500">التاريخ</p>
                          </div>
                          <p className="text-sm text-gray-900">
                            {new Date(appointment.SCHEDULE).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <p className="text-sm text-gray-500">الوقت</p>
                          </div>
                          <p className="text-sm text-gray-900">
                            {new Date(appointment.SCHEDULE).toLocaleTimeString('ar-SA')}
                          </p>
                        </div>
                      </div>

                      {/* Payment Information */}
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">حالة الدفع:</span>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(appointment.PAYMENT_STATUS || 'unpaid')}`}>
                            {getPaymentStatusText(appointment.PAYMENT_STATUS || 'unpaid')}
                          </span>
                        </div>
                        {appointment.PAYMENT_AMOUNT && appointment.PAYMENT_AMOUNT > 0 ? (
                          <div className="flex items-center gap-2 mt-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-600">المبلغ:</span>
                            <span className="text-sm font-semibold text-green-600">
                              {appointment.PAYMENT_AMOUNT} جنيه مصري
                            </span>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <span className="text-sm text-gray-500">لا يوجد مبلغ</span>
                          </div>
                        )}
                      </div>

                      {appointment.REASON && (
                        <div className="mt-3">
                          <div className="flex items-center gap-1 mb-1">
                            <Stethoscope className="w-3 h-3 text-gray-500" />
                            <p className="text-sm text-gray-500">السبب</p>
                          </div>
                          <p className="text-sm text-gray-700">{appointment.REASON}</p>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-end gap-2">
                        <Link
                          href={`/appointments/${appointment.APPOINTMENT_ID}/edit`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                          title="تعديل الموعد"
                        >
                          <Edit className="w-4 h-4" />
                          تعديل
                        </Link>
                        <button
                          onClick={() => handleDeleteAppointment(appointment.APPOINTMENT_ID)}
                          disabled={deletingAppointment === appointment.APPOINTMENT_ID}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title="حذف الموعد"
                        >
                          {deletingAppointment === appointment.APPOINTMENT_ID ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block w-full">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                          المريض
                        </th>
                        <th className="px-3 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                          التاريخ والوقت
                        </th>
                        <th className="px-3 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                          نوع الموعد
                        </th>
                        <th className="px-3 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                          حالة الدفع
                        </th>
                        <th className="px-3 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                          السبب
                        </th>
                        <th className="px-3 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الحالة
                        </th>
                        <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {appointments.map((appointment) => (
                        <tr key={appointment.APPOINTMENT_ID} className="hover:bg-gray-50">
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <div className="text-sm font-medium text-gray-900 break-words">
                                {appointment.PATIENT_NAME}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <div>
                                <div className="text-sm text-gray-900">
                                  {new Date(appointment.SCHEDULE).toLocaleDateString('ar-SA')}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(appointment.SCHEDULE).toLocaleTimeString('ar-SA')}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getAppointmentTypeColor(appointment.APPOINTMENT_TYPE || 'consultation')}`}>
                              {getAppointmentTypeText(appointment.APPOINTMENT_TYPE || 'consultation')}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(appointment.PAYMENT_STATUS || 'unpaid')}`}>
                                {getPaymentStatusText(appointment.PAYMENT_STATUS || 'unpaid')}
                              </span>
                              {appointment.PAYMENT_AMOUNT && appointment.PAYMENT_AMOUNT > 0 ? (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3 text-green-600" />
                                  <span className="text-xs text-green-600 font-semibold">
                                    {appointment.PAYMENT_AMOUNT} جنيه
                                  </span>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500">لا يوجد</p>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Stethoscope className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <span className="break-words">{appointment.REASON}</span>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${appointment.STATUS === 'scheduled' ? 'bg-green-100 text-green-800' : ''}
                              ${appointment.STATUS === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                              ${appointment.STATUS === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                            `}>
                              {appointment.STATUS === 'scheduled' && 'مجدول'}
                              {appointment.STATUS === 'pending' && 'قيد الانتظار'}
                              {appointment.STATUS === 'cancelled' && 'ملغي'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className="flex gap-2">
                              <Link
                                href={`/appointments/${appointment.APPOINTMENT_ID}/edit`}
                                className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded"
                                title="تعديل الموعد"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDeleteAppointment(appointment.APPOINTMENT_ID)}
                                disabled={deletingAppointment === appointment.APPOINTMENT_ID}
                                className="text-red-600 hover:text-red-900 transition-colors p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                title="حذف الموعد"
                              >
                                {deletingAppointment === appointment.APPOINTMENT_ID ? (
                                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-4 8l-2-2m0 0l-2-2m2 2l2-2m-2 2l2 2" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg mb-4">لا توجد مواعيد لهذا الطبيب</p>
            
              <Can do="create" on="Appointment">
                <Link
                  href={`/appointments/new?doctorId=${doctorId}`}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  احجز أول موعد
                </Link>
               </Can>

              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'schedule' && canViewSchedule() && (
        <div className="card rounded-lg shadow-md p-6">
          <DoctorScheduleManager 
            doctorId={Number(doctorId)} 
            doctorName={doctor.NAME}
            canEdit={canEditDoctorData()}
          />
        </div>
      )}
    </div>
  );
}