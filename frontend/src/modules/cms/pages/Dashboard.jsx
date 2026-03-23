import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserFromToken } from "../../../utils/auth";
import { MdPerson, MdBadge, MdAdminPanelSettings, MdCalendarToday } from "react-icons/md";
import "./Dashboard.css";

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [tokenData, setTokenData] = useState(null);

  useEffect(()=>{
      const token = getUserFromToken();
      setTokenData(token);
  },[]);


  useEffect(() => {
    // Get user data from localStorage (assuming you store it after login)
    const storedUser = localStorage.getItem("user");
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        console.log("User data loaded:", user);
        setUserData(user);
      } catch (error) {
        console.error("Failed to parse user data", error);
        // Redirect to login if data is corrupted
        navigate("/login");
      }
    } else {
      // No user data found, redirect to login
      console.log("No user data found, redirecting to login");
      navigate("/login");
    }
    
    setLoading(false);
  }, [navigate]);

  // Helper function to get role badge color
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

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get initials for avatar
  const getInitials = () => {
    if (!userData) return '';
    const first = userData.first_name?.[0] || '';
    const last = userData.last_name?.[0] || '';
    return (first + last).toUpperCase();
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="dashboard-error">
        <p>Unable to load user data. Please login again.</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1 className="welcome-title">
          Welcome back, {userData.first_name}!
        </h1>
        <p className="welcome-subtitle">
          Here's what's happening with your account today.
        </p>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Profile Card */}
        <div className="dashboard-card profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {userData.profile_picture ? (
                <img src={userData.profile_picture} alt="Profile" />
              ) : (
                <div className="avatar-placeholder">
                  {getInitials()}
                </div>
              )}
            </div>
            <div className="profile-info">
              <h2>{userData.first_name} {userData.last_name}</h2>
              <div 
                className="role-badge"
                style={{ backgroundColor: getRoleBadgeColor(tokenData.role) }}
              >
                {tokenData.role === 'instructor'? "Lecturer/Instructor":tokenData.role || 'User'}
              </div>
            </div>
          </div>
          <div className="profile-details">
            <div className="detail-item">
              <span className="detail-label">Username</span>
              <span className="detail-value">{userData.username}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email</span>
              <span className="detail-value">{userData.email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Phone</span>
              <span className="detail-value">{userData.phone_number || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Member Since</span>
              <span className="detail-value">{formatDate(userData.date_joined)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Last Login</span>
              <span className="detail-value">{formatDate(userData.last_login)}</span>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        { tokenData.role != 'student' && <div className="dashboard-card stats-card">
          <h3>Account Overview</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon"><MdPerson /></div>
              <div className="stat-info">
                <span className="stat-label">User ID</span>
                <span className="stat-value">{userData.id}</span>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon"><MdBadge /></div>
              <div className="stat-info">
                <span className="stat-label">Role</span>
                <span className="stat-value role-text">{tokenData.role == 'instructor'? 'Lecturer/Instructor':tokenData.role}</span>
              </div>
            </div>

            {userData.profile?.admin_id && (
              <div className="stat-item">
                <div className="stat-icon"><MdAdminPanelSettings /></div>
                <div className="stat-info">
                  <span className="stat-label">Admin ID</span>
                  <span className="stat-value">{userData.profile.admin_id}</span>
                </div>
              </div>
            )}

            <div className="stat-item">
              <div className="stat-icon"><MdCalendarToday /></div>
              <div className="stat-info">
                <span className="stat-label">Account Age</span>
                <span className="stat-value">
                  {Math.floor((new Date() - new Date(userData.date_joined)) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>
            </div>
          </div>
        </div>}

        {/* Recent Activity Card - Placeholder for future */}
        <div className="dashboard-card activity-card">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-time">Just now</span>
              <span className="activity-text">Logged in successfully</span>
            </div>
            <div className="activity-item">
              <span className="activity-time">Last login</span>
              <span className="activity-text">{formatDate(userData.last_login)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
