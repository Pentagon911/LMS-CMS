// src/modules/lms/pages/Admin-Appeal/AdminExamRewriteAppeals.jsx
import { useState, useEffect } from 'react';
import request from '../../../../utils/requestMethods';
import { MdRefresh, MdVisibility, MdCheckCircle, MdCancel, MdWarning, MdDownload, MdClose } from 'react-icons/md';
import './AdminAppealPage.css';

const AdminExamRewriteAppeals = () => {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processData, setProcessData] = useState({
    new_exam_date: '',
    exam_venue: ''
  });

  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    setLoading(true);
    try {
      const response = await request.GET('/lms/admin/appeals/exam-rewrite/pending/');
      setAppeals(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching exam rewrite appeals:', err);
      setError(err.message || 'Failed to load appeals.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (appeal) => {
    setSelectedAppeal(appeal);
    setReviewNotes(appeal.review_notes || '');
    setProcessData({
      new_exam_date: appeal.new_exam_date || '',
      exam_venue: appeal.exam_venue || ''
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
        new_exam_date: processData.new_exam_date,
        exam_venue: processData.exam_venue
      };
      
      await request.POST(`/lms/admin/appeals/exam-rewrite/${selectedAppeal.id}/process/`, payload);
      
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

  const getReasonTypeDisplay = (reasonType) => {
    const reasons = {
      'MEDICAL': 'Medical Grounds',
      'CONFLICT': 'Exam Conflict',
      'PERSONAL': 'Personal Circumstances',
      'OTHER': 'Other'
    };
    return reasons[reasonType] || reasonType;
  };

  if (loading) {
    return (
      <div className="admin-appeal-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading exam rewrite appeals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-appeal-page">
      <div className="page-header">
        <div>
          <h1>Exam Rewrite Appeals</h1>
          <p>Review and process exam rescheduling requests</p>
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
          <p>No pending exam rewrite appeals to review.</p>
        </div>
      ) : (
        <div className="appeals-table-container">
          <table className="appeals-table">
            <thead>
              <tr>
                <th>Appeal ID</th>
                <th>Student</th>
                <th>Course</th>
                <th>Module</th>
                <th>Semester</th>
                <th>Reason Type</th>
                <th>Original Exam Date</th>
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
                  <td>{appeal.course_name || appeal.course?.name}</td>
                  <td>{appeal.module_name || appeal.module?.name}</td>
                  <td>{appeal.semester}</td>
                  <td>
                    <span className="reason-badge">
                      {getReasonTypeDisplay(appeal.reason_type)}
                    </span>
                  </td>
                  <td>{formatDate(appeal.original_exam_date)}</td>
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
              <h2>Exam Rewrite Appeal Details</h2>
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
                <h3>Exam Details</h3>
                <div className="info-row">
                  <label>Course:</label>
                  <span>{selectedAppeal.course_name || selectedAppeal.course?.name}</span>
                </div>
                <div className="info-row">
                  <label>Module:</label>
                  <span>{selectedAppeal.module_name || selectedAppeal.module?.name}</span>
                </div>
                <div className="info-row">
                  <label>Semester:</label>
                  <span>{selectedAppeal.semester}</span>
                </div>
                <div className="info-row">
                  <label>Original Exam Date:</label>
                  <span>{formatDate(selectedAppeal.original_exam_date)}</span>
                </div>
                <div className="info-row">
                  <label>Reason Type:</label>
                  <span className="reason-badge">{getReasonTypeDisplay(selectedAppeal.reason_type)}</span>
                </div>
                <div className="info-row">
                  <label>Detailed Reason:</label>
                  <p>{selectedAppeal.detailed_reason}</p>
                </div>
                {selectedAppeal.medical_certificate && (
                  <div className="info-row">
                    <label>Medical Certificate:</label>
                    <button 
                      className="download-btn"
                      onClick={() => handleDownload(selectedAppeal.medical_certificate, 'medical_certificate')}
                    >
                      <MdDownload /> Download
                    </button>
                  </div>
                )}
                <div className="info-row">
                  <label>New Exam Date:</label>
                  <input
                    type="date"
                    className="process-input"
                    value={processData.new_exam_date}
                    onChange={(e) => setProcessData({ ...processData, new_exam_date: e.target.value })}
                  />
                </div>
                <div className="info-row">
                  <label>Exam Venue:</label>
                  <input
                    type="text"
                    className="process-input"
                    placeholder="Enter exam venue"
                    value={processData.exam_venue}
                    onChange={(e) => setProcessData({ ...processData, exam_venue: e.target.value })}
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

export default AdminExamRewriteAppeals;