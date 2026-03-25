// src/modules/lms/pages/Admin-Appeal/AdminHostelAppeals.jsx
import { useState, useEffect } from 'react';
import request from '../../../../utils/requestMethods';
import { MdRefresh, MdVisibility, MdCheckCircle, MdCancel, MdWarning, MdDownload, MdClose } from 'react-icons/md';
import './AdminAppealPage.css';

const AdminHostelAppeals = () => {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processData, setProcessData] = useState({
    room_number: '',
    hostel_name: '',
    check_in_date: '',
    check_out_date: ''
  });

  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    setLoading(true);
    try {
      const response = await request.GET('/lms/admin/appeals/hostel/pending/');
      setAppeals(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching hostel appeals:', err);
      setError(err.message || 'Failed to load appeals.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (appeal) => {
    setSelectedAppeal(appeal);
    setReviewNotes(appeal.review_notes || '');
    setProcessData({
      room_number: appeal.allocated_room_number || '',
      hostel_name: appeal.allocated_hostel || '',
      check_in_date: appeal.check_in_date || '',
      check_out_date: appeal.check_out_date || ''
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
        room_number: processData.room_number,
        hostel_name: processData.hostel_name,
        check_in_date: processData.check_in_date,
        check_out_date: processData.check_out_date
      };
      
      await request.POST(`/lms/admin/appeals/hostel/${selectedAppeal.id}/process/`, payload);
      
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
    return (
      <div className="admin-appeal-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading hostel appeals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-appeal-page">
      <div className="page-header">
        <div>
          <h1>Hostel Appeals</h1>
          <p>Review and process hostel accommodation requests</p>
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
          <p>No pending hostel appeals to review.</p>
        </div>
      ) : (
        <div className="appeals-table-container">
          <table className="appeals-table">
            <thead>
              <tr>
                <th>Appeal ID</th>
                <th>Student</th>
                <th>Title</th>
                <th>Duration (months)</th>
                <th>Medical Condition</th>
                <th>Department</th>
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
                  <td>{appeal.title}</td>
                  <td>{appeal.duration_months}</td>
                  <td>
                    <span className={appeal.has_medical_condition ? 'medical-yes' : 'medical-no'}>
                      {appeal.has_medical_condition ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>{appeal.department_name}</td>
                  <td>{formatDate(appeal.created_at)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(appeal.status)}`}>
                      {appeal.status}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className="action-btn-view-btn"
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
              <h2>Hostel Appeal Details</h2>
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
                <h3>Hostel Details</h3>
                <div className="info-row">
                  <label>Preferred Check-in:</label>
                  <span>{formatDate(selectedAppeal.preferred_check_in)}</span>
                </div>
                <div className="info-row">
                  <label>Duration (months):</label>
                  <span>{selectedAppeal.duration_months}</span>
                </div>
                <div className="info-row">
                  <label>Special Requirements:</label>
                  <p>{selectedAppeal.special_requirements || 'None'}</p>
                </div>
                <div className="info-row">
                  <label>Has Medical Condition:</label>
                  <span>{selectedAppeal.has_medical_condition ? 'Yes' : 'No'}</span>
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
                  <label>Room Number:</label>
                  <input
                    type="text"
                    className="process-input"
                    placeholder="Enter room number"
                    value={processData.room_number}
                    onChange={(e) => setProcessData({ ...processData, room_number: e.target.value })}
                  />
                </div>
                <div className="info-row">
                  <label>Hostel Name:</label>
                  <input
                    type="text"
                    className="process-input"
                    placeholder="Enter hostel name"
                    value={processData.hostel_name}
                    onChange={(e) => setProcessData({ ...processData, hostel_name: e.target.value })}
                  />
                </div>
                <div className="info-row">
                  <label>Check-in Date:</label>
                  <input
                    type="date"
                    className="process-input"
                    value={processData.check_in_date}
                    onChange={(e) => setProcessData({ ...processData, check_in_date: e.target.value })}
                  />
                </div>
                <div className="info-row">
                  <label>Check-out Date:</label>
                  <input
                    type="date"
                    className="process-input"
                    value={processData.check_out_date}
                    onChange={(e) => setProcessData({ ...processData, check_out_date: e.target.value })}
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

export default AdminHostelAppeals;