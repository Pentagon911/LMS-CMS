import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import './ProfileDropdown.css';

const ProfileDropdown = ({ user, isOpen, onClose, onLogout }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <div className="dropdown-header">
        <div className="user-info">
          <strong>{user?.first_name} {user?.last_name}</strong>
          <span>{user?.email}</span>
          {user?.role && (
            <span className="user-role-badge">{user.role}</span>
          )}
        </div>
      </div>
      <div className="divider"></div>
      <Link to="/lms/myAccount" className="dropdown-item" onClick={onClose}>
        <span className="item-icon">👤</span>
        My Account
      </Link>
      <Link to="/lms/settings" className="dropdown-item" onClick={onClose}>
        <span className="item-icon">⚙️</span>
        Settings
      </Link>
      <div className="divider"></div>
      <button onClick={onLogout} className="dropdown-item logout">
        <span className="item-icon">🚪</span>
        Sign Out
      </button>
    </div>
  );
};

export default ProfileDropdown;