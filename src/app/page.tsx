import { cookies } from 'next/headers';
import { verifyTokenForPage } from '@/lib/verifyToken';
import { redirect } from 'next/navigation';
import UserInfoCard from '@/components/UserInfoCard';
import Dashboard from '@/components/Dashboard';
import { Calendar, Stethoscope, Users } from 'lucide-react';

export default async function HomePage() {
 
 
  const cookieStore = cookies();
  const token = (await cookieStore).get('jwtToken')?.value;
  const user = token ? verifyTokenForPage(token) : null;
  
  if (!user) {
    redirect('/login');
  }

  // (اختياري) جلب البيانات الكاملة
  let fullUserData = null;
  try {
    const res = await fetch(`http://localhost:3000/api/users/profile/${user.id}`, {
      cache: 'no-store',
      headers: { Cookie: `jwtToken=${token}` },
    });
    if (res.ok) {
      fullUserData = await res.json();
    }
  } catch (error) {
    console.error('Error:', error);
  }

  return (
    <div className="container mx-auto px-4 py-8">

      {/*  محتوى الصفحة */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome To The Clinic Created by Mohamed Abdelftah
        </h1>
        <p className="text-gray-600 mt-2">
          Overview of your clinic's key statistics
        </p>
      </div>

      {/* استخدام الـ Component */}
      <UserInfoCard user={user} fullUserData={fullUserData} />

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/patients" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="text-blue-500 mr-3" size={24} />
            <div>
              <h3 className="font-medium text-gray-900">Manage Patients</h3>
              <p className="text-sm text-gray-600">View and manage patient records</p>
            </div>
          </a>

          <a href="/doctors" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Stethoscope className="text-green-500 mr-3" size={24} />
            <div>
              <h3 className="font-medium text-gray-900">Manage Doctors</h3>
              <p className="text-sm text-gray-600">View and manage doctor profiles</p>
            </div>
          </a>

          <a href="/appointments" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="text-purple-500 mr-3" size={24} />
            <div>
              <h3 className="font-medium text-gray-900">Manage Appointments</h3>
              <p className="text-sm text-gray-600">Schedule and manage appointments</p>
            </div>
          </a>
        </div>
      </div>

      {/* <Dashboard /> */}
    </div>
  );
}