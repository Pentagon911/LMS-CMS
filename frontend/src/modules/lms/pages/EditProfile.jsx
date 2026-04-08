import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdPerson, MdEmail, MdPhone, MdAdminPanelSettings, MdSave, MdClose, MdLock, MdVisibility, MdVisibilityOff, MdEdit, MdCalendarToday, MdHome, MdCloudUpload, MdDelete } from 'react-icons/md';
import request from '../../../utils/requestMethods';
import './EditProfile.css';

const EditProfile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    dateOfBirth: '',
    address: ''
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
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);
  const [showPasswordSuccessMsg, setShowPasswordSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Load user data from localStorage and fetch full profile
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
        
        // Fetch full user profile from API
        fetchUserProfile(parsedUser.id);
      } catch (err) {
        console.error("Failed to parse user", err);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchUserProfile = async (userId) => {
    try {
      const response = await request.GET(`/users/profile/me/`);
      setUserData(response);
      setProfileForm({
        firstName: response.first_name || '',
        lastName: response.last_name || '',
        email: response.email || '',
        phone: response.phone_number || '',
        username: response.username || '',
        dateOfBirth: response.date_of_birth || '',
        address: response.address || ''
      });
      if (response.profile_picture) {
        setProfilePicturePreview(response.profile_picture);
      }
    } catch (err) {
      console.error("Failed to fetch user profile", err);
    }
  };

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
    setPasswordErrorMsg('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field]
    });
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type correctly
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      setErrorMsg('Please upload a valid image file (JPEG, PNG, GIF, or WEBP)');
      e.target.value = ''; // Clear the input
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size must be less than 5MB');
      e.target.value = ''; // Clear the input
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // Clean up old preview URL to prevent memory leaks
    if (profilePicturePreview && profilePicturePreview.startsWith('blob:')) {
      URL.revokeObjectURL(profilePicturePreview);
    }
    
    // Set preview immediately for better UX
    setProfilePicture(file);
    setProfilePicturePreview(previewUrl);
    setErrorMsg('');
    
    // Upload immediately
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);

      // Use the dedicated profile picture endpoint
      const response = await request.PATCH('/users/profile/picture/', formData, { isFormData: true });
      
      // Update local storage with new picture
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        parsedUser.profile_picture = response.profile_picture;
        localStorage.setItem('user', JSON.stringify(parsedUser));
        setUserData(parsedUser);
        // Update preview with the actual URL from server (optional, keeps blob preview)
        // setProfilePicturePreview(response.profile_picture);
      }
      
      setShowSuccessMsg(true);
      setTimeout(() => {
        setShowSuccessMsg(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to upload profile picture", err);
      setErrorMsg('Failed to upload profile picture. Please try again.');
      // Revert preview on error
      setProfilePicture(null);
      setProfilePicturePreview(userData?.profile_picture || null);
    } finally {
      setIsSaving(false);
      e.target.value = ''; // Clear the input
    }
  };

  const handleRemoveProfilePicture = async () => {
    // Clear local state
    if (profilePicturePreview && profilePicturePreview.startsWith('blob:')) {
      URL.revokeObjectURL(profilePicturePreview);
    }
    setProfilePicture(null);
    setProfilePicturePreview(null);
    
    // If there's an existing profile picture on the server, remove it
    if (userData?.profile_picture) {
      try {
        const response = await request.PATCH(`/users/profile/picture/`, {
          profile_picture: null // Send null to remove the picture
        });
        
        // Update local storage with removed picture
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          parsedUser.profile_picture = null;
          localStorage.setItem('user', JSON.stringify(parsedUser));
          setUserData(parsedUser);
        }
        
        setShowSuccessMsg(true);
        setTimeout(() => {
          setShowSuccessMsg(false);
        }, 2000);
      } catch (err) {
        console.error("Failed to remove profile picture", err);
        setErrorMsg('Failed to remove profile picture. Please try again.');
      }
    }
  };



  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSaving(true);

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

    if (!profileForm.username.trim()) {
      setErrorMsg('Username is required');
      setIsSaving(false);
      return;
    }

    try {
  
      const payload = {
        first_name: profileForm.firstName,
        last_name: profileForm.lastName,
        email: profileForm.email,
        phone_number: profileForm.phone,
        username: profileForm.username,
        date_of_birth: profileForm.dateOfBirth,
        address: profileForm.address
      };

      const updatedUser = await request.PATCH(`/users/profile/me/`, payload);
      
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const updatedStoredUser = {
          ...parsedUser,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          email: updatedUser.email,
          phone_number: updatedUser.phone_number,
          username: updatedUser.username,
          profile_picture: updatedUser.profile_picture
        };
        localStorage.setItem('user', JSON.stringify(updatedStoredUser));
        setUserData(updatedStoredUser);
      }
      
      setShowSuccessMsg(true);
      setTimeout(() => {
        setShowSuccessMsg(false);
      }, 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
  e.preventDefault();
  setPasswordErrorMsg('');
  setIsChangingPassword(true);

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
    const response = await request.POST('/users/change-password/', {
      old_password: passwordForm.currentPassword,
      new_password: passwordForm.newPassword,
      confirm_password: passwordForm.confirmPassword
    });

    // Store new tokens in localStorage
    if (response.access && response.refresh) {
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      console.log('Tokens updated successfully');
    }

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
      setPasswordErrorMsg(err.response?.data?.error || err.response?.data?.old_password?.[0] || 'Failed to change password. Please check your current password.');
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
      <div className="ep-loading">
        <div className="ep-loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="ep-container">
      <div className="ep-card">
        {/* Header with Profile Picture */}
        <div className="ep-header">
          <div className="ep-avatar-wrapper">
            <div className="ep-avatar">
              {profilePicturePreview ? (
                <img src={profilePicturePreview} alt="Profile" />
              ) : userData.profile_picture ? (
                <img src={userData.profile_picture} alt="Profile" />
              ) : (
                <span className="ep-avatar-initials">{getUserInitials()}</span>
              )}
            </div>
            <div className="ep-avatar-actions">
              <label className="ep-avatar-upload-btn">
                <MdCloudUpload />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  style={{ display: 'none' }}
                />
              </label>
              {(profilePicturePreview || userData.profile_picture) && (
                <button 
                  type="button" 
                  className="ep-avatar-remove-btn"
                  onClick={handleRemoveProfilePicture}
                >
                  <MdDelete />
                </button>
              )}
            </div>
          </div>
          <div className="ep-title">
            <h1>Edit Profile</h1>
            <p className="ep-role-badge">
              <MdAdminPanelSettings /> {userData.role || 'User'}
            </p>
          </div>
        </div>

        {/* Profile Update Success Message */}
        {showSuccessMsg && (
          <div className="ep-success-alert">
            <span>✓ Profile updated successfully!</span>
          </div>
        )}

        {/* Profile Update Error Message */}
        {errorMsg && (
          <div className="ep-error-alert">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Profile Information Section */}
        <div className="ep-form-section">
          <h2 className="ep-section-title">
            <MdPerson /> Profile Information
          </h2>
          <form onSubmit={handleFormSubmit} className="ep-form">
            <div className="ep-form-row">
              <div className="ep-input-group">
                <label>
                  <MdPerson /> First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={profileForm.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                />
              </div>

              <div className="ep-input-group">
                <label>
                  <MdPerson /> Last Name *
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

            <div className="ep-input-group">
              <label>
                <MdPerson /> Username *
              </label>
              <input
                type="text"
                name="username"
                value={profileForm.username}
                onChange={handleInputChange}
                placeholder="Enter username"
              />
            </div>

            <div className="ep-input-group">
              <label>
                <MdEmail /> Email *
              </label>
              <input
                type="email"
                name="email"
                value={profileForm.email}
                onChange={handleInputChange}
                placeholder="Enter email"
              />
            </div>

            <div className="ep-input-group">
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

            <div className="ep-input-group">
              <label>
                <MdCalendarToday /> Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={profileForm.dateOfBirth}
                onChange={handleInputChange}
              />
            </div>

            <div className="ep-input-group">
              <label>
                <MdHome /> Address
              </label>
              <textarea
                name="address"
                value={profileForm.address}
                onChange={handleInputChange}
                placeholder="Enter your address"
                rows="3"
              />
            </div>

            <div className="ep-form-buttons">
              <button 
                type="button" 
                className="ep-btn-cancel"
                onClick={() => navigate('/lms/dashboard')}
              >
                <MdClose /> Cancel
              </button>
              <button 
                type="submit" 
                className="ep-btn-save"
                disabled={isSaving || uploadingPicture}
              >
                {isSaving ? (
                  <>
                    <span className="ep-loading-spinner-small"></span>
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
        <div className="ep-section-divider"></div>

        {/* Change Password Section */}
        <div className="ep-form-section">
          <h2 className="ep-section-title">
            <MdLock /> Change Password
          </h2>
          
          {showPasswordSuccessMsg && (
            <div className="ep-success-alert">
              <span>✓ Password changed successfully!</span>
            </div>
          )}

          {passwordErrorMsg && (
            <div className="ep-error-alert">
              <span>{passwordErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="ep-password-form">
            <div className="ep-input-group">
              <label>
                <MdLock /> Current Password *
              </label>
              <div className="ep-password-wrapper">
                <input
                  type={showPassword.current ? "text" : "password"}
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                />
                <button 
                  type="button" 
                  className="ep-password-toggle"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPassword.current ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            <div className="ep-input-group">
              <label>
                <MdLock /> New Password *
              </label>
              <div className="ep-password-wrapper">
                <input
                  type={showPassword.new ? "text" : "password"}
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password (min. 6 characters)"
                />
                <button 
                  type="button" 
                  className="ep-password-toggle"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPassword.new ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
              <small className="ep-password-hint">Password must be at least 6 characters long</small>
            </div>

            <div className="ep-input-group">
              <label>
                <MdLock /> Confirm New Password *
              </label>
              <div className="ep-password-wrapper">
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                />
                <button 
                  type="button" 
                  className="ep-password-toggle"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPassword.confirm ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            <div className="ep-form-buttons">
              <button 
                type="button" 
                className="ep-btn-cancel"
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
                className="ep-btn-change-password"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <>
                    <span className="ep-loading-spinner-small"></span>
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
        <div className="ep-account-info">
          <h2 className="ep-section-title">Account Information</h2>
          <div className="ep-info-grid">
            <div className="ep-info-item">
              <span className="ep-info-label">Member Since:</span>
              <span className="ep-info-value">
                {userData.date_joined ? new Date(userData.date_joined).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="ep-info-item">
              <span className="ep-info-label">Last Login:</span>
              <span className="ep-info-value">
                {userData.last_login ? new Date(userData.last_login).toLocaleString() : 'N/A'}
              </span>
            </div>
            {userData.profile?.admin_id && (
              <div className="ep-info-item">
                <span className="ep-info-label">Admin ID:</span>
                <span className="ep-info-value">{userData.profile.admin_id}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;