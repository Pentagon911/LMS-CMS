// src/modules/lms/pages/MedicalLeavePage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import request from '../../../../utils/requestMethods';
import { MdSave, MdCancel, MdWarning, MdCheckCircle, MdDelete, MdCloudUpload, MdMedicalServices } from 'react-icons/md';
import './AppealFormPage.css';

const MedicalLeavePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [medicalReport, setMedicalReport] = useState(null);
  const [hospitalLetter, setHospitalLetter] = useState(null);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Extract IDs from profile (these are the IDs sent to backend)
  const departmentId = user.profile?.department || '';
  const facultyId = user.profile?.faculty || '';
  const batchId = user.profile?.batch || '';
  
  // Extract display names from user object (these are from JWT response)
  const departmentName = user.department_name || 'Not assigned';
  const facultyName = user.faculty_name || 'Not assigned';
  const batchName = user.batch_name || 'Not assigned';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    department: departmentId,
    faculty: facultyId,
    batch: batchId,
    start_date: '',
    end_date: '',
    diagnosis: '',
    hospital_name: '',
    doctor_name: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleMedicalReportChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setError('Medical report must be a PDF file');
      e.target.value = '';
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      e.target.value = '';
      return;
    }
    
    setMedicalReport(file);
    setError(null);
  };

  const handleHospitalLetterChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setError('Hospital letter must be a PDF file');
      e.target.value = '';
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      e.target.value = '';
      return;
    }
    
    setHospitalLetter(file);
    setError(null);
  };

  const handleSupportingDocsChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    let hasError = false;
    
    for (const file of files) {
      if (file.type !== 'application/pdf') {
        setError(`${file.name} is not a PDF file`);
        hasError = true;
        break;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} exceeds 5MB limit`);
        hasError = true;
        break;
      }
      validFiles.push(file);
    }
    
    if (!hasError) {
      setSupportingDocs([...supportingDocs, ...validFiles]);
      setError(null);
    }
    e.target.value = '';
  };

  const removeSupportingDoc = (index) => {
    setSupportingDocs(supportingDocs.filter((_, i) => i !== index));
  };

  const uploadFile = async (file, type) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      formDataToSend.append('description', `${type}_${file.name}`);
      
      const response = await request.UPLOAD('/lms/attachments/', formDataToSend);
      return response;
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      throw err;
    }
  };

  const calculateDays = () => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    if (!formData.department || !formData.faculty || !formData.batch) {
      setError('Student profile information is incomplete. Please contact support.');
      setLoading(false);
      return;
    }
    
    // Validate required documents
    if (!medicalReport) {
      setError('Medical report is required');
      setLoading(false);
      return;
    }
    
    if (!hospitalLetter) {
      setError('Hospital letter is required');
      setLoading(false);
      return;
    }

    try {
      setUploadingFile(true);
      
      // Prepare appeal data
      const submitData = {
        ...formData,
        department: parseInt(formData.department),
        faculty: parseInt(formData.faculty),
        batch: parseInt(formData.batch),
      };
      
      // Create the medical leave appeal
      const appealResponse = await request.POST('/lms/appeals/medical-leave/', submitData);
      
      // Upload medical report
      if (medicalReport) {
        const medicalReportResponse = await uploadFile(medicalReport, 'medical_report');
        await request.PATCH(`/lms/attachments/${medicalReportResponse.id}/`, {
          appeal_type: 'medicalleaveappeal',
          appeal_id: appealResponse.id
        });
      }
      
      // Upload hospital letter
      if (hospitalLetter) {
        const hospitalLetterResponse = await uploadFile(hospitalLetter, 'hospital_letter');
        await request.PATCH(`/lms/attachments/${hospitalLetterResponse.id}/`, {
          appeal_type: 'medicalleaveappeal',
          appeal_id: appealResponse.id
        });
      }
      
      // Upload supporting documents
      for (const doc of supportingDocs) {
        const docResponse = await uploadFile(doc, 'supporting_document');
        await request.PATCH(`/lms/attachments/${docResponse.id}/`, {
          appeal_type: 'medicalleaveappeal',
          appeal_id: appealResponse.id
        });
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/lms/appeals-and-welfare/my-appeals');
      }, 2000);
    } catch (err) {
      console.Error('Error submitting medical leave:', err);
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
      setUploadingFile(false);
    }
  };

  if (success) {
    return (
      <div className="appeal-form-container">
        <div className="success-message">
          <MdCheckCircle className="success-icon" />
          <h2>Application Submitted Successfully!</h2>
          <p>Your medical leave application has been submitted. You can track its status in My Appeals.</p>
          <button onClick={() => navigate('/lms/appeals-and-welfare/my-appeals')} className="view-appeals-btn">
            View My Appeals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="appeal-form-container">
      <div className="form-header">
        <h1><MdMedicalServices /> Medical Leave Application</h1>
        <p>Apply for medical leave with supporting documents</p>
      </div>

      {error && (
        <div className="error-alert">
          <MdWarning />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="appeal-form">
        {/* Student Information Section */}
        <div className="form-section">
          <h3>Student Information</h3>
          
          <div className="form-group">
            <label>Student Name</label>
            <input
              type="text"
              value={`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || ''}
              disabled
              className="readonly-field"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                value={departmentName}
                disabled
                className="readonly-field"
              />
            </div>

            <div className="form-group">
              <label>Faculty</label>
              <input
                type="text"
                value={facultyName}
                disabled
                className="readonly-field"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Batch</label>
              <input
                type="text"
                value={batchName}
                disabled
                className="readonly-field"
              />
            </div>

            <div className="form-group">
              <label>Academic Year *</label>
              <input
                type="text"
                name="academic_year"
                value={formData.academic_year}
                onChange={handleInputChange}
                required
                placeholder="e.g., 2024-2025"
              />
            </div>
          </div>
        </div>

        {/* Application Details Section */}
        <div className="form-section">
          <h3>Application Details</h3>
          
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="e.g., Medical Leave Request"
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows="4"
              placeholder="Provide details about your medical condition and need for leave..."
            />
          </div>
        </div>

        {/* Leave Details Section */}
        <div className="form-section">
          <h3>Leave Details</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>End Date *</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          {formData.start_date && formData.end_date && (
            <div className="form-group">
              <label>Total Days Requested:</label>
              <input
                type="text"
                value={`${calculateDays()} day${calculateDays() !== 1 ? 's' : ''}`}
                disabled
                className="days-display readonly-field"
              />
            </div>
          )}

          <div className="form-group">
            <label>Diagnosis *</label>
            <input
              type="text"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleInputChange}
              required
              placeholder="e.g., Acute Bronchitis"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Hospital Name *</label>
              <input
                type="text"
                name="hospital_name"
                value={formData.hospital_name}
                onChange={handleInputChange}
                required
                placeholder="Name of hospital/clinic"
              />
            </div>

            <div className="form-group">
              <label>Doctor Name *</label>
              <input
                type="text"
                name="doctor_name"
                value={formData.doctor_name}
                onChange={handleInputChange}
                required
                placeholder="Name of attending doctor"
              />
            </div>
          </div>
        </div>

        {/* Supporting Documents Section */}
        <div className="form-section">
          <h3>Supporting Documents</h3>
          
          {/* Medical Report Upload */}
          <div className="form-group">
            <label>Medical Report <span className="required">*</span></label>
            <div className="file-upload-area">
              <input
                type="file"
                id="medical-report"
                accept=".pdf"
                onChange={handleMedicalReportChange}
                className="file-input-hidden"
                required
              />
              <label htmlFor="medical-report" className="file-upload-label">
                <MdCloudUpload />
                <span>{medicalReport ? medicalReport.name : 'Click to upload medical report (PDF)'}</span>
              </label>
              {medicalReport && (
                <div className="file-info">
                  <span>{medicalReport.name} ({(medicalReport.size / 1024).toFixed(2)} KB)</span>
                  <button 
                    type="button" 
                    className="remove-file"
                    onClick={() => setMedicalReport(null)}
                  >
                    <MdDelete />
                  </button>
                </div>
              )}
            </div>
            <small>Upload detailed medical report from your doctor (PDF only, max 5MB)</small>
          </div>

          {/* Hospital Letter Upload */}
          <div className="form-group">
            <label>Hospital Letter <span className="required">*</span></label>
            <div className="file-upload-area">
              <input
                type="file"
                id="hospital-letter"
                accept=".pdf"
                onChange={handleHospitalLetterChange}
                className="file-input-hidden"
                required
              />
              <label htmlFor="hospital-letter" className="file-upload-label">
                <MdCloudUpload />
                <span>{hospitalLetter ? hospitalLetter.name : 'Click to upload hospital letter (PDF)'}</span>
              </label>
              {hospitalLetter && (
                <div className="file-info">
                  <span>{hospitalLetter.name} ({(hospitalLetter.size / 1024).toFixed(2)} KB)</span>
                  <button 
                    type="button" 
                    className="remove-file"
                    onClick={() => setHospitalLetter(null)}
                  >
                    <MdDelete />
                  </button>
                </div>
              )}
            </div>
            <small>Upload official letter from the hospital (PDF only, max 5MB)</small>
          </div>

          {/* Supporting Documents Upload */}
          <div className="form-group">
            <label>Supporting Documents <span className="optional">(Optional)</span></label>
            <div className="file-upload-area">
              <input
                type="file"
                id="supporting-docs"
                accept=".pdf"
                multiple
                onChange={handleSupportingDocsChange}
                className="file-input-hidden"
              />
              <label htmlFor="supporting-docs" className="file-upload-label">
                <MdCloudUpload />
                <span>Click to upload multiple supporting documents (PDF)</span>
              </label>
            </div>
            <small>Upload any additional supporting documents like lab reports, prescriptions (PDF only, max 5MB each)</small>
            
            {supportingDocs.length > 0 && (
              <div className="attachments-list">
                <label>Uploaded Documents ({supportingDocs.length}):</label>
                {supportingDocs.map((doc, index) => (
                  <div key={index} className="attachment-item">
                    <span>{doc.name} ({(doc.size / 1024).toFixed(2)} KB)</span>
                    <button
                      type="button"
                      className="remove-attachment"
                      onClick={() => removeSupportingDoc(index)}
                    >
                      <MdDelete />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate('/lms/student/appeals')}>
            <MdCancel /> Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={loading || uploadingFile}>
            <MdSave /> {loading || uploadingFile ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MedicalLeavePage;