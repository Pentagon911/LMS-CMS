import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdPerson, MdEmail, MdPhone, MdAdminPanelSettings, MdSave, MdClose, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import '../../cms/pages/EditProfile.css';

const EditProfile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);
  const [showPasswordSuccessMsg, setShowPasswordSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // Load user data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
        setProfileForm({
          firstName: parsedUser.first_name || '',
          lastName: parsedUser.last_name || '',
          email: parsedUser.email || '',
          phone: parsedUser.phone_number || '',
          username: parsedUser.username || ''
        });
      } catch (err) {
        console.error("Failed to parse user", err);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
    // Clear password error when user starts typing
    setPasswordErrorMsg('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field]
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSaving(true);

    // Validation
    if (!profileForm.firstName.trim()) {
      setErrorMsg('First name is required');
      setIsSaving(false);
      return;
    }
    
    if (!profileForm.lastName.trim()) {
      setErrorMsg('Last name is required');
      setIsSaving(false);
      return;
    }
    
    if (!profileForm.email.trim()) {
      setErrorMsg('Email is required');
      setIsSaving(false);
      return;
    }

    try {
      // Update localStorage
      const updatedUser = {
        ...userData,
        first_name: profileForm.firstName,
        last_name: profileForm.lastName,
        email: profileForm.email,
        phone_number: profileForm.phone,
        username: profileForm.username
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUserData(updatedUser);
      
      setShowSuccessMsg(true);
      setTimeout(() => {
        setShowSuccessMsg(false);
      }, 2000);
    } catch (err) {
      setErrorMsg('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordErrorMsg('');
    setIsChangingPassword(true);

    // Validation
    if (!passwordForm.currentPassword.trim()) {
      setPasswordErrorMsg('Current password is required');
      setIsChangingPassword(false);
      return;
    }

    if (!passwordForm.newPassword.trim()) {
      setPasswordErrorMsg('New password is required');
      setIsChangingPassword(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordErrorMsg('New password must be at least 6 characters');
      setIsChangingPassword(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrorMsg('New passwords do not match');
      setIsChangingPassword(false);
      return;
    }

    try {
      // Here you would typically make an API call to change the password
      // For now, we'll simulate a successful password change
      // const response = await request.POST('/change-password', {
      //   current_password: passwordForm.currentPassword,
      //   new_password: passwordForm.newPassword
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Clear password form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setShowPasswordSuccessMsg(true);
      setTimeout(() => {
        setShowPasswordSuccessMsg(false);
      }, 2000);
    } catch (err) {
      setPasswordErrorMsg('Failed to change password. Please check your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getUserInitials = () => {
    const first = profileForm.firstName?.charAt(0) || '';
    const last = profileForm.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'U';
  };

  if (!userData) {
    return (
      <div className="edit-profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-card">
        {/* Header */}
        <div className="edit-profile-header">
          <div className="edit-profile-avatar">
            {userData.profile_picture ? (
              <img src={userData.profile_picture} alt="Profile" />
            ) : (
              <span className="avatar-initials">{getUserInitials()}</span>
            )}
          </div>
          <div className="edit-profile-title">
            <h1>Edit Profile</h1>
            <p className="user-role-badge">
              <MdAdminPanelSettings /> {userData.role || 'User'}
            </p>
          </div>
        </div>

        {/* Profile Update Success Message */}
        {showSuccessMsg && (
          <div className="success-alert">
            <span>✓ Profile updated successfully!</span>
          </div>
        )}

        {/* Profile Update Error Message */}
        {errorMsg && (
          <div className="error-alert">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Profile Information Section */}
        <div className="profile-section">
          <h2 className="section-title">
            <MdPerson /> Profile Information
          </h2>
          <form onSubmit={handleFormSubmit} className="edit-profile-form">
            <div className="form-row">
              <div className="input-group">
                <label>
                  <MdPerson /> First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={profileForm.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                />
              </div>

              <div className="input-group">
                <label>
                  <MdPerson /> Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={profileForm.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="input-group">
              <label>
                <MdPerson /> Username
              </label>
              <input
                type="text"
                name="username"
                value={profileForm.username}
                onChange={handleInputChange}
                placeholder="Enter username"
              />
            </div>

            <div className="input-group">
              <label>
                <MdEmail /> Email
              </label>
              <input
                type="email"
                name="email"
                value={profileForm.email}
                onChange={handleInputChange}
                placeholder="Enter email"
              />
            </div>

            <div className="input-group">
              <label>
                <MdPhone /> Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={profileForm.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
            </div>

            {/* Form Actions */}
            <div className="form-buttons">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => navigate('/lms/dashboard')}
              >
                <MdClose /> Cancel
              </button>
              <button 
                type="submit" 
                className="btn-save"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <MdSave /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Divider */}
        <div className="section-divider"></div>

        {/* Change Password Section */}
        <div className="profile-section">
          <h2 className="section-title">
            <MdLock /> Change Password
          </h2>
          
          {/* Password Change Success Message */}
          {showPasswordSuccessMsg && (
            <div className="success-alert">
              <span>✓ Password changed successfully!</span>
            </div>
          )}

          {/* Password Change Error Message */}
          {passwordErrorMsg && (
            <div className="error-alert">
              <span>{passwordErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="password-change-form">
            <div className="input-group">
              <label>
                <MdLock /> Current Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword.current ? "text" : "password"}
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPassword.current ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label>
                <MdLock /> New Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword.new ? "text" : "password"}
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password (min. 6 characters)"
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPassword.new ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
              <small className="password-hint">Password must be at least 6 characters long</small>
            </div>

            <div className="input-group">
              <label>
                <MdLock /> Confirm New Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPassword.confirm ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            <div className="form-buttons">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => {
                  setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                  setPasswordErrorMsg('');
                }}
              >
                <MdClose /> Clear
              </button>
              <button 
                type="submit" 
                className="btn-change-password"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    Changing...
                  </>
                ) : (
                  <>
                    <MdLock /> Change Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Account Information Section */}
        <div className="account-info-section">
          <h2 className="section-title">Account Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Member Since:</span>
              <span className="info-value">
                {userData.date_joined ? new Date(userData.date_joined).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Login:</span>
              <span className="info-value">
                {userData.last_login ? new Date(userData.last_login).toLocaleString() : 'N/A'}
              </span>
            </div>
            {userData.profile?.admin_id && (
              <div className="info-item">
                <span className="info-label">Admin ID:</span>
                <span className="info-value">{userData.profile.admin_id}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
