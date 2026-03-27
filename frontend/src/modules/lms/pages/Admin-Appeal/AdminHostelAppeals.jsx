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
    return;
  }

  return (
    <div className="aap-admin-appeal-page">
      <div className="aap-page-header">
        <div>
          <h1>Hostel Appeals</h1>
          <p>Review and process hostel accommodation requests</p>
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
          <p>No pending hostel appeals to review.</p>
        </div>
      ) : (
        <div className="aap-appeals-table-container">
          <table className="aap-appeals-table">
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
                  <td className="aap-appeal-id">{appeal.appeal_id?.slice(0, 8)}...</td>
                  <td>
                    <div className="aap-student-info">
                      <strong>{appeal.student_name}</strong>
                      <span className="aap-student-detail">{appeal.student?.username}</span>
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
              <h2>Hostel Appeal Details</h2>
              <button className="aap-close-btn" onClick={() => setModalOpen(false)}>
                <MdClose />
              </button>
            </div>

            <div className="aap-modal-content">
              <div className="aap-appeal-info">
                <div className="aap-info-row">
                  <label>Appeal ID:</label>
                  <span className = "user-hostel-data">{selectedAppeal.appeal_id}</span>
                </div>
                <div className="aap-info-row">
                  <label>Student:</label>
                  <span className = "user-hostel-data">{selectedAppeal.student_name}</span>
                </div>
                <div className="aap-info-row">
                  <label>Title:</label>
                  <span className = "user-hostel-data">{selectedAppeal.title}</span>
                </div>
                <div className="aap-info-row">
                  <label>Department:</label>
                  <span className = "user-hostel-data">{selectedAppeal.department_name}</span>
                </div>
                <div className="aap-info-row">
                  <label>Faculty:</label>
                  <span className = "user-hostel-data">{selectedAppeal.faculty_name}</span>
                </div>
                <div className="aap-info-row">
                  <label>Batch:</label>
                  <span className = "user-hostel-data">{selectedAppeal.batch_name || 'N/A'}</span>
                </div>
                <div className="aap-info-row">
                  <label>Academic Year:</label>
                  <span className = "user-hostel-data">{selectedAppeal.academic_year}</span>
                </div>
                <div className="aap-info-row">
                  <label>Description:</label>
                  <p className="aap-description-text">{selectedAppeal.description}</p>
                </div>
              </div>

              <div className="aap-type-specific">
                <h3>Hostel Details</h3>
                <div className="aap-info-row">
                  <label>Preferred Check-in:</label>
                  <span className = "user-hostel-data">{formatDate(selectedAppeal.preferred_check_in)}</span>
                </div>
                <div className="aap-info-row">
                  <label>Duration (months):</label>
                  <span className = "user-hostel-data">{selectedAppeal.duration_months}</span>
                </div>
                <div className="aap-info-row">
                  <label>Special Requirements:</label>
                  <p className = "user-hostel-data">{selectedAppeal.special_requirements || 'None'}</p>
                </div>
                <div className="aap-info-row">
                  <label>Has Medical Condition:</label>
                  <span className = "user-hostel-data">{selectedAppeal.has_medical_condition ? 'Yes' : 'No'}</span>
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
                  <label>Room Number:</label>
                  <input
                    type="text"
                    className="aap-process-input"
                    placeholder="Enter room number"
                    value={processData.room_number}
                    onChange={(e) => setProcessData({ ...processData, room_number: e.target.value })}
                  />
                </div>
                <div className="aap-info-row">
                  <label>Hostel Name:</label>
                  <input
                    type="text"
                    className="aap-process-input"
                    placeholder="Enter hostel name"
                    value={processData.hostel_name}
                    onChange={(e) => setProcessData({ ...processData, hostel_name: e.target.value })}
                  />
                </div>
                <div className="aap-info-row">
                  <label>Check-in Date:</label>
                  <input
                    type="date"
                    className="aap-process-input"
                    value={processData.check_in_date}
                    onChange={(e) => setProcessData({ ...processData, check_in_date: e.target.value })}
                  />
                </div>
                <div className="aap-info-row">
                  <label>Check-out Date:</label>
                  <input
                    type="date"
                    className="aap-process-input"
                    value={processData.check_out_date}
                    onChange={(e) => setProcessData({ ...processData, check_out_date: e.target.value })}
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

export default AdminHostelAppeals;