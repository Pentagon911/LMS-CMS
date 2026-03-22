import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdMedicalServices, MdSave, MdClose } from 'react-icons/md';
import request from '../../../utils/requestMethods.jsx';
import '../../cms/pages/EditProfile.css';

const MedicalLeavePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', academic_year: '', department: '', faculty: '', batch: '',
    start_date: '', end_date: '', hospital_name: '', doctor_name: '',
    medical_report: null, hospital_letter: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        data.append(key, formData[key]);
      }
    });
    try {
      await request.UPLOAD('/api/appeals/medical-leave/', data);
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
          <div className="edit-profile-avatar"><MdMedicalServices size={40} /></div>
          <div className="edit-profile-title">
            <h1>Medical Leave Application</h1>
            <p>Request leave due to medical reasons</p>
          </div>
        </div>
        {success && <div className="success-alert">✓ Medical leave submitted successfully! Redirecting...</div>}
        {error && <div className="error-alert">{error}</div>}
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="input-group"><label>Title</label><input type="text" name="title" value={formData.title} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>Academic Year</label><input type="text" name="academic_year" value={formData.academic_year} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>Department</label><select name="department" value={formData.department} onChange={handleInputChange} required><option value="">Select</option><option value="1">Computer Science</option></select></div>
          <div className="input-group"><label>Faculty</label><select name="faculty" value={formData.faculty} onChange={handleInputChange} required><option value="">Select</option><option value="1">Engineering</option></select></div>
          <div className="input-group"><label>Batch</label><input type="text" name="batch" value={formData.batch} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>Start Date</label><input type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>End Date</label><input type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>Hospital Name</label><input type="text" name="hospital_name" value={formData.hospital_name} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>Doctor Name</label><input type="text" name="doctor_name" value={formData.doctor_name} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>Medical Report (PDF)</label><input type="file" name="medical_report" onChange={handleFileChange} accept=".pdf" required /></div>
          <div className="input-group"><label>Hospital Letter (PDF, optional)</label><input type="file" name="hospital_letter" onChange={handleFileChange} accept=".pdf" /></div>
          <div className="form-buttons"><button type="button" className="btn-cancel" onClick={() => navigate(-1)}><MdClose /> Cancel</button><button type="submit" className="btn-save" disabled={submitting}>{submitting ? 'Submitting...' : <><MdSave /> Submit Request</>}</button></div>
        </form>
      </div>
    </div>
  );
};

export default MedicalLeavePage;