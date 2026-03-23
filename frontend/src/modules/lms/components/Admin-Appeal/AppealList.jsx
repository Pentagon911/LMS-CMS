// src/modules/lms/components/Admin-Appeal/AppealList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import request from '../../../utils/requestMethods';
import { MdVisibility, MdCheckCircle, MdCancel, MdWarning, MdRefresh } from 'react-icons/md';
import './AppealList.css';

const AppealList = ({ 
  title, 
  apiEndpoint, 
  detailPath,
  onProcess,
  showActions = true 
}) => {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppeals();
  }, [apiEndpoint]);

  const fetchAppeals = async () => {
    setLoading(true);
    try {
      const response = await request.GET(apiEndpoint);
      setAppeals(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching appeals:', err);
      setError(err.message || 'Failed to load appeals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'UNDER_REVIEW':
        return 'status-review';
      case 'APPROVED':
        return 'status-approved';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="appeal-list-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading appeals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="appeal-list-container">
      <div className="list-header">
        <h2>{title}</h2>
        <button className="refresh-btn" onClick={fetchAppeals}>
          <MdRefresh /> Refresh
        </button>
      </div>

      {error && (
        <div className="error-alert">
          <MdWarning />
          <span>{error}</span>
        </div>
      )}

      {appeals.length === 0 ? (
        <div className="empty-state">
          <p>No pending appeals to review.</p>
        </div>
      ) : (
        <div className="appeals-table-container">
          <table className="appeals-table">
            <thead>
              <tr>
                <th>Appeal ID</th>
                <th>Student</th>
                <th>Title</th>
                <th>Department</th>
                <th>Date</th>
                <th>Status</th>
                {showActions && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {appeals.map((appeal) => (
                <tr key={appeal.id}>
                  <td className="appeal-id">{appeal.appeal_id?.slice(0, 8)}...</td>
                  <td>
                    <div className="student-info">
                      <strong>{appeal.student_name || appeal.student?.get_full_name || 'Unknown'}</strong>
                      <span className="student-detail">{appeal.student?.username || ''}</span>
                    </div>
                  </td>
                  <td>{appeal.title}</td>
                  <td>{appeal.department_name || appeal.department?.name || 'N/A'}</td>
                  <td>{formatDate(appeal.created_at)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(appeal.status)}`}>
                      {appeal.status}
                    </span>
                  </td>
                  {showActions && (
                    <td className="actions">
                      <button
                        className="action-btn view-btn"
                        onClick={() => navigate(`${detailPath}/${appeal.id}`)}
                        title="View Details"
                      >
                        <MdVisibility />
                      </button>
                      <button
                        className="action-btn approve-btn"
                        onClick={() => onProcess?.(appeal.id, 'approve', appeal)}
                        title="Approve"
                      >
                        <MdCheckCircle />
                      </button>
                      <button
                        className="action-btn reject-btn"
                        onClick={() => onProcess?.(appeal.id, 'reject', appeal)}
                        title="Reject"
                      >
                        <MdCancel />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AppealList;