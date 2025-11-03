// usePermission Hook
// This file structure created as per requested organization
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const usePermission = () => {
  const { user } = useContext(AuthContext);

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return user.permissions?.includes(permission) || false;
  };

  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };

  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions) => {
    return permissions.every(permission => hasPermission(permission));
  };

  return {
    user,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin: hasRole('super_admin'),
    isAdmin: hasRole('admin'),
    isRestaurant: hasRole('restaurant'),
  };
};

export default usePermission;
