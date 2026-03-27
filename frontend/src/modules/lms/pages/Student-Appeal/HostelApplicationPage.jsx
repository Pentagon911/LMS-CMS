// src/modules/lms/pages/HostelApplicationPage.jsx
import { useState, useEffect } from 'react';
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
  const [user, setUser] = useState(null);
  const [departmentId, setDepartmentId] = useState(null);
  const [facultyId, setFacultyId] = useState(null);
  const [batchId, setBatchId] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [departmentName, setDepartmentName] = useState('Not assigned');
  const [facultyName, setFacultyName] = useState('Not assigned');
  const [batchName, setBatchName] = useState('Not assigned');

  // Define appeal type constant - must match one of the AppealType choices
  const APPEAL_TYPE = 'HOSTEL';

  // Load user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setStudentId(parsedUser.id);
      
      // Extract IDs from profile
      if (parsedUser.profile) {
        setDepartmentId(parsedUser.profile.department);
        setFacultyId(parsedUser.profile.faculty);
        setBatchId(parsedUser.profile.batch);
        
        // Set display names
        setDepartmentName(parsedUser.department_name || 'Not assigned');
        setFacultyName(parsedUser.faculty_name || 'Not assigned');
        setBatchName(parsedUser.batch_name || 'Not assigned');
      } else {
        // Fallback to direct properties if profile doesn't exist
        setDepartmentId(parsedUser.department);
        setFacultyId(parsedUser.faculty);
        setBatchId(parsedUser.batch);
        setDepartmentName(parsedUser.department_name || 'Not assigned');
        setFacultyName(parsedUser.faculty_name || 'Not assigned');
        setBatchName(parsedUser.batch_name || 'Not assigned');
      }
    }
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
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
    if (!studentId) {
      setError('Student information is missing. Please log in again.');
      setLoading(false);
      return;
    }

    if (!departmentId || !facultyId || !batchId) {
      setError('Student profile information is incomplete. Please contact support.');
      setLoading(false);
      return;
    }

    // Validate required form fields
    if (!formData.title.trim()) {
      setError('Please provide a title for your application.');
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('Please provide a description for your application.');
      setLoading(false);
      return;
    }

    if (!formData.preferred_check_in) {
      setError('Please select a preferred check-in date.');
      setLoading(false);
      return;
    }

    // Validate medical certificate if medical condition is checked
    if (formData.has_medical_condition && !medicalCertificate) {
      setError('Please upload a medical certificate as you have indicated a medical condition.');
      setLoading(false);
      return;
    }

    try {
      setUploadingFile(true);
      
      // Create FormData object for multipart/form-data submission
      const formDataToSend = new FormData();
      
      // Add required fields that the serializer expects
      formDataToSend.append('appeal_type', APPEAL_TYPE);
      formDataToSend.append('student', studentId.toString());
      
      // Add all form fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('academic_year', formData.academic_year);
      formDataToSend.append('preferred_check_in', formData.preferred_check_in);
      formDataToSend.append('duration_months', formData.duration_months.toString());
      formDataToSend.append('special_requirements', formData.special_requirements || '');
      formDataToSend.append('has_medical_condition', formData.has_medical_condition ? 'true' : 'false');
      
      // Add the IDs
      formDataToSend.append('department', departmentId.toString());
      formDataToSend.append('faculty', facultyId.toString());
      if (batchId) {
        formDataToSend.append('batch', batchId.toString());
      }
      
      // Append medical certificate file if provided
      if (medicalCertificate) {
        formDataToSend.append('medical_certificate', medicalCertificate);
      }
      
      // Append supporting documents
      if (supportingDocs.length > 0) {
        formDataToSend.append('supporting_documents', supportingDocs[0]);
        
        // Additional files will be uploaded as separate attachments after the appeal is created
        const additionalDocs = supportingDocs.slice(1);
        if (additionalDocs.length > 0) {
          console.log(`${additionalDocs.length} additional document(s) will be uploaded as attachments after appeal creation.`);
        }
      }
      
      // Debug log to verify data being sent
      console.log('Submitting hostel appeal with:', {
        appeal_type: APPEAL_TYPE,
        student: studentId,
        department: departmentId,
        faculty: facultyId,
        batch: batchId,
        title: formData.title,
        description: formData.description,
        preferred_check_in: formData.preferred_check_in,
        duration_months: formData.duration_months,
        has_medical_condition: formData.has_medical_condition,
        files: {
          medical_certificate: medicalCertificate?.name || 'none',
          supporting_documents: supportingDocs.length > 0 ? supportingDocs[0]?.name : 'none',
        }
      });
      
      // Create the appeal with FormData
      const appealResponse = await request.POST('/lms/appeals/hostel/', formDataToSend, { isFormData: true });
      
      console.log('Appeal created successfully:', appealResponse);
      
      // If there are additional documents (more than 1 supporting doc), upload them as attachments
      if (supportingDocs.length > 1 && appealResponse.id) {
        try {
          console.log('Uploading additional documents as attachments...');
          const additionalDocs = supportingDocs.slice(1);
          
          for (const doc of additionalDocs) {
            const attachmentFormData = new FormData();
            attachmentFormData.append('file', doc);
            attachmentFormData.append('description', `Supporting document: ${doc.name}`);
            // The appeal_type should be the content type model name in lowercase
            attachmentFormData.append('appeal_type', 'hostelappeal');
            attachmentFormData.append('appeal_id', appealResponse.id.toString());
            
            await request.POST('/lms/attachments/', attachmentFormData, { isFormData: true });
          }
          
          console.log('Additional documents uploaded successfully');
        } catch (attachmentError) {
          console.warn('Failed to upload additional documents:', attachmentError);
        }
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/lms/appeals-and-welfare/my-appeals');
      }, 2000);
    } catch (err) {
      console.error('Error submitting hostel application:', err);
      
      // Parse error response
      let errorMessage = 'Failed to submit application. Please try again.';
      
      if (err.status === 401) {
        errorMessage = 'Your session has expired. Please login again.';
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (err.data) {
        if (typeof err.data === 'object') {
          const errorMessages = [];
          for (const [key, value] of Object.entries(err.data)) {
            if (Array.isArray(value)) {
              errorMessages.push(`${key}: ${value.join(', ')}`);
            } else if (typeof value === 'string') {
              errorMessages.push(`${key}: ${value}`);
            } else {
              errorMessages.push(`${key}: ${JSON.stringify(value)}`);
            }
          }
          errorMessage = errorMessages.join('; ');
        } else if (typeof err.data === 'string') {
          errorMessage = err.data;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setUploadingFile(false);
    }
  };

  if (success) {
    return (
      <div className="afp-appeal-form-container">
        <div className="afp-success-message">
          <MdCheckCircle className="afp-success-icon" />
          <h2>Application Submitted Successfully!</h2>
          <p>Your hostel application has been submitted. You can track its status in My Appeals.</p>
          <button onClick={() => navigate('/lms/appeals-and-welfare/my-appeals')} className="afp-view-appeals-btn">
            View My Appeals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="afp-appeal-form-container">
      <div className="afp-form-header">
        <h1><MdHome /> Hostel Application</h1>
        <p>Request hostel accommodation</p>
      </div>

      {error && (
        <div className="afp-error-alert">
          <MdWarning />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="afp-appeal-form">
        {/* Student Information Section */}
        <div className="afp-form-section">
          <h3>Student Information</h3>
          
          <div className="afp-form-group">
            <label>Student Name</label>
            <input
              type="text"
              value={user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '' : ''}
              disabled
              className="afp-readonly-field"
            />
          </div>

          <div className="afp-form-row">
            <div className="afp-form-group">
              <label>Department</label>
              <input
                type="text"
                value={departmentName}
                disabled
                className="afp-readonly-field"
              />
            </div>

            <div className="afp-form-group">
              <label>Faculty</label>
              <input
                type="text"
                value={facultyName}
                disabled
                className="afp-readonly-field"
              />
            </div>
          </div>

          <div className="afp-form-row">
            <div className="afp-form-group">
              <label>Batch</label>
              <input
                type="text"
                value={batchName}
                disabled
                className="afp-readonly-field"
              />
            </div>

            <div className="afp-form-group">
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
        <div className="afp-form-section">
          <h3>Application Details</h3>
          
          <div className="afp-form-group">
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

          <div className="afp-form-group">
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
        <div className="afp-form-section">
          <h3>Accommodation Details</h3>

          <div className="afp-form-row">
            <div className="afp-form-group">
              <label>Preferred Check-in Date *</label>
              <input
                type="date"
                name="preferred_check_in"
                value={formData.preferred_check_in}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="afp-form-group">
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

          <div className="afp-form-group">
            <label>Special Requirements</label>
            <textarea
              name="special_requirements"
              value={formData.special_requirements}
              onChange={handleInputChange}
              rows="3"
              placeholder="Any special requirements or preferences..."
            />
          </div>

          <div className="afp-form-group checkbox">
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
        <div className="afp-form-section">
          <h3>Supporting Documents</h3>
          
          {/* Medical Certificate Upload (conditional) */}
          {formData.has_medical_condition && (
            <div className="afp-form-group">
              <label>Medical Certificate <span className="afp-required">*</span></label>
              <div className="afp-file-upload-area">
                <input
                  type="file"
                  id="medical-certificate"
                  accept=".pdf"
                  onChange={handleMedicalCertificateChange}
                  className="afp-file-input-hidden"
                />
                <label htmlFor="medical-certificate" className="afp-file-upload-label">
                  <MdCloudUpload />
                  <span>{medicalCertificate ? medicalCertificate.name : 'Click to upload medical certificate (PDF)'}</span>
                </label>
                {medicalCertificate && (
                  <div className="afp-file-info">
                    <span>{medicalCertificate.name} ({(medicalCertificate.size / 1024).toFixed(2)} KB)</span>
                    <button 
                      type="button" 
                      className="afp-remove-file"
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
          <div className="afp-form-group">
            <label>Supporting Documents <span className="afp-optional">(Optional)</span></label>
            <div className="afp-file-upload-area">
              <input
                type="file"
                id="supporting-docs"
                accept=".pdf"
                multiple
                onChange={handleSupportingDocsChange}
                className="afp-file-input-hidden"
              />
              <label htmlFor="supporting-docs" className="afp-file-upload-label">
                <MdCloudUpload />
                <span>Click to upload multiple supporting documents (PDF)</span>
              </label>
            </div>
            <small>Upload any additional supporting documents (PDF only, max 5MB each). Only the first document will be attached as supporting_documents; additional documents will be uploaded as separate attachments.</small>
            
            {supportingDocs.length > 0 && (
              <div className="afp-attachments-list">
                <label>Uploaded Documents ({supportingDocs.length}):</label>
                {supportingDocs.map((doc, index) => (
                  <div key={index} className="afp-attachment-item">
                    <span>{doc.name} ({(doc.size / 1024).toFixed(2)} KB)</span>
                    <button
                      type="button"
                      className="afp-remove-attachment"
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

        <div className="afp-form-actions">
          <button type="button" className="afp-cancel-btn" onClick={() => navigate('/lms/student/appeals')}>
            <MdCancel /> Cancel
          </button>
          <button type="submit" className="afp-submit-btn" disabled={loading || uploadingFile}>
            <MdSave /> {loading || uploadingFile ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HostelApplicationPage;