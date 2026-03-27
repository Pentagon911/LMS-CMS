// src/modules/lms/pages/Student-Appeal/MyAppealsPage.jsx
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
  MdDownload,
  MdAttachFile,
  MdClose
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

  const getStatusInfo = (status) => {
    switch (status) {
      case 'PENDING':
        return { class: 'map-status-pending', label: 'Pending', icon: '⏳' };
      case 'UNDER_REVIEW':
        return { class: 'map-status-review', label: 'Under Review', icon: '👁️' };
      case 'APPROVED':
        return { class: 'map-status-approved', label: 'Approved', icon: '✓' };
      case 'REJECTED':
        return { class: 'map-status-rejected', label: 'Rejected', icon: '✗' };
      default:
        return { class: '', label: status, icon: '📋' };
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

  const getAppealColor = (type) => {
    switch (type) {
      case 'bursary': return '#4caf50';
      case 'hostel': return '#2196f3';
      case 'exam_rewrite': return '#ff9800';
      case 'medical_leave': return '#f44336';
      case 'result_reevaluation': return '#9c27b0';
      default: return '#6c5ce7';
    }
  };

  const getAppealDocuments = (appeal) => {
    const documents = [];
    
    if (appeal.supporting_documents) {
      documents.push({ name: 'Supporting Document', url: appeal.supporting_documents });
    }
    
    if (appeal.appeal_type === 'bursary') {
      if (appeal.income_certificate) documents.push({ name: 'Income Certificate', url: appeal.income_certificate });
      if (appeal.bank_statements) documents.push({ name: 'Bank Statements', url: appeal.bank_statements });
    }
    
    if ((appeal.appeal_type === 'hostel' || appeal.appeal_type === 'exam_rewrite') && appeal.medical_certificate) {
      documents.push({ name: 'Medical Certificate', url: appeal.medical_certificate });
    }
    
    if (appeal.appeal_type === 'medical_leave') {
      if (appeal.medical_report) documents.push({ name: 'Medical Report', url: appeal.medical_report });
      if (appeal.hospital_letter) documents.push({ name: 'Hospital Letter', url: appeal.hospital_letter });
    }
    
    return documents;
  };

  const handleViewDetails = (appeal, type) => {
    setSelectedAppeal({ ...appeal, type });
    setModalOpen(true);
  };

  const handleDownload = (fileUrl, fileName) => {
    if (fileUrl) {
      const baseUrl = request.getBaseUrl();
      const newfileUrl = `${baseUrl}${fileUrl}`
      window.open(newfileUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="map-container">
        <div className="map-loading">
          <div className="map-spinner"></div>
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
    <div className="map-container">
      <div className="map-header">
        <div className="map-header-title">
          <h1>My Appeals</h1>
          <p>Track and manage all your submitted appeals</p>
        </div>
        <button className="map-refresh-btn" onClick={fetchAllAppeals}>
          <MdRefresh /> Refresh
        </button>
      </div>

      {error && (
        <div className="map-error">
          <MdWarning />
          <span>{error}</span>
        </div>
      )}

      {allAppeals.length === 0 ? (
        <div className="map-empty">
          <p>You haven't submitted any appeals yet.</p>
          <button className="map-empty-btn" onClick={() => navigate('/lms/student/appeals')}>
            Submit New Appeal
          </button>
        </div>
      ) : (
        <div className="map-grid">
          {allAppeals.map((appeal) => {
            const statusInfo = getStatusInfo(appeal.status);
            const appealColor = getAppealColor(appeal.appeal_type);
            const documents = getAppealDocuments(appeal);
            const hasDocs = documents.length > 0;

            return (
              <div key={appeal.id} className="map-card">
                <div className="map-card-header" style={{ borderLeftColor: appealColor }}>
                  <div className="map-card-icon" style={{ backgroundColor: `${appealColor}15`, color: appealColor }}>
                    {getAppealIcon(appeal.appeal_type)}
                  </div>
                  <div className="map-card-info">
                    <h3>{getAppealTitle(appeal.appeal_type)}</h3>
                    <p className="map-card-title">{appeal.title}</p>
                  </div>
                  <div className={`map-status ${statusInfo.class}`}>
                    <span className="map-status-icon">{statusInfo.icon}</span>
                    <span>{statusInfo.label}</span>
                  </div>
                </div>

                <div className="map-card-details">
                  <div className="map-detail-item">
                    <span className="map-detail-label">Appeal ID</span>
                    <span className="map-detail-value">{appeal.appeal_id?.slice(0, 8)}...</span>
                  </div>
                  <div className="map-detail-item">
                    <span className="map-detail-label">Submitted</span>
                    <span className="map-detail-value">{formatDate(appeal.created_at)}</span>
                  </div>
                  <div className="map-detail-item">
                    <span className="map-detail-label">Department</span>
                    <span className="map-detail-value">{appeal.department_name}</span>
                  </div>
                  
                  {appeal.appeal_type === 'exam_rewrite' && appeal.course_name && (
                    <div className="map-detail-item">
                      <span className="map-detail-label">Course</span>
                      <span className="map-detail-value">{appeal.course_name}</span>
                    </div>
                  )}
                  
                  {appeal.appeal_type === 'hostel' && appeal.preferred_check_in && (
                    <div className="map-detail-item">
                      <span className="map-detail-label">Check-in</span>
                      <span className="map-detail-value">{formatDate(appeal.preferred_check_in)}</span>
                    </div>
                  )}
                  
                  {appeal.appeal_type === 'bursary' && appeal.family_income_bracket && (
                    <div className="map-detail-item">
                      <span className="map-detail-label">Income</span>
                      <span className="map-detail-value">{appeal.family_income_bracket}</span>
                    </div>
                  )}
                </div>

                {hasDocs && (
                  <div className="map-documents">
                    <div className="map-docs-header">
                      <MdAttachFile className="map-docs-icon" />
                      <span>Attachments ({documents.length})</span>
                    </div>
                    <div className="map-docs-list">
                      {documents.map((doc, index) => (
                        <button
                          key={index}
                          className="map-doc-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(doc.url, doc.name);
                          }}
                        >
                          <MdDownload /> {doc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="map-card-actions">
                  <button 
                    className="map-view-btn"
                    onClick={() => handleViewDetails(appeal, appeal.appeal_type)}
                  >
                    <MdVisibility /> View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && selectedAppeal && (
        <div className="map-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="map-modal" onClick={(e) => e.stopPropagation()}>
            <div className="map-modal-header">
              <div className="map-modal-title">
                <div className="map-modal-icon" style={{ color: getAppealColor(selectedAppeal.type) }}>
                  {getAppealIcon(selectedAppeal.type)}
                </div>
                <h2>{getAppealTitle(selectedAppeal.type)} Details</h2>
              </div>
              <button className="map-modal-close" onClick={() => setModalOpen(false)}>
                <MdClose />
              </button>
            </div>
            
            <div className="map-modal-body">
              <div className="map-modal-section">
                <h3>Appeal Information</h3>
                <div className="map-modal-grid">
                  <div className="map-modal-field">
                    <label>Appeal ID</label>
                    <span>{selectedAppeal.appeal_id}</span>
                  </div>
                  <div className="map-modal-field">
                    <label>Title</label>
                    <span>{selectedAppeal.title}</span>
                  </div>
                  <div className="map-modal-field">
                    <label>Status</label>
                    <span className={`map-status ${getStatusInfo(selectedAppeal.status).class}`}>
                      {getStatusInfo(selectedAppeal.status).label}
                    </span>
                  </div>
                  <div className="map-modal-field">
                    <label>Submitted</label>
                    <span>{formatDate(selectedAppeal.created_at)}</span>
                  </div>
                  <div className="map-modal-field">
                    <label>Last Updated</label>
                    <span>{formatDate(selectedAppeal.updated_at)}</span>
                  </div>
                  <div className="map-modal-field map-full-width">
                    <label>Description</label>
                    <p>{selectedAppeal.description}</p>
                  </div>
                </div>
              </div>

              {/* Type-specific details */}
              {selectedAppeal.type === 'bursary' && (
                <div className="map-modal-section">
                  <h3>Financial Details</h3>
                  <div className="map-modal-grid">
                    <div className="map-modal-field">
                      <label>Income Bracket</label>
                      <span>{selectedAppeal.family_income_bracket}</span>
                    </div>
                    <div className="map-modal-field">
                      <label>Has Scholarship</label>
                      <span>{selectedAppeal.has_scholarship ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="map-modal-field map-full-width">
                      <label>Reason for Aid</label>
                      <span>{selectedAppeal.reason_for_aid}</span>
                    </div>
                    {selectedAppeal.approved_amount && (
                      <div className="map-modal-field">
                        <label>Approved Amount</label>
                        <span className="map-highlight">LKR {selectedAppeal.approved_amount}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedAppeal.type === 'hostel' && (
                <div className="map-modal-section">
                  <h3>Accommodation Details</h3>
                  <div className="map-modal-grid">
                    <div className="map-modal-field">
                      <label>Preferred Check-in</label>
                      <span>{formatDate(selectedAppeal.preferred_check_in)}</span>
                    </div>
                    <div className="map-modal-field">
                      <label>Duration</label>
                      <span>{selectedAppeal.duration_months} months</span>
                    </div>
                    {selectedAppeal.special_requirements && (
                      <div className="map-modal-field map-full-width">
                        <label>Special Requirements</label>
                        <span>{selectedAppeal.special_requirements}</span>
                      </div>
                    )}
                    {selectedAppeal.allocated_room_number && (
                      <>
                        <div className="map-modal-field">
                          <label>Allocated Room</label>
                          <span>{selectedAppeal.allocated_room_number}</span>
                        </div>
                        <div className="map-modal-field">
                          <label>Allocated Hostel</label>
                          <span>{selectedAppeal.allocated_hostel}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {selectedAppeal.type === 'exam_rewrite' && (
                <div className="map-modal-section">
                  <h3>Exam Details</h3>
                  <div className="map-modal-grid">
                    <div className="map-modal-field">
                      <label>Course</label>
                      <span>{selectedAppeal.course_name}</span>
                    </div>
                    <div className="map-modal-field">
                      <label>Semester</label>
                      <span>{selectedAppeal.semester}</span>
                    </div>
                    <div className="map-modal-field">
                      <label>Original Exam Date</label>
                      <span>{formatDate(selectedAppeal.original_exam_date)}</span>
                    </div>
                    <div className="map-modal-field">
                      <label>Reason Type</label>
                      <span>{selectedAppeal.reason_type}</span>
                    </div>
                    <div className="map-modal-field map-full-width">
                      <label>Detailed Reason</label>
                      <span>{selectedAppeal.detailed_reason}</span>
                    </div>
                    {selectedAppeal.new_exam_date && (
                      <>
                        <div className="map-modal-field">
                          <label>New Exam Date</label>
                          <span>{formatDate(selectedAppeal.new_exam_date)}</span>
                        </div>
                        <div className="map-modal-field">
                          <label>Exam Venue</label>
                          <span>{selectedAppeal.exam_venue}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {selectedAppeal.type === 'medical_leave' && (
                <div className="map-modal-section">
                  <h3>Medical Leave Details</h3>
                  <div className="map-modal-grid">
                    <div className="map-modal-field">
                      <label>Leave Period</label>
                      <span>{formatDate(selectedAppeal.start_date)} - {formatDate(selectedAppeal.end_date)}</span>
                    </div>
                    <div className="map-modal-field">
                      <label>Diagnosis</label>
                      <span>{selectedAppeal.diagnosis || 'Not specified'}</span>
                    </div>
                    <div className="map-modal-field">
                      <label>Hospital</label>
                      <span>{selectedAppeal.hospital_name}</span>
                    </div>
                    <div className="map-modal-field">
                      <label>Doctor</label>
                      <span>{selectedAppeal.doctor_name}</span>
                    </div>
                    {selectedAppeal.approved_leave_days && (
                      <div className="map-modal-field">
                        <label>Approved Leave Days</label>
                        <span className="map-highlight">{selectedAppeal.approved_leave_days} days</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedAppeal.type === 'result_reevaluation' && (
                <div className="map-modal-section">
                  <h3>Re-evaluation Details</h3>
                  <div className="map-modal-grid">
                    <div className="map-modal-field">
                      <label>Exam</label>
                      <span>{selectedAppeal.exam_result_details['exam_title']}</span>
                    </div>
                    <div className="map-modal-field">
                      <label>Original Score</label>
                      <span>{selectedAppeal.exam_result_details?.score || 'N/A'}</span>
                    </div>
                    <div className="map-modal-field">
                      <label>Original Grade</label>
                      <span>{selectedAppeal.exam_result_details?.grade || 'N/A'}</span>
                    </div>
                    <div className="map-modal-field">
                      <label>Reason Type</label>
                      <span>{selectedAppeal.reason_type}</span>
                    </div>
                    <div className="map-modal-field map-full-width">
                      <label>Specific Concerns</label>
                      <span>{selectedAppeal.specific_concerns}</span>
                    </div>
                    {selectedAppeal.new_grade && (
                      <>
                        <div className="map-modal-field">
                          <label>New Score</label>
                          <span className="map-highlight">{selectedAppeal.new_marks}</span>
                        </div>
                        <div className="map-modal-field">
                          <label>New Grade</label>
                          <span className="map-highlight">{selectedAppeal.new_grade}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {getAppealDocuments(selectedAppeal).length > 0 && (
                <div className="map-modal-section">
                  <h3>Documents</h3>
                  <div className="map-modal-docs">
                    {getAppealDocuments(selectedAppeal).map((doc, index) => (
                      <button
                        key={index}
                        className="map-modal-doc-btn"
                        onClick={() => handleDownload(doc.url, doc.name)}
                      >
                        <MdDownload /> {doc.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedAppeal.review_notes && (
                <div className="map-modal-section">
                  <h3>Review Information</h3>
                  <div className="map-review-notes">
                    <p>{selectedAppeal.review_notes}</p>
                    {selectedAppeal.reviewed_at && (
                      <div className="map-review-meta">Reviewed on {formatDate(selectedAppeal.reviewed_at)}</div>
                    )}
                  </div>
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