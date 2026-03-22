import React, { useState, useEffect } from 'react';
import { MdCheckCircle, MdCancel, MdVisibility } from 'react-icons/md';
import request from '../../../utils/requestMethods.jsx';
import './AdminAppealsPage.css';

const MedicalAppealsPage = () => {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');

  const fetchAppeals = async () => {
    try {
      const data = await request.GET('/api/admin/appeals/medical-leave/pending/');
      setAppeals(data.results || []);
    } catch (err) {
      setError('Failed to load medical leave appeals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppeals();
  }, []);

  const handleProcess = async (id, decision, extra = {}) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      const payload = { decision, ...extra };
      await request.POST(`/api/admin/appeals/medical-leave/${id}/process/`, payload);
      setAppeals(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError('Failed to update appeal');
    } finally {
      setProcessingId(null);
    }
  };

  const viewDetails = (appeal) => {
    setSelectedAppeal(appeal);
    setShowModal(true);
  };

  if (loading) return <div className="loading-state"><div className="spinner"></div><p>Loading appeals...</p></div>;

  return (
    <div className="admin-appeals-container">
      <div className="admin-appeals-header">
        <h1>Medical Leave Appeals</h1>
        <p>Review and approve medical leave requests</p>
      </div>
      {error && <div className="error-alert">{error}</div>}
      <div className="appeals-table-container">
        <table className="appeals-table">
          <thead>
            <tr><th>Student Name</th><th>Title</th><th>Start Date</th><th>End Date</th><th>Hospital</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {appeals.map(appeal => (
              <tr key={appeal.id}>
                <td>{appeal.student_name}</td>
                <td>{appeal.title}</td>
                <td>{appeal.start_date}</td>
                <td>{appeal.end_date}</td>
                <td>{appeal.hospital_name}</td>
                <td className="actions-cell">
                  <button className="view-btn" onClick={() => viewDetails(appeal)}><MdVisibility /></button>
                  <button className="approve-btn" onClick={() => handleProcess(appeal.id, 'approve', { approved_leave_days: 14, notes: 'Medical certificate verified' })} disabled={processingId === appeal.id}><MdCheckCircle /></button>
                  <button className="reject-btn" onClick={() => handleProcess(appeal.id, 'reject')} disabled={processingId === appeal.id}><MdCancel /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && selectedAppeal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="appeal-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Appeal Details</h3><button className="close-btn" onClick={() => setShowModal(false)}>×</button></div>
            <div className="modal-body">
              <p><strong>Student:</strong> {selectedAppeal.student_name}</p>
              <p><strong>Title:</strong> {selectedAppeal.title}</p>
              <p><strong>Start Date:</strong> {selectedAppeal.start_date}</p>
              <p><strong>End Date:</strong> {selectedAppeal.end_date}</p>
              <p><strong>Hospital:</strong> {selectedAppeal.hospital_name}</p>
              <p><strong>Doctor:</strong> {selectedAppeal.doctor_name}</p>
              {selectedAppeal.medical_report && <p><strong>Medical Report:</strong> <a href={selectedAppeal.medical_report} target="_blank" rel="noopener noreferrer">View</a></p>}
              {selectedAppeal.hospital_letter && <p><strong>Hospital Letter:</strong> <a href={selectedAppeal.hospital_letter} target="_blank" rel="noopener noreferrer">View</a></p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalAppealsPage;