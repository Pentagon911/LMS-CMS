// src/modules/lms/pages/BursaryApplicationPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import request from '../../../../utils/requestMethods';
import { MdSave, MdCancel, MdWarning, MdCheckCircle, MdDelete, MdCloudUpload, MdAttachMoney } from 'react-icons/md';
import './AppealFormPage.css';

const BursaryApplicationPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [incomeCertificate, setIncomeCertificate] = useState(null);
  const [bankStatements, setBankStatements] = useState(null);
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

  // Define appeal type constant
  const APPEAL_TYPE = 'BURSARY';

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
    family_income_bracket: '',
    has_scholarship: false,
    reason_for_aid: '',
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleIncomeCertificateChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setError('Income certificate must be a PDF file');
      e.target.value = '';
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      e.target.value = '';
      return;
    }
    
    setIncomeCertificate(file);
    setError(null);
  };

  const handleBankStatementsChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setError('Bank statements must be a PDF file');
      e.target.value = '';
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      e.target.value = '';
      return;
    }
    
    setBankStatements(file);
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

    if (!formData.family_income_bracket) {
      setError('Please select your family income bracket.');
      setLoading(false);
      return;
    }

    if (!formData.reason_for_aid.trim()) {
      setError('Please provide a reason for financial aid.');
      setLoading(false);
      return;
    }

    // Validate required documents
    if (!incomeCertificate) {
      setError('Income certificate is required.');
      setLoading(false);
      return;
    }

    try {
      setUploadingFile(true);
      
      // Create FormData object
      const formDataToSend = new FormData();
      
      // Add required fields
      formDataToSend.append('appeal_type', APPEAL_TYPE);
      formDataToSend.append('student', studentId.toString());
      formDataToSend.append('department', departmentId.toString());
      formDataToSend.append('faculty', facultyId.toString());
      if (batchId) {
        formDataToSend.append('batch', batchId.toString());
      }
      
      // Add form fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('academic_year', formData.academic_year);
      formDataToSend.append('family_income_bracket', formData.family_income_bracket);
      formDataToSend.append('has_scholarship', formData.has_scholarship ? 'true' : 'false');
      formDataToSend.append('reason_for_aid', formData.reason_for_aid);
      
      // Append files
      if (incomeCertificate) {
        formDataToSend.append('income_certificate', incomeCertificate);
      }
      
      if (bankStatements) {
        formDataToSend.append('bank_statements', bankStatements);
      }
      
      if (supportingDocs.length > 0) {
        formDataToSend.append('supporting_documents', supportingDocs[0]);
        
        const additionalDocs = supportingDocs.slice(1);
        if (additionalDocs.length > 0) {
          console.log(`${additionalDocs.length} additional document(s) will be uploaded as attachments after appeal creation.`);
        }
      }
      
      // Debug log
      console.log('Submitting bursary appeal with:', {
        appeal_type: APPEAL_TYPE,
        student: studentId,
        department: departmentId,
        faculty: facultyId,
        batch: batchId,
        title: formData.title,
        files: {
          income_certificate: incomeCertificate?.name || 'none',
          bank_statements: bankStatements?.name || 'none',
          supporting_documents: supportingDocs.length > 0 ? supportingDocs[0]?.name : 'none',
        }
      });
      
      // Create the appeal
      const appealResponse = await request.POST('/lms/appeals/bursary/', formDataToSend, { isFormData: true });
      
      console.log('Appeal created successfully:', appealResponse);
      
      // Upload additional documents as attachments
      if (supportingDocs.length > 1 && appealResponse.id) {
        try {
          const additionalDocs = supportingDocs.slice(1);
          for (const doc of additionalDocs) {
            const attachmentFormData = new FormData();
            attachmentFormData.append('file', doc);
            attachmentFormData.append('description', `Supporting document: ${doc.name}`);
            attachmentFormData.append('appeal_type', 'bursaryappeal');
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
      console.error('Error submitting bursary application:', err);
      
      let errorMessage = 'Failed to submit application. Please try again.';
      
      if (err.status === 401) {
        errorMessage = 'Your session has expired. Please login again.';
        setTimeout(() => navigate('/login'), 2000);
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
      <div className="appeal-form-container">
        <div className="success-message">
          <MdCheckCircle className="success-icon" />
          <h2>Application Submitted Successfully!</h2>
          <p>Your bursary application has been submitted. You can track its status in My Appeals.</p>
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
        <h1><MdAttachMoney /> Bursary Application</h1>
        <p>Apply for financial aid and scholarships</p>
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
              value={user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '' : ''}
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
              placeholder="e.g., Bursary Application for Semester 1"
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
              placeholder="Provide details about your financial situation and need for assistance..."
            />
          </div>
        </div>

        {/* Financial Information Section */}
        <div className="form-section">
          <h3>Financial Information</h3>

          <div className="form-group">
            <label>Family Income Bracket *</label>
            <select
              name="family_income_bracket"
              value={formData.family_income_bracket}
              onChange={handleInputChange}
              required
            >
              <option value="">Select income bracket</option>
              <option value="LOW">Below 500,000 LKR</option>
              <option value="MEDIUM">500,000 - 1,000,000 LKR</option>
              <option value="HIGH">Above 1,000,000 LKR</option>
            </select>
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="has_scholarship"
                checked={formData.has_scholarship}
                onChange={handleInputChange}
              />
              I currently have a scholarship
            </label>
          </div>

          <div className="form-group">
            <label>Reason for Financial Aid *</label>
            <textarea
              name="reason_for_aid"
              value={formData.reason_for_aid}
              onChange={handleInputChange}
              required
              rows="4"
              placeholder="Explain why you need financial assistance..."
            />
          </div>
        </div>

        {/* Supporting Documents Section */}
        <div className="form-section">
          <h3>Supporting Documents</h3>
          
          <div className="form-group">
            <label>Income Certificate <span className="required">*</span></label>
            <div className="file-upload-area">
              <input
                type="file"
                id="income-certificate"
                accept=".pdf"
                onChange={handleIncomeCertificateChange}
                className="file-input-hidden"
              />
              <label htmlFor="income-certificate" className="file-upload-label">
                <MdCloudUpload />
                <span>{incomeCertificate ? incomeCertificate.name : 'Click to upload income certificate (PDF)'}</span>
              </label>
              {incomeCertificate && (
                <div className="file-info">
                  <span>{incomeCertificate.name} ({(incomeCertificate.size / 1024).toFixed(2)} KB)</span>
                  <button 
                    type="button" 
                    className="remove-file"
                    onClick={() => setIncomeCertificate(null)}
                  >
                    <MdDelete />
                  </button>
                </div>
              )}
            </div>
            <small>Upload income certificate to verify your financial situation (PDF only, max 5MB)</small>
          </div>

          <div className="form-group">
            <label>Bank Statements <span className="optional">(Optional)</span></label>
            <div className="file-upload-area">
              <input
                type="file"
                id="bank-statements"
                accept=".pdf"
                onChange={handleBankStatementsChange}
                className="file-input-hidden"
              />
              <label htmlFor="bank-statements" className="file-upload-label">
                <MdCloudUpload />
                <span>{bankStatements ? bankStatements.name : 'Click to upload bank statements (PDF)'}</span>
              </label>
              {bankStatements && (
                <div className="file-info">
                  <span>{bankStatements.name} ({(bankStatements.size / 1024).toFixed(2)} KB)</span>
                  <button 
                    type="button" 
                    className="remove-file"
                    onClick={() => setBankStatements(null)}
                  >
                    <MdDelete />
                  </button>
                </div>
              )}
            </div>
            <small>Upload recent bank statements (PDF only, max 5MB)</small>
          </div>

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
            <small>Upload any additional supporting documents (PDF only, max 5MB each). Only the first document will be attached as supporting_documents; additional documents will be uploaded as separate attachments.</small>
            
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

export default BursaryApplicationPage;