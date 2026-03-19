import React from 'react';
import './Avatar.css';

const Avatar = ({ user, size = 'medium' }) => {
  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return (user.first_name[0] + user.last_name[0]).toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className={`avatar avatar-${size}`}>
      {user?.profile_picture ? (
        <img src={user.profile_picture} alt={user.first_name || 'User'} />
      ) : (
        <span className="avatar-placeholder">{getInitials()}</span>
      )}
    </div>
  );
};

export default Avatar;