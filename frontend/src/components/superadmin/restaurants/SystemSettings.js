import React from 'react';
import SystemSettings from '../../components/superadmin/Settings/SystemSettings';
import CommissionSettings from '../../components/superadmin/Settings/CommissionSettings';
import PaymentSettings from '../../components/superadmin/Settings/PaymentSettings';

const SystemSettingsPage = () => {
  return (
    <div>
      <h1>System Settings</h1>
      <SystemSettings />
      <CommissionSettings />
      <PaymentSettings />
    </div>
  );
};

export default SystemSettingsPage;
