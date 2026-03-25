// src/modules/lms/pages/Student-Appeal/ExamAppealFormPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import request from '../../../../utils/requestMethods';
import { MdSave, MdCancel, MdWarning, MdCheckCircle, MdDelete, MdCloudUpload, MdEditNote } from 'react-icons/md';
import './AppealFormPage.css';

const ExamAppealFormPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [medicalCertificate, setMedicalCertificate] = useState(null);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Course data
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState(null);
  
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
  const APPEAL_TYPE = 'EXAM_REWRITE';

  // Load user data from localStorage
  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setStudentId(parsedUser.id);
        
        if (parsedUser.profile) {
          setDepartmentId(parsedUser.profile.department);
          setFacultyId(parsedUser.profile.faculty);
          setBatchId(parsedUser.profile.batch);
          setDepartmentName(parsedUser.department_name || 'Not assigned');
          setFacultyName(parsedUser.faculty_name || 'Not assigned');
          setBatchName(parsedUser.batch_name || 'Not assigned');
        } else {
          setDepartmentId(parsedUser.department);
          setFacultyId(parsedUser.faculty);
          setBatchId(parsedUser.batch);
          setDepartmentName(parsedUser.department_name || 'Not assigned');
          setFacultyName(parsedUser.faculty_name || 'Not assigned');
          setBatchName(parsedUser.batch_name || 'Not assigned');
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }, []);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        setCoursesError(null);
        const response = await request.GET('/lms/courses/');
        if (response && Array.isArray(response)) {
          setCourses(response);
        } else {
          setCourses([]);
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setCoursesError('Unable to load courses. Please refresh the page.');
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    course: '',
    semester: '',
    original_exam_date: '',
    reason_type: '',
    detailed_reason: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
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

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('You are not logged in. Please login again.');
      setLoading(false);
      navigate('/login');
      return;
    }

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

    if (!formData.course) {
      setError('Please select a course.');
      setLoading(false);
      return;
    }

    if (!formData.semester) {
      setError('Please select a semester.');
      setLoading(false);
      return;
    }

    if (!formData.original_exam_date) {
      setError('Please enter the original exam date.');
      setLoading(false);
      return;
    }

    if (!formData.reason_type) {
      setError('Please select a reason type.');
      setLoading(false);
      return;
    }

    if (!formData.detailed_reason.trim()) {
      setError('Please provide a detailed reason for your appeal.');
      setLoading(false);
      return;
    }

    if (formData.reason_type === 'MEDICAL' && !medicalCertificate) {
      setError('Please upload a medical certificate as you selected medical grounds.');
      setLoading(false);
      return;
    }

    try {
      setUploadingFile(true);
      
      const formDataToSend = new FormData();
      
      formDataToSend.append('appeal_type', APPEAL_TYPE);
      formDataToSend.append('student', studentId.toString());
      
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('academic_year', formData.academic_year);
      formDataToSend.append('course', formData.course.toString());
      formDataToSend.append('semester', formData.semester.toString());
      formDataToSend.append('original_exam_date', formData.original_exam_date);
      formDataToSend.append('reason_type', formData.reason_type);
      formDataToSend.append('detailed_reason', formData.detailed_reason);
      
      formDataToSend.append('department', departmentId.toString());
      formDataToSend.append('faculty', facultyId.toString());
      if (batchId) {
        formDataToSend.append('batch', batchId.toString());
      }
      
      if (medicalCertificate) {
        formDataToSend.append('medical_certificate', medicalCertificate);
      }
      
      if (supportingDocs.length > 0) {
        formDataToSend.append('supporting_documents', supportingDocs[0]);
        
        const additionalDocs = supportingDocs.slice(1);
        if (additionalDocs.length > 0) {
          console.log(`${additionalDocs.length} additional document(s) will be uploaded as attachments after appeal creation.`);
        }
      }
      
      console.log('Submitting exam rewrite appeal with:', {
        appeal_type: APPEAL_TYPE,
        student: studentId,
        department: departmentId,
        faculty: facultyId,
        batch: batchId,
        title: formData.title,
        course: formData.course,
        semester: formData.semester,
        original_exam_date: formData.original_exam_date,
        reason_type: formData.reason_type,
        files: {
          medical_certificate: medicalCertificate?.name || 'none',
          supporting_documents: supportingDocs.length > 0 ? supportingDocs[0]?.name : 'none',
        }
      });
      
      const appealResponse = await request.POST('/lms/appeals/exam-rewrite/', formDataToSend, { isFormData: true });
      
      console.log('Appeal created successfully:', appealResponse);
      
      if (supportingDocs.length > 1 && appealResponse.id) {
        try {
          const additionalDocs = supportingDocs.slice(1);
          
          for (const doc of additionalDocs) {
            const attachmentFormData = new FormData();
            attachmentFormData.append('file', doc);
            attachmentFormData.append('description', `Supporting document: ${doc.name}`);
            attachmentFormData.append('appeal_type', 'examrewriteappeal');
            attachmentFormData.append('appeal_id', appealResponse.id.toString());
            
            await request.POST('/lms/attachments/', attachmentFormData, { isFormData: true });
          }
        } catch (attachmentError) {
          console.warn('Failed to upload additional documents:', attachmentError);
        }
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/lms/appeals-and-welfare/my-appeals');
      }, 2000);
    } catch (err) {
      console.error('Error submitting exam rewrite appeal:', err);
      
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
      <div className="appeal-form-container">
        <div className="success-message">
          <MdCheckCircle className="success-icon" />
          <h2>Application Submitted Successfully!</h2>
          <p>Your exam rewrite appeal has been submitted. You can track its status in My Appeals.</p>
          <button onClick={() => navigate('/lms/appeals-and-welfare/my-appeals')} className="view-appeals-btn">
            View My Appeals
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while courses are loading
  if (loadingCourses) {
    return (
      <div className="appeal-form-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="appeal-form-container">
      <div className="form-header">
        <h1><MdEditNote /> Exam Rewrite Appeal</h1>
        <p>Request to rewrite an examination</p>
      </div>

      {error && (
        <div className="error-alert">
          <MdWarning />
          <span>{error}</span>
        </div>
      )}

      {coursesError && (
        <div className="error-alert">
          <MdWarning />
          <span>{coursesError}</span>
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
              placeholder="e.g., Request for Exam Rewrite - CS101"
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
              placeholder="Provide details about why you need to rewrite the exam..."
            />
          </div>
        </div>

        {/* Exam Details Section */}
        <div className="form-section">
          <h3>Exam Details</h3>

          <div className="form-group">
            <label>Course *</label>
            <select
              name="course"
              value={formData.course}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Semester *</label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                required
              >
                <option value="">Select semester</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>
            </div>

            <div className="form-group">
              <label>Original Exam Date *</label>
              <input
                type="date"
                name="original_exam_date"
                value={formData.original_exam_date}
                onChange={handleInputChange}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Reason Type *</label>
            <select
              name="reason_type"
              value={formData.reason_type}
              onChange={handleInputChange}
              required
            >
              <option value="">Select reason type</option>
              <option value="MEDICAL">Medical Grounds</option>
              <option value="CONFLICT">Exam Conflict</option>
              <option value="PERSONAL">Personal Circumstances</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Detailed Reason *</label>
            <textarea
              name="detailed_reason"
              value={formData.detailed_reason}
              onChange={handleInputChange}
              required
              rows="4"
              placeholder="Provide a detailed explanation of the circumstances that prevented you from taking the exam or why you need a rewrite..."
            />
          </div>
        </div>

        {/* Supporting Documents Section */}
        <div className="form-section">
          <h3>Supporting Documents</h3>
          
          {/* Medical Certificate Upload (conditional) */}
          {formData.reason_type === 'MEDICAL' && (
            <div className="form-group">
              <label>Medical Certificate <span className="required">*</span></label>
              <div className="file-upload-area">
                <input
                  type="file"
                  id="medical-certificate"
                  accept=".pdf"
                  onChange={handleMedicalCertificateChange}
                  className="file-input-hidden"
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

export default ExamAppealFormPage;