import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import UserInfoCard from '@/components/UserInfoCard';
import HomePageClient from '@/components/HomePageClient';
import { Calendar, Stethoscope, Users } from 'lucide-react';


export default async function HomePage() {

  const session = await auth();
  const userFromSession = session?.user as any;
  
  if (!userFromSession) {
    redirect('/login');
  }

  // (اختياري) جلب البيانات الكاملة
  let fullUserData = null;
  const user = {
    id: userFromSession.id,
    username: userFromSession.name,
    isAdmin: userFromSession.isAdmin,
  } as any;
  const userId = userFromSession.id;

  // الحصول على الدور من الـ cookies
  const cookieStore = await cookies();
  const role = cookieStore.get('role')?.value;

  try {
    const cookieHeader = (await cookieStore).toString();
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/users/profile/${user.id}`, {
      cache: 'no-store',
      headers: { Cookie: cookieHeader },
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
        <h1 className="text-3xl font-bold   ">
          Welcome To The Clinic Created by Mohamed Abdelftah
        </h1>
        <p className=" mt-2">
          Overview of your clinic's key statistics
        </p>
      </div>

      {/* استخدام الـ Component */}
      <UserInfoCard user={user} fullUserData={fullUserData} />


      {/* Interactive client component */}
      <HomePageClient userId={userId} role={role} />

    </div>
  );
}