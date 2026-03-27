// src/modules/lms/pages/Student-Appeal/StudentAppealDashboard.jsx
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
  MdAdd,
  MdRefresh,
  MdWarning,
  MdCheckCircle,
  MdCancel,
  MdPending,
  MdVisibility
} from 'react-icons/md';
import './StudentAppealDashboard.css';

const StudentAppealDashboard = () => {
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
      const response = await request.GET('/lms/dashboard/student/');
      setDashboardData(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const appealTypes = [
    {
      id: 'bursary',
      title: 'Bursary Application',
      icon: <MdReceipt />,
      path: '/lms/appeals-and-welfare/bursary',
      color: '#4CAF50',
      description: 'Apply for financial aid and scholarships',
      count: dashboardData?.my_appeals?.pending || 0
    },
    {
      id: 'hostel',
      title: 'Hostel Application',
      icon: <MdHome />,
      path: '/lms/appeals-and-welfare/welfare-request',
      color: '#2196F3',
      description: 'Request hostel accommodation',
      count: dashboardData?.my_appeals?.pending || 0
    },
    {
      id: 'exam_rewrite',
      title: 'Exam Rewrite',
      icon: <MdEditNote />,
      path: '/lms/appeals-and-welfare/exam-rewrite',
      color: '#FF9800',
      description: 'Request exam rescheduling',
      count: dashboardData?.my_appeals?.pending || 0
    },
    {
      id: 'medical_leave',
      title: 'Medical Leave',
      icon: <MdLocalHospital />,
      path: '/lms/appeals-and-welfare/medical-leave',
      color: '#F44336',
      description: 'Apply for medical leave',
      count: dashboardData?.my_appeals?.pending || 0
    },
    {
      id: 'result_reeval',
      title: 'Result Re-evaluation',
      icon: <MdAssessment />,
      path: '/lms/appeals-and-welfare/result-reeval',
      color: '#9C27B0',
      description: 'Request grade review',
      count: dashboardData?.my_appeals?.pending || 0
    }
  ];

  const handleApplyClick = (path) => {
    navigate(path);
  };

  const handleViewMyAppeals = () => {
    navigate('/lms/appeals-and-welfare/my-appeals');
  };

  if (loading) {
    return;
  }

  return (
    <div className="sad-student-dashboard-container">
      <div className="sad-dashboard-header">
        <div className="sad-header-title">
          <h1>Appeals & Welfare Dashboard</h1>
          <p>Submit and track your appeals and applications</p>
        </div>
        <button className="sad-refresh-btn" onClick={fetchDashboardData}>
          <MdRefresh /> Refresh
        </button>
      </div>

      {error && (
        <div className="sad-error-alert">
          <MdWarning />
          <span>{error}</span>
        </div>
      )}

      <div className="sad-stats-summary">
        <div className="sad-stat-card pending-card">
          <div className="sad-stat-icon pending">
            <MdPending />
          </div>
          <div className="sad-stat-info">
            <h3>Pending Appeals</h3>
            <p className="sad-stat-number">{dashboardData?.my_appeals?.pending || 0}</p>
          </div>
        </div>
        <div className="sad-stat-card review-card">
          <div className="sad-stat-icon review">
            <MdVisibility />
          </div>
          <div className="sad-stat-info">
            <h3>Under Review</h3>
            <p className="sad-stat-number">{dashboardData?.my_appeals?.under_review || 0}</p>
          </div>
        </div>
        <div className="sad-stat-card approved-card">
          <div className="sad-stat-icon approved">
            <MdCheckCircle />
          </div>
          <div className="sad-stat-info">
            <h3>Approved</h3>
            <p className="sad-stat-number">{dashboardData?.my_appeals?.approved || 0}</p>
          </div>
        </div>
        <div className="sad-stat-card rejected-card">
          <div className="sad-stat-icon rejected">
            <MdCancel />
          </div>
          <div className="sad-stat-info">
            <h3>Rejected</h3>
            <p className="sad-stat-number">{dashboardData?.my_appeals?.rejected || 0}</p>
          </div>
        </div>
        <button 
          className="sad-view-all-btn"
          onClick={handleViewMyAppeals}
        >
          View All My Appeals ({dashboardData?.my_appeals?.total || 0})
        </button>
      </div>

      <div className="sad-appeals-grid">
        <h2>Submit New Appeal</h2>
        <div className="sad-grid-container">
          {appealTypes.map((type) => (
            <div
              key={type.id}
              className="sad-appeal-card"
              onClick={() => handleApplyClick(type.path)}
              style={{ borderTopColor: type.color }}
            >
              <div className="sad-card-icon" style={{ backgroundColor: `${type.color}20`, color: type.color }}>
                {type.icon}
              </div>
              <div className="sad-card-content">
                <h3>{type.title}</h3>
                <p className="sad-description">{type.description}</p>
                <button className="sad-apply-btn" style={{ backgroundColor: type.color }}>
                  <MdAdd /> Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sad-info-section">
        <div className="sad-info-card">
          <h3>Need Help?</h3>
          <p>If you need assistance with your application, please contact:</p>
          <ul>
            <li>Student Welfare Office: welfare@university.edu</li>
            <li>Academic Affairs: academics@university.edu</li>
            <li>Help Desk: +94 11 234 5678</li>
          </ul>
        </div>
        <div className="sad-info-card">
          <h3>Processing Time</h3>
          <p>Appeals are typically processed within 5-7 business days. You will receive notifications about your appeal status via email.</p>
        </div>
      </div>
    </div>
  );
};

export default StudentAppealDashboard;