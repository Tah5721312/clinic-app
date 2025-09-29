'use client';
import { useEffect, useState } from 'react';
import { UserRoles, PermissionNames, JWTPayload } from '@/lib/types';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission?: PermissionNames;
  requiredRole?: UserRoles | UserRoles[];
  fallback?: React.ReactNode;
  requireAll?: boolean; // إذا كان true، يحتاج كل الصلاحيات/الأدوار
}

export default function PermissionGuard({
  children,
  requiredPermission,
  requiredRole,
  fallback = <div className="text-red-500">ليس لديك صلاحية لعرض هذا المحتوى</div>,
  requireAll = false
}: PermissionGuardProps) {
  const [user, setUser] = useState<JWTPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  if (!user) {
    return fallback;
  }

  // التحقق من الأدوار
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRole = user.roleName === UserRoles.SUPER_ADMIN || 
                   roles.includes(user.roleName as UserRoles);
    
    if (!hasRole) {
      return fallback;
    }
  }

  // التحقق من الصلاحيات
  if (requiredPermission) {
    const hasPermission = user.roleName === UserRoles.SUPER_ADMIN || 
                         (user.permissions && user.permissions.includes(requiredPermission));
    
    if (!hasPermission) {
      return fallback;
    }
  }

  return <>{children}</>;
}