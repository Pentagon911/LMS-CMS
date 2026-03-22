import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAdd, MdAttachMoney, MdHome, MdHelpOutline, MdMedicalServices, MdInfo } from 'react-icons/md';
import request from '../../../utils/requestMethods.jsx';
import './MyAppealsPage.css';

const MyAppealsPage = () => {
  const navigate = useNavigate();
  const [appeals, setAppeals] = useState({
    bursary: [],
    hostel: [],
    exam_rewrite: [],
    medical_leave: [],
    result_reevaluation: [],
  });
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Helper to get status CSS class
  const getStatusClass = (status) => {
    const s = status?.toUpperCase();
    if (s === 'APPROVED') return 'status-approved';
    if (s === 'REJECTED') return 'status-rejected';
    return 'status-pending'; // PENDING, UNDER_REVIEW, etc.
  };

  // Fetch appeals and dashboard stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch appeals
        const appealsData = await request.GET('/lms/appeals/my/');
        setAppeals(appealsData);

        // Fetch dashboard stats
        const statsData = await request.GET('/lms/dashboard/student/');
        if (statsData?.my_appeals) {
          setStats(statsData.my_appeals);
        }
      } catch (err) {
        setError('Failed to load data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Render each group with its items
  const renderAppealGroup = (title, icon, items, createPath, renderExtra = null) => (
    <div className="appeal-group" key={title}>
      <div className="group-header">
        <h3>{icon} {title}</h3>
        <button className="new-appeal-btn" onClick={() => navigate(createPath)}>
          <MdAdd /> New
        </button>
      </div>
      {items.length === 0 ? (
        <p className="no-appeals">No appeals found.</p>
      ) : (
        <ul className="appeal-list">
          {items.map(appeal => (
            <li key={appeal.id} className="appeal-item">
              <div className="appeal-main-info">
                <span className="appeal-title">{appeal.title}</span>
                <span className={`status-badge ${getStatusClass(appeal.status)}`}>
                  {appeal.status}
                </span>
                <span className="appeal-date">{formatDate(appeal.created_at)}</span>
              </div>
              {renderExtra && (
                <div className="appeal-extra-info">
                  {renderExtra(appeal)}
                </div>
              )}
              <div className="appeal-actions">
                <button
                  className="view-details"
                  onClick={() => navigate(`/lms/appeals-and-welfare/appeal/${appeal.id}`)}
                >
                  <MdInfo /> Details
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // Extra details for exam rewrite appeals
  const examExtra = (appeal) => (
    <div className="extra-details">
      <span><strong>Course:</strong> {appeal.course_name}</span>
      <span><strong>Module:</strong> {appeal.module_name}</span>
      <span><strong>Semester:</strong> {appeal.semester}</span>
      <span><strong>Original Exam:</strong> {formatDate(appeal.original_exam_date)}</span>
      <span><strong>Reason:</strong> {appeal.reason_type}</span>
    </div>
  );

  // Extra details for medical leave appeals
  const medicalExtra = (appeal) => (
    <div className="extra-details">
      <span><strong>From:</strong> {formatDate(appeal.start_date)}</span>
      <span><strong>To:</strong> {formatDate(appeal.end_date)}</span>
      <span><strong>Hospital:</strong> {appeal.hospital_name}</span>
      <span><strong>Doctor:</strong> {appeal.doctor_name}</span>
    </div>
  );

  // Bursary extra (if needed) – currently no extra fields in JSON
  const bursaryExtra = (appeal) => (
    <div className="extra-details">
      {/* If the API returns fields like family_income_bracket etc., show them */}
    </div>
  );

  // Hostel extra (if needed)
  const hostelExtra = (appeal) => (
    <div className="extra-details">
      {/* Add fields when available */}
    </div>
  );

  if (loading) return <div className="loading-state"><div className="spinner"></div><p>Loading your appeals...</p></div>;
  if (error) return <div className="error-alert">{error}</div>;

  return (
    <div className="my-appeals-container">
      <div className="my-appeals-header">
        <h1>My Appeals</h1>
        <p>View and track your submitted appeals</p>
      </div>

      {/* Summary stats card */}
      <div className="stats-card">
        <div className="stat-item">
          <span className="stat-label">Total Appeals</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending</span>
          <span className="stat-value pending">{stats.pending}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Approved</span>
          <span className="stat-value approved">{stats.approved}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Rejected</span>
          <span className="stat-value rejected">{stats.rejected}</span>
        </div>
      </div>

      {renderAppealGroup('Bursary Appeals', <MdAttachMoney />, appeals.bursary, '/lms/appeals-and-welfare/bursary', bursaryExtra)}
      {renderAppealGroup('Hostel Appeals', <MdHome />, appeals.hostel, '/lms/appeals-and-welfare/welfare-request', hostelExtra)}
      {renderAppealGroup('Exam Rewrite Appeals', <MdHelpOutline />, appeals.exam_rewrite, '/lms/appeals-and-welfare/exam-rewrite', examExtra)}
      {renderAppealGroup('Medical Leave Appeals', <MdMedicalServices />, appeals.medical_leave, '/lms/appeals-and-welfare/medical-leave', medicalExtra)}
    </div>
  );
};

export default MyAppealsPage;