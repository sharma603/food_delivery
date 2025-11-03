// SuperAdminHeader Component
// This file structure created as per requested organization
import React from 'react';

const SuperAdminHeader = ({ user, onLogout }) => {
  return (
    <header className="super-admin-header">
      <div className="header-left">
        <h1>Super Admin Dashboard</h1>
      </div>
      <div className="header-right">
        {user && (
          <div className="user-menu">
            <span>{user.name}</span>
            <button onClick={onLogout}>Logout</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default SuperAdminHeader;
