import React, { useState, useEffect } from 'react';
import { MdCheckCircle, MdCancel, MdVisibility } from 'react-icons/md';
import request from '../../../utils/requestMethods.jsx';
import './AdminAppealsPage.css';

const BursaryAppealsPage = () => {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');

  const fetchAppeals = async () => {
    try {
      const data = await request.GET('/api/admin/appeals/bursary/pending/');
      setAppeals(data.results || []);
    } catch (err) {
      setError('Failed to load bursary appeals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppeals();
  }, []);

  const handleProcess = async (id, decision) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      const payload = { decision };
      await request.POST(`/api/admin/appeals/bursary/${id}/process/`, payload);
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
        <h1>Bursary Appeals</h1>
        <p>Review and process student bursary applications</p>
      </div>
      {error && <div className="error-alert">{error}</div>}
      <div className="appeals-table-container">
        <table className="appeals-table">
          <thead>
            <tr><th>Student Name</th><th>Title</th><th>Family Income Bracket</th><th>Submitted</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {appeals.map(appeal => (
              <tr key={appeal.id}>
                <td>{appeal.student_name}</td>
                <td>{appeal.title}</td>
                <td>{appeal.family_income_bracket}</td>
                <td>{new Date(appeal.created_at).toLocaleDateString()}</td>
                <td className="actions-cell">
                  <button className="view-btn" onClick={() => viewDetails(appeal)}><MdVisibility /></button>
                  <button className="approve-btn" onClick={() => handleProcess(appeal.id, 'approve')} disabled={processingId === appeal.id}><MdCheckCircle /></button>
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
              <p><strong>Description:</strong> {selectedAppeal.description || 'N/A'}</p>
              <p><strong>Family Income Bracket:</strong> {selectedAppeal.family_income_bracket}</p>
              <p><strong>Has Scholarship:</strong> {selectedAppeal.has_scholarship ? 'Yes' : 'No'}</p>
              <p><strong>Reason for Aid:</strong> {selectedAppeal.reason_for_aid}</p>
              {selectedAppeal.income_certificate && <p><strong>Income Certificate:</strong> <a href={selectedAppeal.income_certificate} target="_blank" rel="noopener noreferrer">View</a></p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BursaryAppealsPage;