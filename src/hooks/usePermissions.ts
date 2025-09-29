'use client';
import { useState, useEffect } from 'react';
import { JWTPayload, UserRoles, PermissionNames } from '@/lib/types';

export function usePermissions() {
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

  const hasPermission = (permission: PermissionNames): boolean => {
    if (!user) return false;
    if (user.roleName === UserRoles.SUPER_ADMIN) return true;
    return user.permissions?.includes(permission) || false;
  };

  const hasRole = (role: UserRoles | UserRoles[]): boolean => {
    if (!user) return false;
    if (user.roleName === UserRoles.SUPER_ADMIN) return true;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.roleName as UserRoles);
  };

  const hasAnyPermission = (permissions: PermissionNames[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAnyRole = (roles: UserRoles[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  return {
    user,
    loading,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAnyRole,
    isAdmin: user?.isAdmin || false,
    isSuperAdmin: user?.roleName === UserRoles.SUPER_ADMIN,
    isDoctor: user?.roleName === UserRoles.DOCTOR,
    isPatient: user?.roleName === UserRoles.PATIENT,
    isReceptionist: user?.roleName === UserRoles.RECEPTIONIST,
    isNurse: user?.roleName === UserRoles.NURSE
  };
}