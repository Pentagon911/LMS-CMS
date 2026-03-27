import React, { useState, useEffect } from 'react';
import TextEditor from './TextEditor';
import request from '../../../utils/requestMethods.jsx';
import { MdDescription, MdCampaign, MdQuiz, MdClose, MdAttachFile, MdAccessTime, MdStar, MdFileUpload, MdCheckCircle, MdRadioButtonUnchecked } from 'react-icons/md';
import './AddContentModal.css';

const AddContentModal = ({ closeModal, onAdd, weekId, weekNumber, courseId }) => {
  const [contentType, setContentType] = useState('content');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    return now.toISOString().slice(0, 16);
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (contentType === 'quiz') {
      const fetchQuizzes = async () => {
        setLoading(true);
        try {
          const data = await request.GET('/cms/quizzes/draft_quizzes/');
          setQuizzes(data);
        } catch (err) {
          console.error("Failed to load quizzes", err);
        } finally {
          setLoading(false);
        }
      };
      fetchQuizzes();
    }
  }, [contentType]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files]);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getContentUrl = () => {
    // weekId is now the index (0-based), so we use weekId + 1 for API calls
    const weekNumberForApi = weekId + 1;
    
    switch (contentType) {
      case 'content':
        return `/cms/weeks/${weekNumberForApi}/upload/`;
      case 'announcement':
        return `/cms/courses/${courseId}/weeks/${weekNumberForApi}/announcement/create/`;
      case 'quiz':
        return `/cms/quizzes/${selectedQuiz?.quizId}/add_to_week/`;
      default:
        return '/cms/course-content/';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      const url = getContentUrl();
      const weekNumberForApi = weekId + 1;
      
      if (contentType === 'quiz') {
        const quizData = {
          week_id: weekNumberForApi,  // Send the 1-based week number
          start_time: startTime
        };
        
        const savedContent = await request.POST(url, quizData);
        // Add the quiz ID and type to the saved content for the response
        savedContent.quizId = selectedQuiz?.quizId;
        savedContent.type = 'quiz';
        savedContent.title = selectedQuiz?.title;
        onAdd(savedContent);
        closeModal();
      } 
      else {
        const formData = new FormData();
        
        formData.append('type', contentType);
        formData.append('title', title);
        formData.append('weekId', weekNumberForApi);
        formData.append('weekNumber', weekNumber);
        
        if (courseId) {
          formData.append('courseId', courseId);
        }
        
        if (contentType === 'content') {
          const cleanedContent = content.trim() === "<p><br></p>" || content === "<p></p>" ? "" : content;
          formData.append('content', cleanedContent);
          formData.append('format', 'Document');
          formData.append('createdAt', new Date().toISOString());
          
          attachments.forEach((file, index) => {
            formData.append(`attachment_${index}`, file);
          });
        } 
        else if (contentType === 'announcement') {
          const cleanedContent = content.trim() === "<p><br></p>" || content === "<p></p>" ? "" : content;
          formData.append('message', cleanedContent);
          formData.append('postedAt', new Date().toISOString());
          
          attachments.forEach((file, index) => {
            formData.append(`attachment_${index}`, file);
          });
        }
        
        const savedContent = await request.POST(url, formData, {
          isFormData: true
        });
        onAdd(savedContent);
        closeModal();
      }
    } catch (err) {
      console.error("Failed to save content", err);
      alert("Failed to save content. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="acm-modal-overlay" onClick={closeModal}>
      <div className="acm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="acm-modal-header">
          <h2>Add Content to Week {weekNumber}</h2>
          <button className="acm-close-btn" onClick={closeModal}>
            <MdClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="acm-form-group">
            <label>Content Type</label>
            <div className="acm-type-selector">
              <button
                type="button"
                className={`acm-type-btn ${contentType === 'content' ? 'acm-active' : ''}`}
                onClick={() => {
                  setContentType('content');
                  setSelectedQuiz(null);
                }}
              >
                <MdDescription size={20} />
                <span>Content</span>
              </button>
              <button
                type="button"
                className={`acm-type-btn ${contentType === 'announcement' ? 'acm-active' : ''}`}
                onClick={() => {
                  setContentType('announcement');
                  setSelectedQuiz(null);
                }}
              >
                <MdCampaign size={20} />
                <span>Announcement</span>
              </button>
              <button
                type="button"
                className={`acm-type-btn ${contentType === 'quiz' ? 'acm-active' : ''}`}
                onClick={() => {
                  setContentType('quiz');
                  setContent('');
                }}
              >
                <MdQuiz size={20} />
                <span>Quiz</span>
              </button>
            </div>
          </div>

          {(contentType === 'content' || contentType === 'announcement') && (
            <div className="acm-form-group">
              <label>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder={`Enter ${contentType} title`}
                className="acm-input"
              />
            </div>
          )}

          {(contentType === 'content' || contentType === 'announcement') && (
            <div className="acm-form-group">
              <label>{contentType === 'content' ? 'Content' : 'Announcement Message'}</label>
              <TextEditor
                value={content}
                onChange={setContent}
                placeholder={`Write your ${contentType} here...`}
                height="250px"
              />
            </div>
          )}

          {(contentType === 'content' || contentType === 'announcement') && (
            <div className="acm-form-group">
              <label>
                <MdAttachFile size={18} />
                Attachments (Optional)
              </label>
              
              <div className="acm-file-upload-area">
                <input
                  type="file"
                  id="acm-file-upload"
                  multiple
                  onChange={handleFileUpload}
                  className="acm-file-input"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.mp4,.zip"
                  disabled={submitting}
                />
                <label htmlFor="acm-file-upload" className="acm-file-upload-label">
                  <span className="acm-upload-icon">+</span>
                  <span className="acm-upload-text">
                    {submitting ? 'Uploading...' : 'Click to upload files'}
                  </span>
                  <span className="acm-upload-hint">PDF, DOC, PPT, Images, Videos (max 50MB each)</span>
                </label>
              </div>

              {attachments.length > 0 && (
                <div className="acm-file-list">
                  {attachments.map((file, index) => (
                    <div key={index} className="acm-file-item">
                      <span className="acm-file-icon"><MdFileUpload /></span>
                      <span className="acm-file-name">{file.name}</span>
                      <span className="acm-file-size">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      <button
                        type="button"
                        className="acm-file-remove"
                        onClick={() => removeAttachment(index)}
                        title="Remove file"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {contentType === 'quiz' && (
            <>
              <div className="acm-form-group">
                <label>Select Quiz (Only one quiz can be added per week)</label>
                {loading ? (
                  <div className="acm-loading-state">
                    <div className="acm-spinner"></div>
                    <p>Loading quizzes...</p>
                  </div>
                ) : quizzes.length === 0 ? (
                  <div className="acm-empty-state">
                    <p>No quizzes available. Create a quiz first.</p>
                  </div>
                ) : (
                  <div className="acm-quiz-selector">
                    {quizzes.map(quiz => (
                      <div
                        key={quiz.quizId}
                        className={`acm-quiz-option ${selectedQuiz?.quizId === quiz.quizId ? 'acm-selected' : ''}`}
                        onClick={() => setSelectedQuiz(quiz)}
                      >
                        <div className="acm-quiz-radio">
                          {selectedQuiz?.quizId === quiz.quizId ? (
                            <MdCheckCircle className="acm-radio-selected" />
                          ) : (
                            <MdRadioButtonUnchecked className="acm-radio-unchecked" />
                          )}
                        </div>
                        <div className="acm-quiz-info">
                          <div className="acm-quiz-title-row">
                            <span className="acm-quiz-title">{quiz.title}</span>
                          </div>
                          <div className="acm-quiz-details">
                            <span className="acm-quiz-course">
                              <MdStar size={12} /> {quiz.course}
                            </span>
                            <span className="acm-quiz-time">
                              <MdAccessTime size={12} /> {quiz.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedQuiz && (
                <div className="acm-form-group">
                  <label>Start Time</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="acm-input"
                  />
                </div>
              )}
            </>
          )}

          <div className="acm-modal-actions">
            <button type="button" className="acm-cancel-btn" onClick={closeModal}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="acm-submit-btn"
              disabled={
                ((contentType === 'content' || contentType === 'announcement') && (!title || !content)) ||
                (contentType === 'quiz' && (!selectedQuiz || !startTime)) ||
                submitting
              }
            >
              {submitting ? 'Saving...' : `Add ${contentType}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContentModal;
