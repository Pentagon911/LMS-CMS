// src/modules/lms/pages/Admin-Appeal/AdminBursaryAppeals.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import request from '../../../../utils/requestMethods';
import { MdRefresh, MdVisibility, MdCheckCircle, MdCancel, MdWarning, MdDownload, MdClose } from 'react-icons/md';
import './AdminAppealPage.css';

const AdminBursaryAppeals = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processData, setProcessData] = useState({ approved_amount: '' });

  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    setLoading(true);
    try {
      const response = await request.GET('/lms/admin/appeals/bursary/pending/');
      setAppeals(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching bursary appeals:', err);
      setError(err.message || 'Failed to load appeals.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (appeal) => {
    setSelectedAppeal(appeal);
    setReviewNotes(appeal.review_notes || '');
    setProcessData({ approved_amount: appeal.approved_amount || '' });
    setModalOpen(true);
  };

  const handleProcess = async (decision) => {
    if (!selectedAppeal) return;
    
    setProcessing(true);
    try {
      const payload = {
        decision,
        notes: reviewNotes,
        approved_amount: processData.approved_amount
      };
      
      await request.POST(`/lms/admin/appeals/bursary/${selectedAppeal.id}/process/`, payload);
      
      setModalOpen(false);
      setSelectedAppeal(null);
      fetchAppeals();
    } catch (err) {
      console.error('Error processing appeal:', err);
      alert(err.message || 'Failed to process appeal.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = (fileUrl, fileName) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
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
      case 'PENDING': return 'status-pending';
      case 'UNDER_REVIEW': return 'status-review';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      default: return '';
    }
  };

  if (loading) {
    return;
  }

  return (
    <div className="aap-admin-appeal-page">
      <div className="aap-page-header">
        <div>
          <h1>Bursary Appeals</h1>
          <p>Review and process financial aid applications</p>
        </div>
        <button className="aap-refresh-btn" onClick={fetchAppeals}>
          <MdRefresh /> Refresh
        </button>
      </div>

      {error && (
        <div className="aap-error-alert">
          <MdWarning />
          <span>{error}</span>
        </div>
      )}

      {appeals.length === 0 ? (
        <div className="aap-empty-state">
          <p>No pending bursary appeals to review.</p>
        </div>
      ) : (
        <div className="aap-appeals-table-container">
          <table className="aap-appeals-table">
            <thead>
              <tr>
                <th>Appeal ID</th>
                <th>Student</th>
                <th>Title</th>
                <th>Income Bracket</th>
                <th>Department</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appeals.map((appeal) => (
                <tr key={appeal.id}>
                  <td className="aap-appeal-id">{appeal.appeal_id?.slice(0, 8)}...</td>
                  <td>
                    <div className="aap-student-info">
                      <strong>{appeal.student_name}</strong>
                      <span className="aap-student-detail">{appeal.student?.username}</span>
                    </div>
                  </td>
                  <td>{appeal.title}</td>
                  <td>
                    <span className="aap-income-badge">
                      {appeal.family_income_bracket}
                    </span>
                  </td>
                  <td>{appeal.department_name}</td>
                  <td>{formatDate(appeal.created_at)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(appeal.status)}`}>
                      {appeal.status}
                    </span>
                  </td>
                  <td className="aap-actions">
                    <button
                      className="aap-action-btn-view-btn"
                      onClick={() => handleViewDetails(appeal)}
                      title="View Details"
                    >
                      <MdVisibility />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for viewing/processing appeal */}
      {modalOpen && selectedAppeal && (
        <div className="aap-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="aap-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="aap-modal-header">
              <h2>Bursary Appeal Details</h2>
              <button className="aap-close-btn" onClick={() => setModalOpen(false)}>
                <MdClose />
              </button>
            </div>

            <div className="aap-modal-content">
              <div className="aap-appeal-info">
                <div className="aap-info-row">
                  <label>Appeal ID:</label>
                  <span className = "user-bursary-data">{selectedAppeal.appeal_id}</span>
                </div>
                <div className="aap-info-row">
                  <label>Student:</label>
                  <span className = "user-bursary-data">{selectedAppeal.student_name}</span>
                </div>
                <div className="aap-info-row">
                  <label>Title:</label>
                  <span className = "user-bursary-data">{selectedAppeal.title}</span>
                </div>
                <div className="aap-info-row">
                  <label>Department:</label>
                  <span className = "user-bursary-data">{selectedAppeal.department_name}</span>
                </div>
                <div className="aap-info-row">
                  <label>Faculty:</label>
                  <span className = "user-bursary-data">{selectedAppeal.faculty_name}</span>
                </div>
                <div className="aap-info-row">
                  <label>Batch:</label>
                  <span className = "user-bursary-data">{selectedAppeal.batch_name || 'N/A'}</span>
                </div>
                <div className="aap-info-row">
                  <label>Academic Year:</label>
                  <span className = "user-bursary-data">{selectedAppeal.academic_year}</span>
                </div>
                <div className="aap-info-row">
                  <label>Description:</label>
                  <p className="aap-description-text">{selectedAppeal.description}</p>
                </div>
              </div>

              <div className="aap-type-specific">
                <h3>Financial Details</h3>
                <div className="aap-info-row">
                  <label>Family Income Bracket:</label>
                  <span className = "user-bursary-data">{selectedAppeal.family_income_bracket}</span>
                </div>
                <div className="aap-info-row">
                  <label>Has Scholarship:</label>
                  <span className = "user-bursary-data">{selectedAppeal.has_scholarship ? 'Yes' : 'No'}</span>
                </div>
                <div className="aap-info-row">
                  <label>Reason for Aid:</label>
                  <p className = "user-bursary-data">{selectedAppeal.reason_for_aid}</p>
                </div>
                <div className="aap-info-row">
                  <label>Income Certificate:</label>
                  {selectedAppeal.income_certificate ? (
                    <button 
                      className="aap-download-btn"
                      onClick={() => handleDownload(selectedAppeal.income_certificate, 'income_certificate')}
                    >
                      <MdDownload /> Download
                    </button>
                  ) : (
                    <span className = "user-bursary-data">No file</span>
                  )}
                </div>
                <div className="aap-info-row">
                  <label>Bank Statements:</label>
                  {selectedAppeal.bank_statements ? (
                    <button 
                      className="aap-download-btn"
                      onClick={() => handleDownload(selectedAppeal.bank_statements, 'bank_statements')}
                    >
                      <MdDownload /> Download
                    </button>
                  ) : (
                    <span className = "user-bursary-data">No file</span>
                  )}
                </div>
                <div className="aap-info-row">
                  <label>Approved Amount (LKR):</label>
                  <input
                    type="number"
                    className="aap-process-input"
                    placeholder="Enter approved amount"
                    value={processData.approved_amount}
                    onChange={(e) => setProcessData({ ...processData, approved_amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="aap-review-section">
                <h3>Review Notes</h3>
                <textarea
                  className="aap-review-notes"
                  rows="4"
                  placeholder="Enter review notes..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>

              <div className="aap-modal-actions">
                <button
                  className="aap-reject-btn"
                  onClick={() => handleProcess('reject')}
                  disabled={processing}
                >
                  <MdCancel /> Reject
                </button>
                <button
                  className="aap-approve-btn"
                  onClick={() => handleProcess('approve')}
                  disabled={processing}
                >
                  <MdCheckCircle /> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBursaryAppeals;