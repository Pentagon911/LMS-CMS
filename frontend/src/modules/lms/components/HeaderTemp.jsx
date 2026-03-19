import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Avatar from './Avatar';
import ProfileDropdown from './ProfileDropdown';
import './HeaderTemp.css';

const Header = ({ user, onLogout }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/lms/dashboard')) return 'Dashboard';
    if (path.includes('/lms/myAccount')) return 'My Account';
    return 'LMS';
  };

  return (
    <header className="lms-header">
      <div className="header-left">
        <Link to="/lms/dashboard" className="logo">
          <span className="logo-icon">🎓</span>
          <span className="logo-text">CMS Portal</span>
        </Link>
      </div>

      <div className="header-center">
        <h1 className="page-title">{getPageTitle()}</h1>
      </div>

      <div className="header-right">
        <div className="profile-section">
          <button
            className="profile-btn"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          >
            <Avatar user={user} size="small" />
            <span className="profile-name">
              {user?.first_name} {user?.last_name}
            </span>
            <span className={`arrow ${isProfileMenuOpen ? 'open' : ''}`}>▼</span>
          </button>

          <ProfileDropdown
            user={user}
            isOpen={isProfileMenuOpen}
            onClose={() => setIsProfileMenuOpen(false)}
            onLogout={onLogout}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;