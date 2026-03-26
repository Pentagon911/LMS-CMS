import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdPerson, MdBadge, MdAdminPanelSettings, MdCalendarToday } from "react-icons/md";
import "./LMSDashboard.css";  // new CSS file

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        console.log("User data loaded:", user);
        setUserData(user);
      } catch (error) {
        console.error("Failed to parse user data", error);
        navigate("/login");
      }
    } else {
      console.log("No user data found, redirecting to login");
      navigate("/login");
    }
    
    setLoading(false);
  }, [navigate]);

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return '#e74c3c';
      case 'instructor':
        return '#f39c12';
      case 'student':
        return '#27ae60';
      default:
        return '#3498db';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = () => {
    if (!userData) return '';
    const first = userData.first_name?.[0] || '';
    const last = userData.last_name?.[0] || '';
    return (first + last).toUpperCase();
  };

  if (loading) {
    return;
  }

  if (!userData) {
    return (
      <div className="lms-error">
        <p>Unable to load user data. Please login again.</p>
        <button className="lms-error-btn" onClick={() => navigate("/login")}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="lms-dashboard">
      <div className="lms-welcome-section">
        <h1 className="lms-welcome-title">
          Welcome back, {userData.first_name}!
        </h1>
        <p className="lms-welcome-subtitle">
          Here's what's happening with your account today.
        </p>
      </div>

      <div className="lms-dashboard-grid">
        {/* Profile Card */}
        <div className="lms-card lms-profile-card">
          <div className="lms-profile-header">
            <div className="lms-avatar">
              {userData.profile_picture ? (
                <img
                  src={userData.profile_picture}
                  alt="Profile"
                  className="lms-avatar-img"
                />
              ) : (
                <div className="lms-avatar-placeholder">
                  {getInitials()}
                </div>
              )}
            </div>
            <div className="lms-profile-info">
              <h2>{userData.first_name} {userData.last_name}</h2>
              <div
                className="lms-role-badge"
                style={{ backgroundColor: getRoleBadgeColor(userData.role) }}
              >
                {userData.role === 'instructor' ? "Lecturer/Instructor" : userData.role || 'User'}
              </div>
            </div>
          </div>
          <div className="lms-profile-details">
            <div className="lms-detail-item">
              <span className="lms-detail-label">Username</span>
              <span className="lms-detail-value">{userData.username}</span>
            </div>
            <div className="lms-detail-item">
              <span className="lms-detail-label">Email</span>
              <span className="lms-detail-value">{userData.email}</span>
            </div>
            <div className="lms-detail-item">
              <span className="lms-detail-label">Phone</span>
              <span className="lms-detail-value">{userData.phone_number || 'Not provided'}</span>
            </div>
            <div className="lms-detail-item">
              <span className="lms-detail-label">Member Since</span>
              <span className="lms-detail-value">{formatDate(userData.date_joined)}</span>
            </div>
            <div className="lms-detail-item">
              <span className="lms-detail-label">Last Login</span>
              <span className="lms-detail-value">{formatDate(userData.last_login)}</span>
            </div>
          </div>
        </div>

        {/* Stats Card (only for non-students) */}
        {userData.role !== 'student' && (
          <div className="lms-card">
            <h3>Account Overview</h3>
            <div className="lms-stats-grid">
              <div className="lms-stat-item">
                <div className="lms-stat-icon"><MdPerson /></div>
                <div className="lms-stat-info">
                  <span className="lms-stat-label">User ID</span>
                  <span className="lms-stat-value">{userData.id}</span>
                </div>
              </div>
              
              <div className="lms-stat-item">
                <div className="lms-stat-icon"><MdBadge /></div>
                <div className="lms-stat-info">
                  <span className="lms-stat-label">Role</span>
                  <span className="lms-stat-value lms-role-text">
                    {userData.role === 'instructor' ? 'Lecturer/Instructor' : userData.role}
                  </span>
                </div>
              </div>

              {userData.profile?.admin_id && (
                <div className="lms-stat-item">
                  <div className="lms-stat-icon"><MdAdminPanelSettings /></div>
                  <div className="lms-stat-info">
                    <span className="lms-stat-label">Admin ID</span>
                    <span className="lms-stat-value">{userData.profile.admin_id}</span>
                  </div>
                </div>
              )}

              <div className="lms-stat-item">
                <div className="lms-stat-icon"><MdCalendarToday /></div>
                <div className="lms-stat-info">
                  <span className="lms-stat-label">Account Age</span>
                  <span className="lms-stat-value">
                    {Math.floor((new Date() - new Date(userData.date_joined)) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity Card */}
        <div className="lms-card">
          <h3>Recent Activity</h3>
          <div className="lms-activity-list">
            <div className="lms-activity-item">
              <span className="lms-activity-time">Just now</span>
              <span className="lms-activity-text">Logged in successfully</span>
            </div>
            <div className="lms-activity-item">
              <span className="lms-activity-time">Last login</span>
              <span className="lms-activity-text">{formatDate(userData.last_login)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;