import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdHelpOutline, MdSave, MdClose } from 'react-icons/md';
import request from '../../../utils/requestMethods.jsx';
import '../../cms/pages/EditProfile.css';

const ExamAppealFormPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', academic_year: '', department: '', faculty: '', batch: '',
    course: '', module: '', semester: '', original_exam_date: '',
    reason_type: '', detailed_reason: '', medical_certificate: null,
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
      await request.UPLOAD('/api/appeals/exam-rewrite/', data);
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
          <div className="edit-profile-avatar"><MdHelpOutline size={40} /></div>
          <div className="edit-profile-title">
            <h1>Exam Rewrite Appeal</h1>
            <p>Request permission to rewrite an exam</p>
          </div>
        </div>
        {success && <div className="success-alert">✓ Appeal submitted successfully! Redirecting...</div>}
        {error && <div className="error-alert">{error}</div>}
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="input-group"><label>Title</label><input type="text" name="title" value={formData.title} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>Academic Year</label><input type="text" name="academic_year" value={formData.academic_year} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>Department</label><select name="department" value={formData.department} onChange={handleInputChange} required><option value="">Select</option><option value="1">Computer Science</option></select></div>
          <div className="input-group"><label>Faculty</label><select name="faculty" value={formData.faculty} onChange={handleInputChange} required><option value="">Select</option><option value="1">Engineering</option></select></div>
          <div className="input-group"><label>Batch</label><input type="text" name="batch" value={formData.batch} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>Course</label><input type="text" name="course" value={formData.course} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>Module</label><input type="text" name="module" value={formData.module} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>Semester</label><select name="semester" value={formData.semester} onChange={handleInputChange} required><option value="">Select</option><option value="1">Semester 1</option><option value="2">Semester 2</option></select></div>
          <div className="input-group"><label>Original Exam Date</label><input type="date" name="original_exam_date" value={formData.original_exam_date} onChange={handleInputChange} required /></div>
          <div className="input-group"><label>Reason Type</label><select name="reason_type" value={formData.reason_type} onChange={handleInputChange} required><option value="">Select</option><option value="MEDICAL">Medical</option><option value="FAMILY_EMERGENCY">Family Emergency</option><option value="OTHER">Other</option></select></div>
          <div className="input-group"><label>Detailed Reason</label><textarea name="detailed_reason" rows="4" value={formData.detailed_reason} onChange={handleInputChange} required /></div>
          {(formData.reason_type === 'MEDICAL' || formData.reason_type === 'OTHER') && <div className="input-group"><label>Medical Certificate (PDF only)</label><input type="file" name="medical_certificate" onChange={handleFileChange} accept=".pdf" required /></div>}
          <div className="form-buttons"><button type="button" className="btn-cancel" onClick={() => navigate(-1)}><MdClose /> Cancel</button><button type="submit" className="btn-save" disabled={submitting}>{submitting ? 'Submitting...' : <><MdSave /> Submit Appeal</>}</button></div>
        </form>
      </div>
    </div>
  );
};

export default ExamAppealFormPage;