// src/modules/lms/pages/Admin-Appeal/AdminAppealDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import request from '../../../../utils/requestMethods';
import {
  MdDashboard,
  MdReceipt,
  MdHome,
  MdEditNote,
  MdLocalHospital,
  MdAssessment,
  MdQueue,
  MdRefresh,
  MdWarning,
} from 'react-icons/md';
import './AdminAppealDashboard.css';

const AdminAppealDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await request.GET('/lms/dashboard/admin/');
      setDashboardData(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const appealCategories = [
    {
      id: 'bursary',
      title: 'Bursary Appeals',
      icon: <MdReceipt />,
      count: dashboardData?.pending_appeals?.bursary || 0,
      path: '/lms/admin/appeals/bursary',
      color: '#4CAF50',
      description: 'Financial aid applications',
    },
    {
      id: 'hostel',
      title: 'Hostel Appeals',
      icon: <MdHome />,
      count: dashboardData?.pending_appeals?.hostel || 0,
      path: '/lms/admin/appeals/hostel',
      color: '#2196F3',
      description: 'Accommodation requests',
    },
    {
      id: 'exam_rewrite',
      title: 'Exam Rewrite Appeals',
      icon: <MdEditNote />,
      count: dashboardData?.pending_appeals?.exam_rewrite || 0,
      path: '/lms/admin/appeals/exam-rewrite',
      color: '#FF9800',
      description: 'Exam rescheduling requests',
    },
    {
      id: 'medical_leave',
      title: 'Medical Leave Appeals',
      icon: <MdLocalHospital />,
      count: dashboardData?.pending_appeals?.medical_leave || 0,
      path: '/lms/admin/appeals/medical-leave',
      color: '#F44336',
      description: 'Medical leave applications',
    },
    {
      id: 'result_reeval',
      title: 'Result Re-evaluation',
      icon: <MdAssessment />,
      count: dashboardData?.pending_appeals?.result_reeval || 0,
      path: '/lms/admin/appeals/result-reeval',
      color: '#9C27B0',
      description: 'Grade review requests',
    },
  ];

  const handleCategoryClick = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-header">
        <div className="header-title">
          <h1>Appeal Management Dashboard</h1>
          <p>Review and process student appeals</p>
        </div>
        <button className="refresh-btn" onClick={fetchDashboardData}>
          <MdRefresh /> Refresh
        </button>
      </div>

      {error && (
        <div className="error-alert">
          <MdWarning />
          <span>{error}</span>
        </div>
      )}

      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-icon">
            <MdQueue />
          </div>
          <div className="stat-info">
            <h3>Total Pending</h3>
            <p className="stat-number">{dashboardData?.total_appeals || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <MdWarning />
          </div>
          <div className="stat-info">
            <h3>Unprocessed Queue</h3>
            <p className="stat-number">{dashboardData?.unprocessed_queue || 0}</p>
          </div>
        </div>
        <button 
          className="view-queue-btn"
          onClick={() => navigate('/lms/admin/review-queue')}
        >
          <MdQueue /> View Review Queue
        </button>
      </div>

      <div className="appeals-grid">
        <h2>Pending Appeals by Category</h2>
        <div className="grid-container">
          {appealCategories.map((category) => (
            <div
              key={category.id}
              className="appeal-card"
              onClick={() => handleCategoryClick(category.path)}
              style={{ borderTopColor: category.color }}
            >
              <div className="card-icon" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
                {category.icon}
              </div>
              <div className="card-content">
                <h3>{category.title}</h3>
                <p className="description">{category.description}</p>
                <div className="badge" style={{ backgroundColor: category.color }}>
                  {category.count} Pending
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-list">
          <button 
            className="action-btn"
            onClick={() => navigate('/lms/admin/review-queue')}
          >
            <MdQueue /> Review Queue
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAppealDashboard;