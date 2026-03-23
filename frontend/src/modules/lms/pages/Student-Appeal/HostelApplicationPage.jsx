// src/modules/lms/pages/HostelApplicationPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import request from '../../../../utils/requestMethods';
import { MdSave, MdCancel, MdWarning, MdCheckCircle, MdDelete, MdCloudUpload, MdHome } from 'react-icons/md';
import './AppealFormPage.css';

const HostelApplicationPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [medicalCertificate, setMedicalCertificate] = useState(null);
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
  
  // Get student ID (try different possible field names)
  const studentId = user.id;
  
  // Define appeal type constant
  const APPEAL_TYPE = 'HOSTEL'; // This matches the "Hostel Facility" option in the image

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    department: departmentId,
    faculty: facultyId,
    batch: batchId,
    preferred_check_in: '',
    duration_months: 6,
    special_requirements: '',
    has_medical_condition: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleMedicalCertificateChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setError('Medical certificate must be a PDF file');
      e.target.value = '';
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      e.target.value = '';
      return;
    }
    
    setMedicalCertificate(file);
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

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  // Check authentication
  const token = localStorage.getItem('access_token');
  if (!token) {
    setError('You are not logged in. Please login again.');
    setLoading(false);
    navigate('/login');
    return;
  }

  // Validate required fields
  if (!formData.department || !formData.faculty || !formData.batch) {
    setError('Student profile information is incomplete. Please contact support.');
    setLoading(false);
    return;
  }

  // Validate student ID is available
  if (!studentId) {
    setError('Student information is missing. Please log in again.');
    setLoading(false);
    return;
  }

  try {
    setUploadingFile(true);
    
    // Create FormData object for multipart/form-data submission
    const formDataToSend = new FormData();
    
    // Required fields from backend
    formDataToSend.append('appeal_type', APPEAL_TYPE);
    formDataToSend.append('student', studentId);
    
    // Use field names without _id suffix (the serializer likely expects these)
    formDataToSend.append('department', parseInt(formData.department));
    formDataToSend.append('faculty', parseInt(formData.faculty));
    formDataToSend.append('batch', parseInt(formData.batch));
    
    // Append all form fields
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('academic_year', formData.academic_year);
    formDataToSend.append('preferred_check_in', formData.preferred_check_in);
    formDataToSend.append('duration_months', formData.duration_months);
    formDataToSend.append('special_requirements', formData.special_requirements || '');
    formDataToSend.append('has_medical_condition', formData.has_medical_condition);
    
    // Append medical certificate file if provided
    if (formData.has_medical_condition && medicalCertificate) {
      formDataToSend.append('medical_certificate', medicalCertificate);
    }
    
    // Append supporting documents
    supportingDocs.forEach((doc) => {
      formDataToSend.append('supporting_documents', doc);
    });
    
    // Debug log to verify data being sent
    console.log('Submitting hostel appeal with:', {
      appeal_type: APPEAL_TYPE,
      student: studentId,
      department: parseInt(formData.department),
      faculty: parseInt(formData.faculty),
      batch: parseInt(formData.batch),
      title: formData.title,
      description: formData.description,
      preferred_check_in: formData.preferred_check_in,
      duration_months: formData.duration_months,
      files: {
        medical_certificate: medicalCertificate?.name || 'none',
        supporting_documents: supportingDocs.length
      }
    });
    
    // Create the appeal with FormData
    const appealResponse = await request.POST('/lms/appeals/hostel/', formDataToSend, { isFormData: true });
    
    console.log('Appeal created successfully:', appealResponse);
    
    setSuccess(true);
    setTimeout(() => {
      navigate('/lms/appeals-and-welfare/my-appeals');
    }, 2000);
  } catch (err) {
    console.error('Error submitting hostel application:', err);
    if (err.status === 401) {
      setError('Your session has expired. Please login again.');
      navigate('/login');
    } else if (err.data && typeof err.data === 'object') {
      const errorMessages = Object.entries(err.data)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      setError(`Failed to submit: ${errorMessages}`);
    } else {
      setError(err.message || 'Failed to submit application. Please try again.');
    }
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
          <p>Your hostel application has been submitted. You can track its status in My Appeals.</p>
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
        <h1><MdHome /> Hostel Application</h1>
        <p>Request hostel accommodation</p>
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
              placeholder="e.g., Hostel Accommodation Request"
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
              placeholder="Provide details about why you need hostel accommodation..."
            />
          </div>
        </div>

        {/* Accommodation Details Section */}
        <div className="form-section">
          <h3>Accommodation Details</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Preferred Check-in Date *</label>
              <input
                type="date"
                name="preferred_check_in"
                value={formData.preferred_check_in}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Duration (months) *</label>
              <select
                name="duration_months"
                value={formData.duration_months}
                onChange={handleInputChange}
                required
              >
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={9}>9 months</option>
                <option value={12}>12 months</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Special Requirements</label>
            <textarea
              name="special_requirements"
              value={formData.special_requirements}
              onChange={handleInputChange}
              rows="3"
              placeholder="Any special requirements or preferences..."
            />
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="has_medical_condition"
                checked={formData.has_medical_condition}
                onChange={handleInputChange}
              />
              I have a medical condition that requires special accommodation
            </label>
          </div>
        </div>

        {/* Supporting Documents Section */}
        <div className="form-section">
          <h3>Supporting Documents</h3>
          
          {/* Medical Certificate Upload (conditional) */}
          {formData.has_medical_condition && (
            <div className="form-group">
              <label>Medical Certificate <span className="required">*</span></label>
              <div className="file-upload-area">
                <input
                  type="file"
                  id="medical-certificate"
                  accept=".pdf"
                  onChange={handleMedicalCertificateChange}
                  className="file-input-hidden"
                  required
                />
                <label htmlFor="medical-certificate" className="file-upload-label">
                  <MdCloudUpload />
                  <span>{medicalCertificate ? medicalCertificate.name : 'Click to upload medical certificate (PDF)'}</span>
                </label>
                {medicalCertificate && (
                  <div className="file-info">
                    <span>{medicalCertificate.name} ({(medicalCertificate.size / 1024).toFixed(2)} KB)</span>
                    <button 
                      type="button" 
                      className="remove-file"
                      onClick={() => setMedicalCertificate(null)}
                    >
                      <MdDelete />
                    </button>
                  </div>
                )}
              </div>
              <small>Upload medical certificate to support your request (PDF only, max 5MB)</small>
            </div>
          )}

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
            <small>Upload any additional supporting documents (PDF only, max 5MB each)</small>
            
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

export default HostelApplicationPage;