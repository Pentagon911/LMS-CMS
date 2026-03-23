// src/modules/lms/pages/BursaryApplicationPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import request from '../../../../utils/requestMethods';
import { MdSave, MdCancel, MdAttachFile, MdWarning, MdCheckCircle, MdDelete, MdCloudUpload } from 'react-icons/md';
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
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Extract IDs from profile
  const departmentId = user.profile?.department || '';
  const facultyId = user.profile?.faculty || '';
  const batchId = user.profile?.batch || '';
  
  // Extract names from user object
  const departmentName = user.department_name || '';
  const facultyName = user.faculty_name || '';
  const batchName = user.batch_name || '';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    family_income_bracket: '',
    has_scholarship: false,
    reason_for_aid: '',
    department: departmentId,
    faculty: facultyId,
    batch: batchId,
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
    if (!incomeCertificate) {
      setError('Income certificate is required');
      setLoading(false);
      return;
    }

    try {
      setUploadingFile(true);
      
      // Prepare appeal data with file IDs
      const submitData = {
        ...formData,
        department: parseInt(formData.department),
        faculty: parseInt(formData.faculty),
        batch: parseInt(formData.batch),
      };
      
      // Create the appeal first
      const appealResponse = await request.POST('/lms/appeals/bursary/', submitData);
      
      // Upload income certificate and associate with appeal
      if (incomeCertificate) {
        const incomeCertResponse = await uploadFile(incomeCertificate, 'income_certificate');
        await request.PATCH(`/lms/attachments/${incomeCertResponse.id}/`, {
          appeal_type: 'bursaryappeal',
          appeal_id: appealResponse.id
        });
      }
      
      // Upload bank statements if provided
      if (bankStatements) {
        const bankResponse = await uploadFile(bankStatements, 'bank_statements');
        await request.PATCH(`/lms/attachments/${bankResponse.id}/`, {
          appeal_type: 'bursaryappeal',
          appeal_id: appealResponse.id
        });
      }
      
      // Upload supporting documents
      for (const doc of supportingDocs) {
        const docResponse = await uploadFile(doc, 'supporting_document');
        await request.PATCH(`/lms/attachments/${docResponse.id}/`, {
          appeal_type: 'bursaryappeal',
          appeal_id: appealResponse.id
        });
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/lms/appeals-and-welfare/my-appeals');
      }, 2000);
    } catch (err) {
      console.error('Error submitting bursary application:', err);
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
        <h1>Bursary Application</h1>
        <p>Apply for financial aid and scholarships</p>
      </div>

      {error && (
        <div className="error-alert">
          <MdWarning />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="appeal-form">
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

          <div className="form-group">
            <label>Department</label>
            <input
              type="text"
              value={departmentName || 'Not assigned'}
              disabled
              className="readonly-field"
            />
            <input type="hidden" name="department" value={formData.department} />
          </div>

          <div className="form-group">
            <label>Faculty</label>
            <input
              type="text"
              value={facultyName || 'Not assigned'}
              disabled
              className="readonly-field"
            />
            <input type="hidden" name="faculty" value={formData.faculty} />
          </div>

          <div className="form-group">
            <label>Batch</label>
            <input
              type="text"
              value={batchName || 'Not assigned'}
              disabled
              className="readonly-field"
            />
            <input type="hidden" name="batch" value={formData.batch} />
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

        <div className="form-section">
          <h3>Supporting Documents</h3>
          
          {/* Income Certificate Upload */}
          <div className="form-group">
            <label>Income Certificate *</label>
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
            <small>Upload income certificate (PDF only, max 5MB)</small>
          </div>

          {/* Bank Statements Upload */}
          <div className="form-group">
            <label>Bank Statements (Optional)</label>
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

          {/* Supporting Documents Upload */}
          <div className="form-group">
            <label>Supporting Documents (Optional)</label>
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
                <label>Uploaded Documents:</label>
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