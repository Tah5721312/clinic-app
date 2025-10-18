import Link from 'next/link';
import { Doctor } from '@/lib/types';

// استيراد أيقونات Lucide إذا كنت تستخدمها
import { User, Mail, Phone, Calendar, Award, BookOpen, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Can } from '@/components/Can';

interface DoctorCardProps {
  doctor: Doctor;
}

// دالة لإنشاء لون خلفية عشوائي بناءً على اسم الطبيب
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-purple-100 text-purple-800',
    'bg-amber-100 text-amber-800',
    'bg-rose-100 text-rose-800',
    'bg-teal-100 text-teal-800',
  ];
  const index = name.length % colors.length;
  return colors[index];
};

// دالة لاستخراج الأحرف الأولى من اسم الطبيب
const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
};

export default function DoctorCard({ doctor }: DoctorCardProps) {
  const avatarColor = getAvatarColor(doctor.NAME);
  const initials = getInitials(doctor.NAME);

  return (
    <div className='bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-100'>
      {/* Avatar Section */}
      <div className="relative bg-gradient-to-r from-blue-50 to-cyan-50 p-6 flex flex-col items-center">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold ${avatarColor} shadow-md`}>
          {doctor.IMAGE ? (
            <img 
              src={doctor.IMAGE} 
              alt={doctor.NAME}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        
        {/* Experience Badge */}
        {doctor.EXPERIENCE && (
          <div className="mt-4 bg-white px-3 py-1 rounded-full shadow-sm flex items-center text-sm font-medium text-amber-700">
            <Calendar className="w-4 h-4 ml-1" />
            {doctor.EXPERIENCE} سنة خبرة
          </div>
        )}

        {/* Availability Badge */}
        <div className={`mt-2 px-3 py-1 rounded-full shadow-sm flex items-center text-sm font-medium ${
          doctor.IS_AVAILABLE === 1 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {doctor.IS_AVAILABLE === 1 ? (
            <>
              <CheckCircle className="w-4 h-4 ml-1" />
              متاح للحجز
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 ml-1" />
              غير متاح
            </>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className='p-5'>
        <h3 className='text-xl font-bold text-gray-800 mb-2 text-center'>{doctor.NAME}</h3>
        <p className='text-blue-600 font-semibold mb-4 text-center'>{doctor.SPECIALTY}</p>

        <div className='space-y-3 text-sm text-gray-600 mb-4'>
          <div className="flex items-center bg-gray-50 p-3 rounded-lg">
            <Mail className="w-4 h-4 ml-2 text-blue-500" />
            <div className="flex-1">
              <span className='font-medium text-gray-500 block text-xs mb-1'>البريد الإلكتروني</span>
              <span className="text-gray-800">{doctor.EMAIL}</span>
            </div>
          </div>
          
          <div className="flex items-center bg-gray-50 p-3 rounded-lg">
            <Phone className="w-4 h-4 ml-2 text-green-500" />
            <div className="flex-1">
              <span className='font-medium text-gray-500 block text-xs mb-1'>رقم الهاتف</span>
              <span dir="ltr" className="text-gray-800">{doctor.PHONE}</span>
            </div>
          </div>
          
          {doctor.QUALIFICATION && (
            <div className="flex items-center bg-gray-50 p-3 rounded-lg">
              <Award className="w-4 h-4 ml-2 text-purple-500" />
              <div className="flex-1">
                <span className='font-medium text-gray-500 block text-xs mb-1'>المؤهلات</span>
                <span className="text-gray-800">{doctor.QUALIFICATION}</span>
              </div>
            </div>
          )}

          {/* Consultation Fee */}
          {doctor.CONSULTATION_FEE && doctor.CONSULTATION_FEE > 0 && (
            <div className="flex items-center bg-gray-50 p-3 rounded-lg">
              <DollarSign className="w-4 h-4 ml-2 text-green-500" />
              <div className="flex-1">
                <span className='font-medium text-gray-500 block text-xs mb-1'>سعر الكشف</span>
                <span className="text-gray-800 font-semibold">{doctor.CONSULTATION_FEE} جنيه مصري</span>
              </div>
            </div>
          )}
        </div>

        {doctor.BIO && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center mb-2">
              <BookOpen className="w-4 h-4 ml-2 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">نبذة عن الطبيب</span>
            </div>
            <p className='text-gray-700 text-sm leading-relaxed text-right'>
              {doctor.BIO}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className='mt-6 flex justify-between gap-3'>
          <Link
            href={`/doctors/${doctor.DOCTOR_ID}`}
            className='flex-1 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors px-4 py-2 rounded-lg hover:bg-blue-50 flex items-center justify-center border border-blue-200'
          >
            التفاصيل الكاملة
          </Link>
          <Can do="create" on="Appointment">  
          <Link
            href={`/appointments/new?doctorId=${doctor.DOCTOR_ID}`}
            className='flex-1 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center shadow-md hover:shadow-lg'
          >
            حجز موعد
          </Link>
          </Can>
        </div>
      </div>
    </div>
  );
}