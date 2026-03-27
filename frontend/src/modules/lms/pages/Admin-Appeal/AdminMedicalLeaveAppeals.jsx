// src/modules/lms/pages/Admin-Appeal/AdminMedicalLeaveAppeals.jsx
import { useState, useEffect } from 'react';
import request from '../../../../utils/requestMethods';
import { MdRefresh, MdVisibility, MdCheckCircle, MdCancel, MdWarning, MdDownload, MdClose } from 'react-icons/md';
import './AdminAppealPage.css';

const AdminMedicalLeaveAppeals = () => {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processData, setProcessData] = useState({
    approved_leave_days: ''
  });

  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    setLoading(true);
    try {
      const response = await request.GET('/lms/admin/appeals/medical-leave/pending/');
      setAppeals(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching medical leave appeals:', err);
      setError(err.message || 'Failed to load appeals.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (appeal) => {
    setSelectedAppeal(appeal);
    setReviewNotes(appeal.review_notes || '');
    setProcessData({
      approved_leave_days: appeal.approved_leave_days || ''
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
        approved_leave_days: processData.approved_leave_days
      };
      
      await request.POST(`/lms/admin/appeals/medical-leave/${selectedAppeal.id}/process/`, payload);
      
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

  const calculateLeaveDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
          <h1>Medical Leave Appeals</h1>
          <p>Review and process medical leave applications</p>
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
          <p>No pending medical leave appeals to review.</p>
        </div>
      ) : (
        <div className="aap-appeals-table-container">
          <table className="aap-appeals-table">
            <thead>
              <tr>
                <th>Appeal ID</th>
                <th>Student</th>
                <th>Title</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days Requested</th>
                <th>Hospital</th>
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
                  <td>{formatDate(appeal.start_date)}</td>
                  <td>{formatDate(appeal.end_date)}</td>
                  <td>{calculateLeaveDays(appeal.start_date, appeal.end_date)}</td>
                  <td>{appeal.hospital_name}</td>
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
              <h2>Medical Leave Appeal Details</h2>
              <button className="aap-close-btn" onClick={() => setModalOpen(false)}>
                <MdClose />
              </button>
            </div>

            <div className="aap-modal-content">
              <div className="aap-appeal-info">
                <div className="aap-info-row">
                  <label>Appeal ID:</label>
                  <span className = "user-medical-data">{selectedAppeal.appeal_id}</span>
                </div>
                <div className="aap-info-row">
                  <label>Student:</label>
                  <span className = "user-medical-data">{selectedAppeal.student_name}</span>
                </div>
                <div className="aap-info-row">
                  <label>Title:</label>
                  <span className = "user-medical-data">{selectedAppeal.title}</span>
                </div>
                <div className="aap-info-row">
                  <label>Department:</label>
                  <span className = "user-medical-data">{selectedAppeal.department_name}</span>
                </div>
                <div className="aap-info-row">
                  <label>Faculty:</label>
                  <span className = "user-medical-data">{selectedAppeal.faculty_name}</span>
                </div>
                <div className="aap-info-row">
                  <label>Batch:</label>
                  <span className = "user-medical-data">{selectedAppeal.batch_name || 'N/A'}</span>
                </div>
                <div className="aap-info-row">
                  <label>Academic Year:</label>
                  <span className = "user-medical-data">{selectedAppeal.academic_year}</span>
                </div>
                <div className="aap-info-row">
                  <label>Description:</label>
                  <p className="aap-description-text">{selectedAppeal.description}</p>
                </div>
              </div>

              <div className="aap-type-specific">
                <h3>Medical Leave Details</h3>
                <div className="aap-info-row">
                  <label>Start Date:</label>
                  <span className = "user-medical-data">{formatDate(selectedAppeal.start_date)}</span>
                </div>
                <div className="aap-info-row">
                  <label>End Date:</label>
                  <span className = "user-medical-data">{formatDate(selectedAppeal.end_date)}</span>
                </div>
                <div className="aap-info-row">
                  <label>Days Requested:</label>
                  <span className = "user-medical-data">{calculateLeaveDays(selectedAppeal.start_date, selectedAppeal.end_date)} days</span>
                </div>
                <div className="aap-info-row">
                  <label>Diagnosis:</label>
                  <p className = "user-medical-data">{selectedAppeal.diagnosis || 'N/A'}</p>
                </div>
                <div className="aap-info-row">
                  <label>Hospital Name:</label>
                  <span className = "user-medical-data">{selectedAppeal.hospital_name}</span>
                </div>
                <div className="aap-info-row">
                  <label>Doctor Name:</label>
                  <span className = "user-medical-data">{selectedAppeal.doctor_name}</span>
                </div>
                <div className="aap-info-row">
                  <label>Medical Report:</label>
                  <button 
                    className="aap-download-btn"
                    onClick={() => handleDownload(selectedAppeal.medical_report, 'medical_report')}
                  >
                    <MdDownload /> Download
                  </button>
                </div>
                <div className="aap-info-row">
                  <label>Hospital Letter:</label>
                  <button 
                    className="aap-download-btn"
                    onClick={() => handleDownload(selectedAppeal.hospital_letter, 'hospital_letter')}
                  >
                    <MdDownload /> Download
                  </button>
                </div>
                <div className="aap-info-row">
                  <label>Approved Leave Days:</label>
                  <input
                    type="number"
                    className="aap-process-input"
                    placeholder="Enter approved leave days"
                    value={processData.approved_leave_days}
                    onChange={(e) => setProcessData({ ...processData, approved_leave_days: e.target.value })}
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

export default AdminMedicalLeaveAppeals;