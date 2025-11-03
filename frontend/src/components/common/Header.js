import React from 'react';

const Header = ({ user, onLogout, title = 'Food Delivery System' }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-title">{title}</h1>
        </div>
        <div className="header-right">
          {user && (
            <div className="user-info">
              <span className="user-name">Welcome, {user.name}</span>
              <button className="logout-btn" onClick={onLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
