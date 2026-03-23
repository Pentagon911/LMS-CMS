// src/modules/lms/components/AppealDetailModal.jsx
import { useState, useEffect } from 'react';
import request from '../../../../utils/requestMethods';
import { MdClose, MdDownload, MdCheckCircle, MdCancel, MdWarning } from 'react-icons/md';
import './AppealDetailModal.css';

const AppealDetailModal = ({ 
  isOpen, 
  onClose, 
  appeal, 
  appealType,
  onProcess 
}) => {
  const [loading, setLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processData, setProcessData] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (appeal) {
      setReviewNotes(appeal.review_notes || '');
      initializeProcessData();
      setError(null);
    }
  }, [appeal]);

  const initializeProcessData = () => {
    const baseData = { notes: '' };
    switch (appealType) {
      case 'bursary':
        setProcessData({ ...baseData, approved_amount: '' });
        break;
      case 'hostel':
        setProcessData({ ...baseData, room_number: '', hostel_name: '', check_in_date: '', check_out_date: '' });
        break;
      case 'exam-rewrite':
        setProcessData({ ...baseData, new_exam_date: '', exam_venue: '' });
        break;
      case 'medical-leave':
        setProcessData({ ...baseData, approved_leave_days: '' });
        break;
      case 'result-reeval':
        setProcessData({ ...baseData, new_marks: '', new_grade: '', review_comments: '' });
        break;
      default:
        setProcessData(baseData);
    }
  };

  const handleProcess = async (decision) => {
    if (!appeal) return;
    
    setLoading(true);
    setError(null);
    try {
      const payload = {
        decision,
        notes: reviewNotes,
        ...processData
      };
      
      await request.POST(`/lms/admin/appeals/${appealType}/${appeal.id}/process/`, payload);
      
      onProcess(appeal.id, decision);
      onClose();
    } catch (err) {
      console.error('Error processing appeal:', err);
      setError(err.message || 'Failed to process appeal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (fileUrl, fileName) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Appeal Details</h2>
          <button className="close-btn" onClick={onClose}>
            <MdClose />
          </button>
        </div>

        {appeal && (
          <div className="modal-content">
            {error && (
              <div className="error-alert">
                <MdWarning />
                <span>{error}</span>
              </div>
            )}

            <div className="appeal-info">
              <div className="info-row">
                <label>Appeal ID:</label>
                <span>{appeal.appeal_id}</span>
              </div>
              <div className="info-row">
                <label>Student:</label>
                <span>{appeal.student_name || appeal.student?.get_full_name || 'Unknown'}</span>
              </div>
              <div className="info-row">
                <label>Title:</label>
                <span>{appeal.title}</span>
              </div>
              <div className="info-row">
                <label>Department:</label>
                <span>{appeal.department_name || appeal.department?.name || 'N/A'}</span>
              </div>
              <div className="info-row">
                <label>Faculty:</label>
                <span>{appeal.faculty_name || appeal.faculty?.name || 'N/A'}</span>
              </div>
              <div className="info-row">
                <label>Academic Year:</label>
                <span>{appeal.academic_year || 'N/A'}</span>
              </div>
              <div className="info-row">
                <label>Description:</label>
                <p className="description-text">{appeal.description}</p>
              </div>
              <div className="info-row">
                <label>Supporting Documents:</label>
                {appeal.supporting_documents ? (
                  <button 
                    className="download-btn"
                    onClick={() => handleDownload(appeal.supporting_documents, 'supporting_document')}
                  >
                    <MdDownload /> Download
                  </button>
                ) : (
                  <span>No documents</span>
                )}
              </div>
            </div>

            {/* Type-specific fields */}
            {appealType === 'bursary' && (
              <div className="type-specific">
                <h3>Bursary Details</h3>
                <div className="info-row">
                  <label>Family Income Bracket:</label>
                  <span>{appeal.family_income_bracket}</span>
                </div>
                <div className="info-row">
                  <label>Has Scholarship:</label>
                  <span>{appeal.has_scholarship ? 'Yes' : 'No'}</span>
                </div>
                <div className="info-row">
                  <label>Reason for Aid:</label>
                  <p>{appeal.reason_for_aid}</p>
                </div>
                <div className="info-row">
                  <label>Approved Amount (LKR):</label>
                  <input
                    type="number"
                    className="process-input"
                    placeholder="Enter approved amount"
                    value={processData.approved_amount}
                    onChange={(e) => setProcessData({ ...processData, approved_amount: e.target.value })}
                  />
                </div>
              </div>
            )}

            {appealType === 'hostel' && (
              <div className="type-specific">
                <h3>Hostel Details</h3>
                <div className="info-row">
                  <label>Preferred Check-in:</label>
                  <span>{formatDate(appeal.preferred_check_in)}</span>
                </div>
                <div className="info-row">
                  <label>Duration (months):</label>
                  <span>{appeal.duration_months}</span>
                </div>
                <div className="info-row">
                  <label>Special Requirements:</label>
                  <p>{appeal.special_requirements || 'None'}</p>
                </div>
                <div className="info-row">
                  <label>Has Medical Condition:</label>
                  <span>{appeal.has_medical_condition ? 'Yes' : 'No'}</span>
                </div>
                {appeal.medical_certificate && (
                  <div className="info-row">
                    <label>Medical Certificate:</label>
                    <button 
                      className="download-btn"
                      onClick={() => handleDownload(appeal.medical_certificate, 'medical_certificate')}
                    >
                      <MdDownload /> Download
                    </button>
                  </div>
                )}
                <div className="info-row">
                  <label>Room Number:</label>
                  <input
                    type="text"
                    className="process-input"
                    placeholder="Enter room number"
                    value={processData.room_number}
                    onChange={(e) => setProcessData({ ...processData, room_number: e.target.value })}
                  />
                </div>
                <div className="info-row">
                  <label>Hostel Name:</label>
                  <input
                    type="text"
                    className="process-input"
                    placeholder="Enter hostel name"
                    value={processData.hostel_name}
                    onChange={(e) => setProcessData({ ...processData, hostel_name: e.target.value })}
                  />
                </div>
                <div className="info-row">
                  <label>Check-in Date:</label>
                  <input
                    type="date"
                    className="process-input"
                    value={processData.check_in_date}
                    onChange={(e) => setProcessData({ ...processData, check_in_date: e.target.value })}
                  />
                </div>
                <div className="info-row">
                  <label>Check-out Date:</label>
                  <input
                    type="date"
                    className="process-input"
                    value={processData.check_out_date}
                    onChange={(e) => setProcessData({ ...processData, check_out_date: e.target.value })}
                  />
                </div>
              </div>
            )}

            {appealType === 'exam-rewrite' && (
              <div className="type-specific">
                <h3>Exam Rewrite Details</h3>
                <div className="info-row">
                  <label>Course:</label>
                  <span>{appeal.course_name || appeal.course?.name || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <label>Module:</label>
                  <span>{appeal.module_name || appeal.module?.name || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <label>Semester:</label>
                  <span>{appeal.semester}</span>
                </div>
                <div className="info-row">
                  <label>Original Exam Date:</label>
                  <span>{formatDate(appeal.original_exam_date)}</span>
                </div>
                <div className="info-row">
                  <label>Reason Type:</label>
                  <span>{appeal.reason_type}</span>
                </div>
                <div className="info-row">
                  <label>Detailed Reason:</label>
                  <p>{appeal.detailed_reason}</p>
                </div>
                <div className="info-row">
                  <label>New Exam Date:</label>
                  <input
                    type="date"
                    className="process-input"
                    value={processData.new_exam_date}
                    onChange={(e) => setProcessData({ ...processData, new_exam_date: e.target.value })}
                  />
                </div>
                <div className="info-row">
                  <label>Exam Venue:</label>
                  <input
                    type="text"
                    className="process-input"
                    placeholder="Enter exam venue"
                    value={processData.exam_venue}
                    onChange={(e) => setProcessData({ ...processData, exam_venue: e.target.value })}
                  />
                </div>
              </div>
            )}

            {appealType === 'medical-leave' && (
              <div className="type-specific">
                <h3>Medical Leave Details</h3>
                <div className="info-row">
                  <label>Start Date:</label>
                  <span>{formatDate(appeal.start_date)}</span>
                </div>
                <div className="info-row">
                  <label>End Date:</label>
                  <span>{formatDate(appeal.end_date)}</span>
                </div>
                <div className="info-row">
                  <label>Diagnosis:</label>
                  <span>{appeal.diagnosis || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <label>Hospital:</label>
                  <span>{appeal.hospital_name}</span>
                </div>
                <div className="info-row">
                  <label>Doctor:</label>
                  <span>{appeal.doctor_name}</span>
                </div>
                <div className="info-row">
                  <label>Medical Report:</label>
                  <button 
                    className="download-btn"
                    onClick={() => handleDownload(appeal.medical_report, 'medical_report')}
                  >
                    <MdDownload /> Download
                  </button>
                </div>
                <div className="info-row">
                  <label>Hospital Letter:</label>
                  <button 
                    className="download-btn"
                    onClick={() => handleDownload(appeal.hospital_letter, 'hospital_letter')}
                  >
                    <MdDownload /> Download
                  </button>
                </div>
                <div className="info-row">
                  <label>Approved Leave Days:</label>
                  <input
                    type="number"
                    className="process-input"
                    placeholder="Enter approved leave days"
                    value={processData.approved_leave_days}
                    onChange={(e) => setProcessData({ ...processData, approved_leave_days: e.target.value })}
                  />
                </div>
              </div>
            )}

            {appealType === 'result-reeval' && (
              <div className="type-specific">
                <h3>Result Re-evaluation Details</h3>
                <div className="info-row">
                  <label>Exam:</label>
                  <span>{appeal.exam_title || appeal.exam_result?.exam?.title || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <label>Current Score:</label>
                  <span>{appeal.exam_result?.score || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <label>Current Grade:</label>
                  <span>{appeal.exam_result?.grade || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <label>Reason Type:</label>
                  <span>{appeal.reason_type}</span>
                </div>
                <div className="info-row">
                  <label>Specific Concerns:</label>
                  <p>{appeal.specific_concerns}</p>
                </div>
                <div className="info-row">
                  <label>New Marks:</label>
                  <input
                    type="number"
                    step="0.01"
                    className="process-input"
                    placeholder="Enter new marks"
                    value={processData.new_marks}
                    onChange={(e) => setProcessData({ ...processData, new_marks: e.target.value })}
                  />
                </div>
                <div className="info-row">
                  <label>New Grade:</label>
                  <select
                    className="process-input"
                    value={processData.new_grade}
                    onChange={(e) => setProcessData({ ...processData, new_grade: e.target.value })}
                  >
                    <option value="">Select grade</option>
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B">B</option>
                    <option value="B-">B-</option>
                    <option value="C+">C+</option>
                    <option value="C">C</option>
                    <option value="C-">C-</option>
                    <option value="D+">D+</option>
                    <option value="D">D</option>
                    <option value="F">F</option>
                  </select>
                </div>
                <div className="info-row">
                  <label>Review Comments:</label>
                  <textarea
                    className="process-textarea"
                    rows="3"
                    placeholder="Enter review comments"
                    value={processData.review_comments}
                    onChange={(e) => setProcessData({ ...processData, review_comments: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="review-section">
              <h3>Review Notes</h3>
              <textarea
                className="review-notes"
                rows="4"
                placeholder="Enter review notes..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button
                className="reject-btn"
                onClick={() => handleProcess('reject')}
                disabled={loading}
              >
                <MdCancel /> Reject
              </button>
              <button
                className="approve-btn"
                onClick={() => handleProcess('approve')}
                disabled={loading}
              >
                <MdCheckCircle /> Approve
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppealDetailModal;