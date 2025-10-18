// Role Middleware
// This file structure created as per requested organization

export const checkRole = (userRole, allowedRoles) => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};

export const checkPermission = (userPermissions, requiredPermission) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  return userPermissions.includes(requiredPermission);
};

export const isSuperAdmin = (user) => {
  return user?.role === 'super_admin';
};

export const isAdmin = (user) => {
  return user?.role === 'admin' || user?.role === 'super_admin';
};

export const isRestaurant = (user) => {
  return user?.role === 'restaurant';
};

export const hasAnyRole = (user, roles) => {
  if (!user?.role) return false;
  return roles.includes(user.role);
};

export const hasAllPermissions = (userPermissions, requiredPermissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  return requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );
};

export const hasAnyPermission = (userPermissions, requiredPermissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  return requiredPermissions.some(permission => 
    userPermissions.includes(permission)
  );
};
