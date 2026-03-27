// src/modules/lms/pages/Admin-Appeal/AdminExamRewriteAppeals.jsx
import { useState, useEffect } from 'react';
import request from '../../../../utils/requestMethods';
import { MdRefresh, MdVisibility, MdCheckCircle, MdCancel, MdWarning, MdDownload, MdClose ,MdDelete} from 'react-icons/md';
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
    return;
  }

  return (
    <div className="aap-admin-appeal-page">
      <div className="aap-page-header">
        <div>
          <h1>Exam Rewrite Appeals</h1>
          <p>Review and process exam rescheduling requests</p>
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
          <p>No pending exam rewrite appeals to review.</p>
        </div>
      ) : (
        <div className="aap-appeals-table-container">
          <table className="aap-appeals-table">
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
                  <td className="aap-appeal-id">{appeal.appeal_id?.slice(0, 8)}...</td>
                  <td>
                    <div className="aap-student-info">
                      <strong>{appeal.student_name}</strong>
                      <span className="aap-student-detail">{appeal.student?.username}</span>
                    </div>
                  </td>
                  <td>{appeal.course_name || appeal.course?.name}</td>
                  <td>{appeal.module_name || appeal.module?.name}</td>
                  <td>{appeal.semester}</td>
                  <td>
                    <span className="aap-reason-badge">
                      {getReasonTypeDisplay(appeal.reason_type)}
                    </span>
                  </td>
                  <td>{formatDate(appeal.original_exam_date)}</td>
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
              <h2>Exam Rewrite Appeal Details</h2>
              <button className="aap-close-btn" onClick={() => setModalOpen(false)}>
                <MdClose />
              </button>
            </div>

            <div className="aap-modal-content">
              <div className="aap-appeal-info">
                <div className="aap-info-row">
                  <label>Appeal ID:</label>
                  <span className = "user-examrw-data">{selectedAppeal.appeal_id}</span>
                </div>
                <div className="aap-info-row">
                  <label>Student:</label>
                  <span className = "user-examrw-data">{selectedAppeal.student_name}</span>
                </div>
                <div className="aap-info-row">
                  <label>Title:</label>
                  <span className = "user-examrw-data">{selectedAppeal.title}</span>
                </div>
                <div className="aap-info-row">
                  <label>Department:</label>
                  <span className = "user-examrw-data">{selectedAppeal.department_name}</span>
                </div>
                <div className="aap-info-row">
                  <label>Faculty:</label>
                  <span className = "user-examrw-data">{selectedAppeal.faculty_name}</span>
                </div>
                <div className="aap-info-row">
                  <label>Batch:</label>
                  <span className = "user-examrw-data">{selectedAppeal.batch_name || 'N/A'}</span>
                </div>
                <div className="aap-info-row">
                  <label>Academic Year:</label>
                  <span className = "user-examrw-data">{selectedAppeal.academic_year}</span>
                </div>
                <div className="aap-info-row">
                  <label>Description:</label>
                  <p className="aap-description-text">{selectedAppeal.description}</p>
                </div>
              </div>

              <div className="aap-type-specific">
                <h3>Exam Details</h3>
                <div className="aap-info-row">
                  <label>Course:</label>
                  <span className = "user-examrw-data">{selectedAppeal.course_name || selectedAppeal.course?.name}</span>
                </div>
                <div className="aap-info-row">
                  <label>Module:</label>
                  <span className = "user-examrw-data">{selectedAppeal.module_name || selectedAppeal.module?.name}</span>
                </div>
                <div className="aap-info-row">
                  <label>Semester:</label>
                  <span className = "user-examrw-data">{selectedAppeal.semester}</span>
                </div>
                <div className="aap-info-row">
                  <label>Original Exam Date:</label>
                  <span className = "user-examrw-data">{formatDate(selectedAppeal.original_exam_date)}</span>
                </div>
                <div className="aap-info-row">
                  <label>Reason Type:</label>
                  <span className="aap-reason-badge">{getReasonTypeDisplay(selectedAppeal.reason_type)}</span>
                </div>
                <div className="aap-info-row">
                  <label>Detailed Reason:</label>
                  <p className = "user-examrw-data">{selectedAppeal.detailed_reason}</p>
                </div>
                {selectedAppeal.medical_certificate && (
                  <div className="aap-info-row">
                    <label>Medical Certificate:</label>
                    <button 
                      className="aap-download-btn"
                      onClick={() => handleDownload(selectedAppeal.medical_certificate, 'medical_certificate')}
                    >
                      <MdDownload /> Download
                    </button>
                  </div>
                )}
                <div className="aap-info-row">
                  <label>New Exam Date:</label>
                  <input
                    type="date"
                    className="aap-process-input"
                    value={processData.new_exam_date}
                    onChange={(e) => setProcessData({ ...processData, new_exam_date: e.target.value })}
                  />
                </div>
                <div className="aap-info-row">
                  <label>Exam Venue:</label>
                  <input
                    type="text"
                    className="aap-process-input"
                    placeholder="Enter exam venue"
                    value={processData.exam_venue}
                    onChange={(e) => setProcessData({ ...processData, exam_venue: e.target.value })}
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

export default AdminExamRewriteAppeals;