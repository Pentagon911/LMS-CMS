import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdPerson, MdEmail, MdPhone, MdAdminPanelSettings, MdSave, MdClose } from 'react-icons/md';
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
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      setTimeout(() => navigate('/lms/dashboard'), 2000);
    } catch (err) {
      setErrorMsg('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
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

        {/* Success Message */}
        {showSuccessMsg && (
          <div className="success-alert">
            <span>✓ Profile updated successfully! Redirecting...</span>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="error-alert">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
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

          {/* Read-only info */}
          <div className="account-info">
            <h3>Account Information</h3>
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
    </div>
  );
};

export default EditProfile;
