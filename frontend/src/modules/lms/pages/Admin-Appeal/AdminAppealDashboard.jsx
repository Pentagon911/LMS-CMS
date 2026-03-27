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
    return;
  }

  return (
    <div className="aad-admin-dashboard-container">
      <div className="aad-dashboard-header">
        <div className="aad-header-title">
          <h1>Appeal Management Dashboard</h1>
          <p>Review and process student appeals</p>
        </div>
        <button className="aad-_refresh-btn" onClick={fetchDashboardData}>
          <MdRefresh /> Refresh
        </button>
      </div>

      {error && (
        <div className="aad-error-alert">
          <MdWarning />
          <span>{error}</span>
        </div>
      )}

      <div className="aad-stats-summary">
        <div className="aad-stat-card">
          <div className="aad-stat-icon">
            <MdQueue />
          </div>
          <div className="aad-stat-info">
            <h3>Total Pending</h3>
            <p className="aad-stat-number">{dashboardData?.total_appeals || 0}</p>
          </div>
        </div>
        <div className="aad-stat-card">
          <div className="aad-stat-icon">
            <MdWarning />
          </div>
          <div className="aad-stat-info">
            <h3>Unprocessed Queue</h3>
            <p className="aad-stat-number">{dashboardData?.unprocessed_queue || 0}</p>
          </div>
        </div>
        <button 
          className="aad-view-queue-btn"
          onClick={() => navigate('/lms/admin/review-queue')}
        >
          <MdQueue /> View Review Queue
        </button>
      </div>

      <div className="aad-appeals-grid">
        <h2>Pending Appeals by Category</h2>
        <div className="aad-grid-container">
          {appealCategories.map((category) => (
            <div
              key={category.id}
              className="aad-appeal-card"
              onClick={() => handleCategoryClick(category.path)}
              style={{ borderTopColor: category.color }}
            >
              <div className="aad-card-icon" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
                {category.icon}
              </div>
              <div className="aad-card-content">
                <h3>{category.title}</h3>
                <p className="aad-description">{category.description}</p>
                <div className="aad-badge" style={{ backgroundColor: category.color }}>
                  {category.count} Pending
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="aad-quick-actions">
        
        <div className="aad-actions-list">
          
        </div>
      </div>
    </div>
  );
};

export default AdminAppealDashboard;