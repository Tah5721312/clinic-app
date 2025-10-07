'use client';

import { useRouter, useParams } from 'next/navigation';
import { Can } from '@/components/Can';
import { useAbility } from '@/contexts/AbilityContext';
import RoleDebugger from '@/components/RoleDebugger';

interface HomePageClientProps {
  userId: string;
  role?: string;
}

export default function HomePageClient({ userId, role }: HomePageClientProps) {
  const router = useRouter();
  const params = useParams();
  const ability = useAbility();

  return (
    <>
      {/* زر الذهاب للبروفايل */}
      <button
        onClick={() => router.push(`/profile/${userId}`)}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg mb-4"
      >
        الذهاب إلى البروفايل
      </button>

      {/* معلومات تشخيصية للأدوار والصلاحيات */}
      <RoleDebugger userId={userId} role={role} />

      {/* محتوى حسب الصلاحيات */}
      <Can do="manage" on="all">
        <div className="mt-8 p-4 bg-green-100 rounded">
          <h2 className="text-xl font-semibold">لديك صلاحية الوصول للوحة التحكم</h2>
          <button
            onClick={() => router.push('/Dashboard')}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
          >
            الذهاب للوحة التحكم
          </button>
        </div>
      </Can>

      {/* محتوى إضافي للدكاترة */}
      <Can do="read" on="Doctor">
        <div className="mt-4 p-4 bg-blue-100 rounded">
          <h2 className="text-xl font-semibold">مرحباً دكتور!</h2>
          <p className="text-gray-700">يمكنك إدارة بياناتك ومرضاك</p>
        </div>
      </Can>

      {/* محتوى للمرضى */}
      <Can do="read" on="Patient">
        <div className="mt-4 p-4 bg-yellow-100 rounded">
          <h2 className="text-xl font-semibold">مرحباً مريض!</h2>
          <p className="text-gray-700">يمكنك حجز المواعيد ومتابعة حالتك</p>
        </div>
      </Can>
    </>
  );
}
