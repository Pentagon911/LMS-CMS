import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdHome, MdSave, MdClose } from 'react-icons/md';
import request from '../../../utils/requestMethods.jsx';
import '../../cms/pages/EditProfile.css';

const HostelApplicationPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', academic_year: '', department: '', faculty: '', batch: '',
    preferred_check_in: '', duration_months: '', has_medical_condition: false, medical_certificate: null,
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
        if (key === 'has_medical_condition') data.append(key, formData[key] ? 'true' : 'false');
        else data.append(key, formData[key]);
      }
    });
    try {
      await request.UPLOAD('/api/appeals/hostel/', data);
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
          <div className="edit-profile-avatar"><MdHome size={40} /></div>
          <div className="edit-profile-title">
            <h1>Apply for Hostel Facility</h1>
            <p>Submit your hostel accommodation request</p>
          </div>
        </div>
        {success && <div className="success-alert">✓ Application submitted successfully! Redirecting...</div>}
        {error && <div className="error-alert">{error}</div>}
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="input-group"><label>Title</label><input type="text" name="title" value={formData.title} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>Academic Year</label><input type="text" name="academic_year" value={formData.academic_year} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>Department</label><select name="department" value={formData.department} onChange={handleInputChange} required><option value="">Select</option><option value="1">Computer Science</option></select></div>
          <div className="input-group"><label>Faculty</label><select name="faculty" value={formData.faculty} onChange={handleInputChange} required><option value="">Select</option><option value="1">Engineering</option></select></div>
          <div className="input-group"><label>Batch</label><input type="text" name="batch" value={formData.batch} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>Preferred Check-in Date</label><input type="date" name="preferred_check_in" value={formData.preferred_check_in} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>Duration (months)</label><input type="number" name="duration_months" value={formData.duration_months} onChange={handleInputChange} required min="1" max="12" /></div>
          <div className="input-group"><label><input type="checkbox" name="has_medical_condition" checked={formData.has_medical_condition} onChange={handleInputChange} /> Have any medical condition?</label></div>
          {formData.has_medical_condition && <div className="input-group"><label>Medical Certificate (PDF only)</label><input type="file" name="medical_certificate" onChange={handleFileChange} accept=".pdf" required /></div>}
          <div className="form-buttons"><button type="button" className="btn-cancel" onClick={() => navigate(-1)}><MdClose /> Cancel</button><button type="submit" className="btn-save" disabled={submitting}>{submitting ? 'Submitting...' : <><MdSave /> Submit Application</>}</button></div>
        </form>
      </div>
    </div>
  );
};

export default HostelApplicationPage;