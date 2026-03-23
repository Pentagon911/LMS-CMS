// src/modules/lms/pages/Admin-Appeal/AdminResultReevalAppeals.jsx
import { useState, useEffect } from 'react';
import request from '../../../../utils/requestMethods';
import { MdRefresh, MdVisibility, MdCheckCircle, MdCancel, MdWarning, MdDownload, MdClose } from 'react-icons/md';
import './AdminAppealPage.css';

const AdminResultReevalAppeals = () => {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processData, setProcessData] = useState({
    new_marks: '',
    new_grade: '',
    review_comments: ''
  });

  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    setLoading(true);
    try {
      const response = await request.GET('/lms/admin/appeals/result-reeval/pending/');
      setAppeals(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching result reevaluation appeals:', err);
      setError(err.message || 'Failed to load appeals.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (appeal) => {
    setSelectedAppeal(appeal);
    setReviewNotes(appeal.review_notes || '');
    setProcessData({
      new_marks: appeal.new_marks || '',
      new_grade: appeal.new_grade || '',
      review_comments: appeal.review_comments || ''
    });
    setModalOpen(true);
  };

  const handleProcess = async (decision) => {
    if (!selectedAppeal) return;
    
    setProcessing(true);
    try {
      const payload = {
        decision,
        notes: reviewNotes,
        new_marks: processData.new_marks,
        new_grade: processData.new_grade,
        review_comments: processData.review_comments
      };
      
      await request.POST(`/lms/admin/appeals/result-reeval/${selectedAppeal.id}/process/`, payload);
      
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

  const getReasonTypeDisplay = (reasonType) => {
    const reasons = {
      'CALCULATION': 'Marks Calculation Error',
      'PAPER_REVIEW': 'Paper Review Request',
      'GRADE_BOUNDARY': 'Grade Boundary Issue',
      'OTHER': 'Other'
    };
    return reasons[reasonType] || reasonType;
  };

  if (loading) {
    return (
      <div className="admin-appeal-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading result re-evaluation appeals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-appeal-page">
      <div className="page-header">
        <div>
          <h1>Result Re-evaluation Appeals</h1>
          <p>Review and process grade review requests</p>
        </div>
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
          <p>No pending result re-evaluation appeals to review.</p>
        </div>
      ) : (
        <div className="appeals-table-container">
          <table className="appeals-table">
            <thead>
              <tr>
                <th>Appeal ID</th>
                <th>Student</th>
                <th>Exam</th>
                <th>Current Score</th>
                <th>Current Grade</th>
                <th>Reason Type</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appeals.map((appeal) => (
                <tr key={appeal.id}>
                  <td className="appeal-id">{appeal.appeal_id?.slice(0, 8)}...</td>
                  <td>
                    <div className="student-info">
                      <strong>{appeal.student_name}</strong>
                      <span className="student-detail">{appeal.student?.username}</span>
                    </div>
                  </td>
                  <td>{appeal.exam_title || appeal.exam_result?.exam?.title}</td>
                  <td>{appeal.exam_result?.score || 'N/A'}</td>
                  <td>
                    <span className="grade-badge">{appeal.exam_result?.grade || 'N/A'}</span>
                  </td>
                  <td>
                    <span className="reason-badge">
                      {getReasonTypeDisplay(appeal.reason_type)}
                    </span>
                  </td>
                  <td>{formatDate(appeal.created_at)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(appeal.status)}`}>
                      {appeal.status}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className="action-btn view-btn"
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
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Result Re-evaluation Appeal Details</h2>
              <button className="close-btn" onClick={() => setModalOpen(false)}>
                <MdClose />
              </button>
            </div>

            <div className="modal-content">
              <div className="appeal-info">
                <div className="info-row">
                  <label>Appeal ID:</label>
                  <span>{selectedAppeal.appeal_id}</span>
                </div>
                <div className="info-row">
                  <label>Student:</label>
                  <span>{selectedAppeal.student_name}</span>
                </div>
                <div className="info-row">
                  <label>Title:</label>
                  <span>{selectedAppeal.title}</span>
                </div>
                <div className="info-row">
                  <label>Department:</label>
                  <span>{selectedAppeal.department_name}</span>
                </div>
                <div className="info-row">
                  <label>Faculty:</label>
                  <span>{selectedAppeal.faculty_name}</span>
                </div>
                <div className="info-row">
                  <label>Batch:</label>
                  <span>{selectedAppeal.batch_name || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <label>Academic Year:</label>
                  <span>{selectedAppeal.academic_year}</span>
                </div>
                <div className="info-row">
                  <label>Description:</label>
                  <p className="description-text">{selectedAppeal.description}</p>
                </div>
              </div>

              <div className="type-specific">
                <h3>Exam Result Details</h3>
                <div className="info-row">
                  <label>Exam:</label>
                  <span>{selectedAppeal.exam_title || selectedAppeal.exam_result?.exam?.title}</span>
                </div>
                <div className="info-row">
                  <label>Current Score:</label>
                  <span>{selectedAppeal.exam_result?.score} / 100</span>
                </div>
                <div className="info-row">
                  <label>Current Grade:</label>
                  <span className="grade-badge">{selectedAppeal.exam_result?.grade || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <label>Reason Type:</label>
                  <span className="reason-badge">{getReasonTypeDisplay(selectedAppeal.reason_type)}</span>
                </div>
                <div className="info-row">
                  <label>Specific Concerns:</label>
                  <p>{selectedAppeal.specific_concerns}</p>
                </div>
                <div className="info-row">
                  <label>New Marks:</label>
                  <input
                    type="number"
                    step="0.01"
                    className="process-input"
                    placeholder="Enter new marks (0-100)"
                    value={processData.new_marks}
                    onChange={(e) => setProcessData({ ...processData, new_marks: e.target.value })}
                  />
                </div>
                <div className="info-row">
                  <label>New Grade:</label>
                  <select
                    className="process-input"
                    value={processData.new_grade}
                    onChange={(e) => setProcessData({ ...processData, new_grade: e.target.value })}
                  >
                    <option value="">Select grade</option>
                    <option value="A+">A+ (4.0)</option>
                    <option value="A">A (4.0)</option>
                    <option value="A-">A- (3.7)</option>
                    <option value="B+">B+ (3.3)</option>
                    <option value="B">B (3.0)</option>
                    <option value="B-">B- (2.7)</option>
                    <option value="C+">C+ (2.3)</option>
                    <option value="C">C (2.0)</option>
                    <option value="C-">C- (1.7)</option>
                    <option value="D+">D+ (1.3)</option>
                    <option value="D">D (1.0)</option>
                    <option value="F">F (0.0)</option>
                  </select>
                </div>
                <div className="info-row">
                  <label>Review Comments:</label>
                  <textarea
                    className="process-textarea"
                    rows="3"
                    placeholder="Enter review comments"
                    value={processData.review_comments}
                    onChange={(e) => setProcessData({ ...processData, review_comments: e.target.value })}
                  />
                </div>
              </div>

              <div className="review-section">
                <h3>Review Notes</h3>
                <textarea
                  className="review-notes"
                  rows="4"
                  placeholder="Enter review notes..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  className="reject-btn"
                  onClick={() => handleProcess('reject')}
                  disabled={processing}
                >
                  <MdCancel /> Reject
                </button>
                <button
                  className="approve-btn"
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

export default AdminResultReevalAppeals;