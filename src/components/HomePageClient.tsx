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
      {/* محتوى إضافي للدكاترة */}
      <Can do="read" on="Doctor">
        <div className="mt-4 p-4 bg-blue-100 rounded">
          <h2 className="card-title text-xl font-semibold"> Welcome Doctor</h2>
          <p className="text-gray-700">Here is your Data and Patents </p>
        </div>
      </Can>

      {/* محتوى للمرضى */}
      <Can do="read" on="Patient">
        <div className="mt-4 p-4 bg-yellow-100 rounded">
          <h2 className="card-title text-xl font-semibold">Welcome Patent</h2>
          <p className="text-gray-700">Here you Can Reserve Appointment and known Diagnostics</p>
        </div>
      </Can>


      
      {/* معلومات تشخيصية للأدوار والصلاحيات */}
      <RoleDebugger userId={userId} role={role} />

    </>
  );
}
