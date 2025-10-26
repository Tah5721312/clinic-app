'use client';

import { useAbility } from '@/contexts/AbilityContext';
import { Actions, Subjects } from '@/lib/ability';
import { useEffect, useMemo, useState } from 'react';
import { DOMAIN } from '@/lib/constants';

interface RoleDebuggerProps {
  userId: string;
  role?: string;
}

export default function RoleDebugger({ userId, role }: RoleDebuggerProps) {
  const ability = useAbility();
  const [dbRole, setDbRole] = useState<string | undefined>(undefined);
  const [hasManageAll, setHasManageAll] = useState<boolean>(false);
  const [dbPermissions, setDbPermissions] = useState<Array<{
    SUBJECT?: string;
    ACTION?: string;
    FIELD_NAME?: string | null;
    CAN_ACCESS?: number | null;
  }>>([]);
  const actions: Actions[] = ['manage', 'read', 'create', 'update', 'delete'];
  const subjects: Subjects[] = ['User', 'Patient', 'Doctor', 'Appointment', 'Dashboard', 'all'];

  useEffect(() => {
    if (!role && userId) {
      fetch(`${DOMAIN}/api/users/permissions/${userId}`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.data?.roleName) setDbRole(json.data.roleName);
          const perms: Array<{ SUBJECT?: string; ACTION?: string; FIELD_NAME?: string | null; CAN_ACCESS?: number | null }> = json?.data?.permissions || [];
          setDbPermissions(perms);
          const manageAll = perms.some(
            (p) => String(p.SUBJECT || '').toUpperCase() === 'ALL' && String(p.ACTION || '').toUpperCase() === 'MANAGE'
          );
          setHasManageAll(manageAll);
        })
        .catch(() => {});
    }
  }, [role, userId]);

  const can = useMemo(() => {
    return (action: Actions, subject: Subjects) => {
      if (hasManageAll) return true;
      if (ability.can('manage', 'all')) return true;
      return ability.can(action, subject);
    };
  }, [ability, hasManageAll]);

  return (
    <div className="mt-6 p-4 rounded-lg border card">
      <h3 className=" card-title text-base sm:text-lg md:text-xl font-semibold mb-4">معلومات الأدوار والصلاحيات</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <h4 className="card-title font-medium mb-2">معلومات المستخدم:</h4>
          <ul className="card-title text-sm sm:text-base space-y-1">
            <li><strong>User ID:</strong> {userId}</li>
            <li><strong>Role:</strong> {role || dbRole || 'غير محدد'}</li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium card-title mb-2">الصلاحيات المتاحة:</h4>
          <div className="card-title text-sm space-y-2 overflow-x-auto">
            {subjects.map(subject => (
              <div key={subject} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <span className="min-w-[120px] sm:min-w-0">{subject}:</span>
                <div className="flex gap-2 flex-wrap">
                  {actions.map(action => (
                    <span
                      key={action}
                      className={`px-2 py-1 rounded text-xs ${
                        can(action, subject)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* DB-backed permissions list */}
      <div className="mt-4">
        <h4 className="font-medium text-gray-700 mb-2">صلاحيات قاعدة البيانات (حسب الدور):</h4>
        {hasManageAll ? (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">هذا المستخدم يملك صلاحية شاملة: manage: all</div>
        ) : (
          <div className="text-sm space-y-2 overflow-x-auto">
            {dbPermissions.length === 0 ? (
              <div className="text-gray-500">لا توجد صلاحيات مسجلة لهذا المستخدم.</div>
            ) : (
              dbPermissions.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800">{String(p.SUBJECT || '').toUpperCase()}</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800">{String(p.ACTION || '').toUpperCase()}</span>
                  {p.FIELD_NAME ? (
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800">FIELD: {String(p.FIELD_NAME).toUpperCase()}</span>
                  ) : null}
                  {typeof p.CAN_ACCESS === 'number' ? (
                    <span className={`px-2 py-0.5 rounded ${p.CAN_ACCESS === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {p.CAN_ACCESS === 1 ? 'ALLOW' : 'DENY'}
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <div className="mt-4 p-3 bg-blue-50 rounded">
        <h4 className="font-medium text-blue-800 mb-2">كيفية إدارة الأدوار:</h4>
        <div className="text-sm sm:text-base text-blue-700 space-y-1">
          <p>• <strong>superadmin:</strong> جميع الصلاحيات</p>
          <p>• <strong>admin:</strong> إدارة المستخدمين، المرضى، الأطباء، المواعيد + قراءة Dashboard</p>
          <p>• <strong>doctor:</strong> قراءة وتحديث بياناته، المرضى، المواعيد + قراءة Dashboard</p>
          <p>• <strong>patient:</strong> قراءة بياناته، المواعيد، إنشاء مواعيد جديدة</p>
        </div>
      </div>
    </div>
  );
}
