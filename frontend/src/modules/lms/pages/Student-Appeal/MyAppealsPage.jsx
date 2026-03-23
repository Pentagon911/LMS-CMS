// src/modules/lms/pages/MyAppealsPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import request from '../../../../utils/requestMethods';
import {
  MdRefresh,
  MdWarning,
  MdReceipt,
  MdHome,
  MdEditNote,
  MdLocalHospital,
  MdAssessment,
  MdVisibility,
  MdDownload
} from 'react-icons/md';
import './MyAppealsPage.css';

const MyAppealsPage = () => {
  const navigate = useNavigate();
  const [appeals, setAppeals] = useState({
    bursary: [],
    hostel: [],
    exam_rewrite: [],
    medical_leave: [],
    result_reevaluation: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchAllAppeals();
  }, []);

  const fetchAllAppeals = async () => {
    setLoading(true);
    try {
      const response = await request.GET('/lms/appeals/my/');
      setAppeals(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching appeals:', err);
      setError(err.message || 'Failed to load appeals.');
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
      case 'PENDING': return 'status-pending';
      case 'UNDER_REVIEW': return 'status-review';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      default: return '';
    }
  };

  const getAppealIcon = (type) => {
    switch (type) {
      case 'bursary': return <MdReceipt />;
      case 'hostel': return <MdHome />;
      case 'exam_rewrite': return <MdEditNote />;
      case 'medical_leave': return <MdLocalHospital />;
      case 'result_reevaluation': return <MdAssessment />;
      default: return <MdVisibility />;
    }
  };

  const getAppealTitle = (type) => {
    switch (type) {
      case 'bursary': return 'Bursary Application';
      case 'hostel': return 'Hostel Application';
      case 'exam_rewrite': return 'Exam Rewrite Appeal';
      case 'medical_leave': return 'Medical Leave Application';
      case 'result_reevaluation': return 'Result Re-evaluation Appeal';
      default: return type;
    }
  };

  const handleViewDetails = (appeal, type) => {
    setSelectedAppeal({ ...appeal, type });
    setModalOpen(true);
  };

  const handleDownload = (fileUrl, fileName) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="my-appeals-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your appeals...</p>
        </div>
      </div>
    );
  }

  const allAppeals = [
    ...appeals.bursary.map(a => ({ ...a, appeal_type: 'bursary' })),
    ...appeals.hostel.map(a => ({ ...a, appeal_type: 'hostel' })),
    ...appeals.exam_rewrite.map(a => ({ ...a, appeal_type: 'exam_rewrite' })),
    ...appeals.medical_leave.map(a => ({ ...a, appeal_type: 'medical_leave' })),
    ...appeals.result_reevaluation.map(a => ({ ...a, appeal_type: 'result_reevaluation' }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="my-appeals-container">
      <div className="page-header">
        <div>
          <h1>My Appeals</h1>
          <p>Track and manage all your submitted appeals</p>
        </div>
        <button className="refresh-btn" onClick={fetchAllAppeals}>
          <MdRefresh /> Refresh
        </button>
      </div>

      {error && (
        <div className="error-alert">
          <MdWarning />
          <span>{error}</span>
        </div>
      )}

      {allAppeals.length === 0 ? (
        <div className="empty-state">
          <p>You haven't submitted any appeals yet.</p>
          <button 
            className="new-appeal-btn"
            onClick={() => navigate('/lms/student/appeals')}
          >
            Submit New Appeal
          </button>
        </div>
      ) : (
        <div className="appeals-list">
          {allAppeals.map((appeal) => (
            <div key={appeal.id} className="appeal-card">
              <div className="appeal-header">
                <div className="appeal-type-icon">
                  {getAppealIcon(appeal.appeal_type)}
                </div>
                <div className="appeal-info">
                  <h3>{getAppealTitle(appeal.appeal_type)}</h3>
                  <p className="appeal-title">{appeal.title}</p>
                </div>
                <div className="appeal-status">
                  <span className={`status-badge ${getStatusBadgeClass(appeal.status)}`}>
                    {appeal.status}
                  </span>
                </div>
              </div>
              
              <div className="appeal-details">
                <div className="detail-row">
                  <span className="detail-label">Appeal ID:</span>
                  <span className="detail-value">{appeal.appeal_id?.slice(0, 8)}...</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Submitted:</span>
                  <span className="detail-value">{formatDate(appeal.created_at)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Department:</span>
                  <span className="detail-value">{appeal.department_name}</span>
                </div>
                {appeal.review_notes && (
                  <div className="detail-row">
                    <span className="detail-label">Review Notes:</span>
                    <span className="detail-value">{appeal.review_notes}</span>
                  </div>
                )}
              </div>

              <div className="appeal-actions">
                <button 
                  className="view-btn"
                  onClick={() => handleViewDetails(appeal, appeal.appeal_type)}
                >
                  <MdVisibility /> View Details
                </button>
                {appeal.supporting_documents && (
                  <button 
                    className="download-btn"
                    onClick={() => handleDownload(appeal.supporting_documents, 'document')}
                  >
                    <MdDownload /> Documents
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for viewing appeal details */}
      {modalOpen && selectedAppeal && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{getAppealTitle(selectedAppeal.type)} Details</h2>
              <button className="close-btn" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="detail-section">
                <h3>Appeal Information</h3>
                <div className="detail-row">
                  <label>Appeal ID:</label>
                  <span>{selectedAppeal.appeal_id}</span>
                </div>
                <div className="detail-row">
                  <label>Title:</label>
                  <span>{selectedAppeal.title}</span>
                </div>
                <div className="detail-row">
                  <label>Status:</label>
                  <span className={`status-badge ${getStatusBadgeClass(selectedAppeal.status)}`}>
                    {selectedAppeal.status}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Submitted:</label>
                  <span>{formatDate(selectedAppeal.created_at)}</span>
                </div>
                <div className="detail-row">
                  <label>Last Updated:</label>
                  <span>{formatDate(selectedAppeal.updated_at)}</span>
                </div>
                <div className="detail-row">
                  <label>Description:</label>
                  <p>{selectedAppeal.description}</p>
                </div>
              </div>

              {selectedAppeal.review_notes && (
                <div className="detail-section">
                  <h3>Review Information</h3>
                  <div className="detail-row">
                    <label>Review Notes:</label>
                    <p>{selectedAppeal.review_notes}</p>
                  </div>
                  {selectedAppeal.reviewed_at && (
                    <div className="detail-row">
                      <label>Reviewed On:</label>
                      <span>{formatDate(selectedAppeal.reviewed_at)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Type-specific details */}
              {selectedAppeal.type === 'bursary' && (
                <div className="detail-section">
                  <h3>Financial Details</h3>
                  <div className="detail-row">
                    <label>Income Bracket:</label>
                    <span>{selectedAppeal.family_income_bracket}</span>
                  </div>
                  <div className="detail-row">
                    <label>Has Scholarship:</label>
                    <span>{selectedAppeal.has_scholarship ? 'Yes' : 'No'}</span>
                  </div>
                  {selectedAppeal.approved_amount && (
                    <div className="detail-row">
                      <label>Approved Amount:</label>
                      <span>LKR {selectedAppeal.approved_amount}</span>
                    </div>
                  )}
                </div>
              )}

              {selectedAppeal.type === 'hostel' && (
                <div className="detail-section">
                  <h3>Accommodation Details</h3>
                  <div className="detail-row">
                    <label>Preferred Check-in:</label>
                    <span>{formatDate(selectedAppeal.preferred_check_in)}</span>
                  </div>
                  <div className="detail-row">
                    <label>Duration:</label>
                    <span>{selectedAppeal.duration_months} months</span>
                  </div>
                  {selectedAppeal.allocated_room_number && (
                    <>
                      <div className="detail-row">
                        <label>Allocated Room:</label>
                        <span>{selectedAppeal.allocated_room_number}</span>
                      </div>
                      <div className="detail-row">
                        <label>Allocated Hostel:</label>
                        <span>{selectedAppeal.allocated_hostel}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {selectedAppeal.type === 'exam_rewrite' && (
                <div className="detail-section">
                  <h3>Exam Details</h3>
                  <div className="detail-row">
                    <label>Course:</label>
                    <span>{selectedAppeal.course_name}</span>
                  </div>
                  <div className="detail-row">
                    <label>Module:</label>
                    <span>{selectedAppeal.module_name}</span>
                  </div>
                  <div className="detail-row">
                    <label>Semester:</label>
                    <span>{selectedAppeal.semester}</span>
                  </div>
                  <div className="detail-row">
                    <label>Original Exam Date:</label>
                    <span>{formatDate(selectedAppeal.original_exam_date)}</span>
                  </div>
                  {selectedAppeal.new_exam_date && (
                    <>
                      <div className="detail-row">
                        <label>New Exam Date:</label>
                        <span>{formatDate(selectedAppeal.new_exam_date)}</span>
                      </div>
                      <div className="detail-row">
                        <label>Exam Venue:</label>
                        <span>{selectedAppeal.exam_venue}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {selectedAppeal.type === 'medical_leave' && (
                <div className="detail-section">
                  <h3>Medical Leave Details</h3>
                  <div className="detail-row">
                    <label>Leave Period:</label>
                    <span>{formatDate(selectedAppeal.start_date)} - {formatDate(selectedAppeal.end_date)}</span>
                  </div>
                  <div className="detail-row">
                    <label>Diagnosis:</label>
                    <span>{selectedAppeal.diagnosis}</span>
                  </div>
                  <div className="detail-row">
                    <label>Hospital:</label>
                    <span>{selectedAppeal.hospital_name}</span>
                  </div>
                  {selectedAppeal.approved_leave_days && (
                    <div className="detail-row">
                      <label>Approved Leave Days:</label>
                      <span>{selectedAppeal.approved_leave_days} days</span>
                    </div>
                  )}
                </div>
              )}

              {selectedAppeal.type === 'result_reevaluation' && (
                <div className="detail-section">
                  <h3>Re-evaluation Details</h3>
                  <div className="detail-row">
                    <label>Exam:</label>
                    <span>{selectedAppeal.exam_title}</span>
                  </div>
                  <div className="detail-row">
                    <label>Original Score:</label>
                    <span>{selectedAppeal.exam_result_details?.score}</span>
                  </div>
                  <div className="detail-row">
                    <label>Original Grade:</label>
                    <span>{selectedAppeal.exam_result_details?.grade}</span>
                  </div>
                  {selectedAppeal.new_grade && (
                    <>
                      <div className="detail-row">
                        <label>New Score:</label>
                        <span>{selectedAppeal.new_marks}</span>
                      </div>
                      <div className="detail-row">
                        <label>New Grade:</label>
                        <span>{selectedAppeal.new_grade}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppealsPage;