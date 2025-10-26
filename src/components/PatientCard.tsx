import { Calendar, Mail, Phone, User, MapPin, Briefcase, AlertCircle, Pill, Heart, FileText } from 'lucide-react';
import Link from 'next/link';

import { Patient } from '@/lib/types';

interface PatientCardProps {
  patient: Patient;
}

export default function PatientCard({ patient }: PatientCardProps) {
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'غير معروف';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // التحقق من صحة التاريخ
    if (isNaN(dateObj.getTime())) return 'تاريخ غير صحيح';

    return dateObj.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth: Date | string | null | undefined) => {
    if (!dateOfBirth) return 'غير معروف';

    const today = new Date();
    const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;

    // التحقق من صحة التاريخ
    if (isNaN(birthDate.getTime())) return 'تاريخ غير صحيح';

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const getGenderText = (gender: string | null | undefined) => {
    if (!gender) return '';
    return gender.toLowerCase() === 'male' ? 'ذكر' : 
           gender.toLowerCase() === 'female' ? 'أنثى' : gender;
  };

  return (
    <div className='card rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100'>
      <div className='p-6'>
        {/* Header with avatar and basic info */}
        <div className='flex items-start gap-4 mb-5'>
          <div className='bg-blue-100 rounded-full p-3 flex-shrink-0'>
            <User className='w-6 h-6 text-blue-600' />
          </div>
          <div className='flex-1'>
            <h3 className='text-xl font-bold text-gray-800 mb-1 text-right'>
              {patient.NAME}
            </h3>
            <p className='text-gray-600 text-sm text-right'>
              {getGenderText(patient.GENDER)} • عمره {calculateAge(patient.DATEOFBIRTH)} سنة
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className='space-y-3 mb-5'>
          <div className='flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg'>
            <div className='flex items-center'>
              <Mail className='w-4 h-4 ml-2 text-blue-500' />
              <span className='text-gray-500'>البريد الإلكتروني</span>
            </div>
            <span className='text-gray-800'>{patient.EMAIL}</span>
          </div>
          
          <div className='flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg'>
            <div className='flex items-center'>
              <Phone className='w-4 h-4 ml-2 text-green-500' />
              <span className='text-gray-500'>رقم الهاتف</span>
            </div>
            <span dir="ltr" className='text-gray-800'>{patient.PHONE}</span>
          </div>
          
          <div className='flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg'>
            <div className='flex items-center'>
              <Calendar className='w-4 h-4 ml-2 text-purple-500' />
              <span className='text-gray-500'>تاريخ الميلاد</span>
            </div>
            <span className='text-gray-800'>{formatDate(patient.DATEOFBIRTH)}</span>
          </div>
        </div>

        {/* Additional Info */}
        {(patient.ADDRESS || patient.OCCUPATION) && (
          <div className='border-t pt-4 mb-4'>
            {patient.ADDRESS && (
              <div className='flex items-center justify-between text-sm text-gray-600 mb-2'>
                <div className='flex items-center'>
                  <MapPin className='w-4 h-4 ml-2 text-amber-500' />
                  <span className='text-gray-500'>العنوان</span>
                </div>
                <span className='text-gray-800 text-right'>{patient.ADDRESS}</span>
              </div>
            )}
            {patient.OCCUPATION && (
              <div className='flex items-center justify-between text-sm text-gray-600'>
                <div className='flex items-center'>
                  <Briefcase className='w-4 h-4 ml-2 text-indigo-500' />
                  <span className='text-gray-500'>المهنة</span>
                </div>
                <span className='text-gray-800'>{patient.OCCUPATION}</span>
              </div>
            )}
          </div>
        )}

        {/* Medical Info */}
        {(patient.ALLERGIES || patient.CURRENTMEDICATION) && (
          <div className='border-t pt-4 mb-4'>
            {patient.ALLERGIES && (
              <div className='flex items-start justify-between text-sm text-gray-600 mb-2'>
                <div className='flex items-start'>
                  <AlertCircle className='w-4 h-4 ml-2 text-red-500 mt-0.5' />
                  <span className='text-gray-500'>الحساسية</span>
                </div>
                <span className='text-gray-800 text-right'>{patient.ALLERGIES}</span>
              </div>
            )}
            {patient.CURRENTMEDICATION && (
              <div className='flex items-start justify-between text-sm text-gray-600'>
                <div className='flex items-start'>
                  <Pill className='w-4 h-4 ml-2 text-blue-500 mt-0.5' />
                  <span className='text-gray-500'>الأدوية الحالية</span>
                </div>
                <span className='text-gray-800 text-right'>{patient.CURRENTMEDICATION}</span>
              </div>
            )}
          </div>
        )}

        {/* Emergency Contact */}
        {(patient.EMERGENCYCONTACTNAME || patient.EMERGENCYCONTACTNUMBER) && (
          <div className='border-t pt-4 mb-4'>
            <div className='flex items-center mb-2 text-sm font-medium text-gray-700'>
              <Heart className='w-4 h-4 ml-2 text-red-500' />
              جهة الاتصال في الطوارئ
            </div>
            {patient.EMERGENCYCONTACTNAME && (
              <p className='text-sm text-gray-600 mb-1 text-right'>{patient.EMERGENCYCONTACTNAME}</p>
            )}
            {patient.EMERGENCYCONTACTNUMBER && (
              <p dir="ltr" className='text-sm text-gray-600 text-right'>{patient.EMERGENCYCONTACTNUMBER}</p>
            )}
          </div>
        )}

        {/* Insurance Info */}
        {(patient.INSURANCEPROVIDER || patient.INSURANCEPOLICYNUMBER) && (
          <div className='border-t pt-4 mb-4'>
            <div className='flex items-center mb-2 text-sm font-medium text-gray-700'>
              <FileText className='w-4 h-4 ml-2 text-green-500' />
              معلومات التأمين
            </div>
            {patient.INSURANCEPROVIDER && (
              <p className='text-sm text-gray-600 mb-1 text-right'>{patient.INSURANCEPROVIDER}</p>
            )}
            {patient.INSURANCEPOLICYNUMBER && (
              <p className='text-sm text-gray-600 text-right'>{patient.INSURANCEPOLICYNUMBER}</p>
            )}
          </div>
        )}

        {/* Primary Physician */}
        {patient.PRIMARYPHYSICIANNAME && (
          <div className='border-t pt-4 mb-4'>
            <p className='text-sm text-gray-600'>
              <span className='font-medium text-gray-700'>الطبيب المعالج:</span>{' '}
              <span className='text-right'>{patient.PRIMARYPHYSICIANNAME}</span>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex justify-between items-center pt-4 border-t gap-3'>
          <Link
            href={`/patients/${patient.PATIENT_ID}`}
            className='text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors px-4 py-2 rounded-lg hover:bg-blue-50 border border-blue-200 flex-1 text-center'
          >
            الملف الشخصي
          </Link>
          <Link
            href={`/appointments/new?patientId=${patient.PATIENT_ID}`}
            className='bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex-1 text-center shadow-md hover:shadow-lg'
          >
            حجز موعد
          </Link>
        </div>
      </div>
    </div>
  );
}