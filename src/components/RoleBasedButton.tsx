'use client';
import { ButtonHTMLAttributes } from 'react';
import PermissionGuard from './PermissionGuard';
import { UserRoles, PermissionNames } from '@/lib/types';

interface RoleBasedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  requiredPermission?: PermissionNames;
  requiredRole?: UserRoles | UserRoles[];
  children: React.ReactNode;
}

export function RoleBasedButton({
  requiredPermission,
  requiredRole,
  children,
  className = "",
  ...buttonProps
}: RoleBasedButtonProps) {
  return (
    <PermissionGuard
      requiredPermission={requiredPermission}
      requiredRole={requiredRole}
      fallback={null}
    >
      <button
        className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${className}`}
        {...buttonProps}
      >
        {children}
      </button>
    </PermissionGuard>
  );
}