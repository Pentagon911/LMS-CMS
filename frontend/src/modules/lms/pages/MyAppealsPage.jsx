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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusClass = (status) => {
    const s = status?.toUpperCase();
    if (s === 'APPROVED') return 'my-appeals-status-approved';
    if (s === 'REJECTED') return 'my-appeals-status-rejected';
    return 'my-appeals-status-pending';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const appealsData = await request.GET('/lms/appeals/my/');
        setAppeals(appealsData);

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

  const renderAppealGroup = (title, icon, items, createPath, renderExtra = null) => (
    <div className="my-appeals-appeal-group" key={title}>
      <div className="my-appeals-group-header">
        <h3>{icon} {title}</h3>
        <button className="my-appeals-new-appeal-btn" onClick={() => navigate(createPath)}>
          <MdAdd /> New
        </button>
      </div>
      {items.length === 0 ? (
        <p className="my-appeals-no-appeals">No appeals found.</p>
      ) : (
        <ul className="my-appeals-appeal-list">
          {items.map(appeal => (
            <li key={appeal.id} className="my-appeals-appeal-item">
              <div className="my-appeals-appeal-main-info">
                <span className="my-appeals-appeal-title">{appeal.title}</span>
                <span className={`my-appeals-status-badge ${getStatusClass(appeal.status)}`}>
                  {appeal.status}
                </span>
                <span className="my-appeals-appeal-date">{formatDate(appeal.created_at)}</span>
              </div>
              {renderExtra && (
                <div className="my-appeals-appeal-extra-info">
                  {renderExtra(appeal)}
                </div>
              )}
              <div className="my-appeals-appeal-actions">
                <button
                  className="my-appeals-view-details"
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

  const examExtra = (appeal) => (
    <div className="my-appeals-extra-details">
      <span><strong>Course:</strong> {appeal.course_name}</span>
      <span><strong>Module:</strong> {appeal.module_name}</span>
      <span><strong>Semester:</strong> {appeal.semester}</span>
      <span><strong>Original Exam:</strong> {formatDate(appeal.original_exam_date)}</span>
      <span><strong>Reason:</strong> {appeal.reason_type}</span>
    </div>
  );

  const medicalExtra = (appeal) => (
    <div className="my-appeals-extra-details">
      <span><strong>From:</strong> {formatDate(appeal.start_date)}</span>
      <span><strong>To:</strong> {formatDate(appeal.end_date)}</span>
      <span><strong>Hospital:</strong> {appeal.hospital_name}</span>
      <span><strong>Doctor:</strong> {appeal.doctor_name}</span>
    </div>
  );

  const bursaryExtra = (appeal) => <div className="my-appeals-extra-details"></div>;
  const hostelExtra = (appeal) => <div className="my-appeals-extra-details"></div>;

  if (loading) return <div className="my-appeals-loading-state"><div className="my-appeals-spinner"></div><p>Loading your appeals...</p></div>;
  if (error) return <div className="my-appeals-error-alert">{error}</div>;

  return (
    <div className="my-appeals-container">
      <div className="my-appeals-header">
        <h1>My Appeals</h1>
        <p>View and track your submitted appeals</p>
      </div>

      <div className="my-appeals-stats-card">
        <div className="my-appeals-stat-item">
          <span className="my-appeals-stat-label">Total Appeals</span>
          <span className="my-appeals-stat-value">{stats.total}</span>
        </div>
        <div className="my-appeals-stat-item">
          <span className="my-appeals-stat-label">Pending</span>
          <span className="my-appeals-stat-value my-appeals-pending">{stats.pending}</span>
        </div>
        <div className="my-appeals-stat-item">
          <span className="my-appeals-stat-label">Approved</span>
          <span className="my-appeals-stat-value my-appeals-approved">{stats.approved}</span>
        </div>
        <div className="my-appeals-stat-item">
          <span className="my-appeals-stat-label">Rejected</span>
          <span className="my-appeals-stat-value my-appeals-rejected">{stats.rejected}</span>
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