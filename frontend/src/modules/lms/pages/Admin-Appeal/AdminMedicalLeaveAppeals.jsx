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
    return (
      <div className="admin-appeal-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading medical leave appeals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-appeal-page">
      <div className="page-header">
        <div>
          <h1>Medical Leave Appeals</h1>
          <p>Review and process medical leave applications</p>
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
          <p>No pending medical leave appeals to review.</p>
        </div>
      ) : (
        <div className="appeals-table-container">
          <table className="appeals-table">
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
                  <td className="appeal-id">{appeal.appeal_id?.slice(0, 8)}...</td>
                  <td>
                    <div className="student-info">
                      <strong>{appeal.student_name}</strong>
                      <span className="student-detail">{appeal.student?.username}</span>
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
              <h2>Medical Leave Appeal Details</h2>
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
                <h3>Medical Leave Details</h3>
                <div className="info-row">
                  <label>Start Date:</label>
                  <span>{formatDate(selectedAppeal.start_date)}</span>
                </div>
                <div className="info-row">
                  <label>End Date:</label>
                  <span>{formatDate(selectedAppeal.end_date)}</span>
                </div>
                <div className="info-row">
                  <label>Days Requested:</label>
                  <span>{calculateLeaveDays(selectedAppeal.start_date, selectedAppeal.end_date)} days</span>
                </div>
                <div className="info-row">
                  <label>Diagnosis:</label>
                  <p>{selectedAppeal.diagnosis || 'N/A'}</p>
                </div>
                <div className="info-row">
                  <label>Hospital Name:</label>
                  <span>{selectedAppeal.hospital_name}</span>
                </div>
                <div className="info-row">
                  <label>Doctor Name:</label>
                  <span>{selectedAppeal.doctor_name}</span>
                </div>
                <div className="info-row">
                  <label>Medical Report:</label>
                  <button 
                    className="download-btn"
                    onClick={() => handleDownload(selectedAppeal.medical_report, 'medical_report')}
                  >
                    <MdDownload /> Download
                  </button>
                </div>
                <div className="info-row">
                  <label>Hospital Letter:</label>
                  <button 
                    className="download-btn"
                    onClick={() => handleDownload(selectedAppeal.hospital_letter, 'hospital_letter')}
                  >
                    <MdDownload /> Download
                  </button>
                </div>
                <div className="info-row">
                  <label>Approved Leave Days:</label>
                  <input
                    type="number"
                    className="process-input"
                    placeholder="Enter approved leave days"
                    value={processData.approved_leave_days}
                    onChange={(e) => setProcessData({ ...processData, approved_leave_days: e.target.value })}
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

export default AdminMedicalLeaveAppeals;