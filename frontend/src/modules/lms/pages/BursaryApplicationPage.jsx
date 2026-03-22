import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAttachMoney, MdSave, MdClose } from 'react-icons/md';
import request from '../../../utils/requestMethods.jsx';
import '../../cms/pages/EditProfile.css';

const BursaryApplicationPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', description: '', academic_year: '', department: '', faculty: '', batch: '',
    family_income_bracket: '', has_scholarship: false, reason_for_aid: '',
    income_certificate: null, bank_statements: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
        if (key === 'has_scholarship') data.append(key, formData[key] ? 'true' : 'false');
        else data.append(key, formData[key]);
      }
    });
    try {
      await request.UPLOAD('/api/appeals/bursary/', data);
      setSuccess(true);
      setTimeout(() => navigate('/lms/appeals-and-welfare/my-appeals'), 2000);
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-card">
        <div className="edit-profile-header">
          <div className="edit-profile-avatar"><MdAttachMoney size={40} /></div>
          <div className="edit-profile-title">
            <h1>Apply for Bursary</h1>
            <p>Complete the form to submit your bursary application</p>
          </div>
        </div>
        {success && <div className="success-alert">✓ Application submitted successfully! Redirecting...</div>}
        {error && <div className="error-alert">{error}</div>}
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="input-group"><label>Title</label><input type="text" name="title" value={formData.title} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>Description</label><textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} /></div>
          <div className="input-group"><label>Academic Year</label><input type="text" name="academic_year" value={formData.academic_year} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>Department</label><select name="department" value={formData.department} onChange={handleInputChange} required><option value="">Select</option><option value="1">Computer Science</option></select></div>
          <div className="input-group"><label>Faculty</label><select name="faculty" value={formData.faculty} onChange={handleInputChange} required><option value="">Select</option><option value="1">Engineering</option></select></div>
          <div className="input-group"><label>Batch</label><input type="text" name="batch" value={formData.batch} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>Family Income Bracket</label><select name="family_income_bracket" value={formData.family_income_bracket} onChange={handleInputChange} required><option value="">Select</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></div>
          <div className="input-group"><label><input type="checkbox" name="has_scholarship" checked={formData.has_scholarship} onChange={handleInputChange} /> Already have a scholarship?</label></div>
          <div className="input-group"><label>Reason for Aid</label><textarea name="reason_for_aid" rows="3" value={formData.reason_for_aid} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>Income Certificate (PDF only)</label><input type="file" name="income_certificate" onChange={handleFileChange} accept=".pdf" required /></div>
          <div className="input-group"><label>Bank Statements (PDF, optional)</label><input type="file" name="bank_statements" onChange={handleFileChange} accept=".pdf" /></div>
          <div className="form-buttons"><button type="button" className="btn-cancel" onClick={() => navigate(-1)}><MdClose /> Cancel</button><button type="submit" className="btn-save" disabled={submitting}>{submitting ? 'Submitting...' : <><MdSave /> Submit Application</>}</button></div>
        </form>
      </div>
    </div>
  );
};

export default BursaryApplicationPage;