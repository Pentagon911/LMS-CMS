import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import './MyAccount.css';

const MyAccount = () => {
  const { user: contextUser } = useOutletContext();
  const [user, setUser] = useState(contextUser);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (contextUser) {
      setFormData({
        first_name: contextUser.first_name || '',
        last_name: contextUser.last_name || '',
        email: contextUser.email || '',
        phone_number: contextUser.phone_number || '',
      });
      setPreviewUrl(contextUser.profile_picture || null);
    }
  }, [contextUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Simulate API update
    const updatedUser = {
      ...user,
      ...formData,
      profile_picture: previewUrl || user?.profile_picture,
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setEditMode(false);
    alert('Profile updated successfully!');
  };

  const handleChangePassword = () => {
    alert('Change password functionality will be implemented later.');
  };

  if (loading) return <LoadingSpinner message="Loading profile..." />;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>My Account</h2>

        <div className="profile-avatar-section">
          <Avatar user={user} size="large" />
          {editMode && (
            <div className="avatar-upload">
              <label htmlFor="profile-picture" className="upload-btn">
                Choose Picture
              </label>
              <input
                type="file"
                id="profile-picture"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>

        <div className="profile-details">
          {editMode ? (
            <>
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                />
              </div>
            </>
          ) : (
            <>
              <div className="detail-item">
                <span className="detail-label">Username</span>
                <span className="detail-value">{user?.username}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Name</span>
                <span className="detail-value">{user?.first_name} {user?.last_name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{user?.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{user?.phone_number || 'Not provided'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Role</span>
                <span className="detail-value role-badge">{user?.role}</span>
              </div>
            </>
          )}
        </div>

        <div className="profile-actions">
          {editMode ? (
            <>
              <button className="save-btn" onClick={handleSave}>Save Changes</button>
              <button className="cancel-btn" onClick={() => setEditMode(false)}>Cancel</button>
            </>
          ) : (
            <>
              <button className="edit-btn" onClick={() => setEditMode(true)}>Edit Profile</button>
              <button className="password-btn" onClick={handleChangePassword}>Change Password</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAccount;