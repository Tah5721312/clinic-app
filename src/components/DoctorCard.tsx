import Link from 'next/link';
import { Doctor } from '@/lib/types';

interface DoctorCardProps {
  doctor: Doctor;
}

export default function DoctorCard({ doctor }: DoctorCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {doctor.image && (
        <img 
          src={doctor.image} 
          alt={doctor.name}
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{doctor.name}</h3>
        <p className="text-blue-600 font-medium mb-2">{doctor.specialty}</p>
        
        <div className="space-y-1 text-sm text-gray-600">
          <p>
            <span className="font-medium">البريد الإلكتروني:</span> {doctor.email}
          </p>
          <p>
            <span className="font-medium">الهاتف:</span> {doctor.phone}
          </p>
          {doctor.experience && (
            <p>
              <span className="font-medium">سنوات الخبرة:</span> {doctor.experience}
            </p>
          )}
        </div>
        
        {doctor.bio && (
          <p className="mt-3 text-gray-700 line-clamp-3">{doctor.bio}</p>
        )}
        
        <div className="mt-4 flex justify-between">
          <Link 
            href={`/doctors/${doctor.doctor_id}`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            عرض التفاصيل
          </Link>
          <Link 
            href={`/appointments/new?doctorId=${doctor.doctor_id}`}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
          >
            حجز موعد
          </Link>
        </div>
      </div>
    </div>
  );
}