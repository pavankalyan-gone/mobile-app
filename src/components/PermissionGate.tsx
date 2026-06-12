import React from 'react';
import { usePolicy } from '../hooks/usePolicy';

interface Props {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<Props> = ({ permission, children, fallback = null }) => {
  const { hasPermission } = usePolicy();

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
