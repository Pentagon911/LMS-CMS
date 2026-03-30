import React, { useState, useEffect } from 'react';
import TextEditor from './TextEditor';
import request from '../../../utils/requestMethods.jsx';
import { MdDescription, MdCampaign, MdQuiz, MdClose, MdAttachFile, MdAccessTime, MdStar, MdFileUpload, MdCheckCircle, MdRadioButtonUnchecked, MdLink } from 'react-icons/md';
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
  
  // New state for link option
  const [contentSource, setContentSource] = useState('file'); // 'file' or 'link'
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => {
    if (contentType === 'quiz') {
      const fetchQuizzes = async () => {
        setLoading(true);
        try {
          const data = await request.GET(`/cms/courses/${courseId}/course_quizzes/`);
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
    const weekNumberForApi = weekId + 1;
    
    switch (contentType) {
      case 'content':
        return `/cms/courses/${courseId}/dashboard/add_content/`;
      case 'announcement':
        return `/cms/courses/${courseId}/announcements/`;
      case 'quiz':
        return `/cms/quizzes/${selectedQuiz?.quizId}/add_to_week/`;
      default:
        return '/cms/course-content/';
    }
  };

  const validateForm = () => {
    if (contentType === 'content') {
      if (!title) {
        alert('Please enter a title');
        return false;
      }
      if (!content) {
        alert('Please enter content description');
        return false;
      }
      if (contentSource === 'file' && attachments.length === 0) {
        alert('Please upload at least one file');
        return false;
      }
      if (contentSource === 'link' && !linkUrl) {
        alert('Please enter a valid URL');
        return false;
      }
      if (contentSource === 'link' && linkUrl && !isValidUrl(linkUrl)) {
        alert('Please enter a valid URL (e.g., https://example.com)');
        return false;
      }
    } else if (contentType === 'announcement') {
      if (!title) {
        alert('Please enter an announcement title');
        return false;
      }
      if (!content) {
        alert('Please enter announcement message');
        return false;
      }
    }
    return true;
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

const handleSubmit = (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  // Prepare the data object to pass to parent
  const newItem = {
    type: contentType,
    title,
    content,  // description or announcement message
    weekId: weekId + 1,   // optional, parent might need week number
    courseId,
  };

  // For content type, include attachments or link
  if (contentType === 'content') {
    if (contentSource === 'file') {
      newItem.attachments = attachments;  // list of File objects
    } else if (contentSource === 'link') {
      newItem.link = linkUrl;
    }
    newItem.contentSource = contentSource;
  }

  // For announcement, include attachments if any
  if (contentType === 'announcement') {
    if (attachments.length > 0) {
      newItem.attachments = attachments;
    }
  }

  // For quiz, include the selected quiz and start time
  if (contentType === 'quiz') {
    newItem.quizId = selectedQuiz?.quizId;
    newItem.startTime = startTime;
  }

  onAdd(newItem);
  closeModal();
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
                  setContentSource('file');
                  setLinkUrl('');
                  setAttachments([]);
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
              <label>{contentType === 'content' ? 'Description' : 'Announcement Message'}</label>
              <TextEditor
                value={content}
                onChange={setContent}
                placeholder={`Write your ${contentType} here...`}
                height="250px"
              />
            </div>
          )}

          {contentType === 'content' && (
            <>
              <div className="acm-form-group">
                <label>Content Source</label>
                <div className="acm-type-selector">
                  <button
                    type="button"
                    className={`acm-type-btn ${contentSource === 'file' ? 'acm-active' : ''}`}
                    onClick={() => {
                      setContentSource('file');
                      setLinkUrl('');
                    }}
                  >
                    <MdFileUpload size={20} />
                    <span>Upload File</span>
                  </button>
                  <button
                    type="button"
                    className={`acm-type-btn ${contentSource === 'link' ? 'acm-active' : ''}`}
                    onClick={() => {
                      setContentSource('link');
                      setAttachments([]);
                    }}
                  >
                    <MdLink size={20} />
                    <span>External Link</span>
                  </button>
                </div>
              </div>

              {contentSource === 'file' && (
                <div className="acm-form-group">
                  <label>
                    <MdAttachFile size={18} />
                    Attachments (Required)
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
                      <span className="acm-upload-hint">PDF (max 10MB), Videos (max 100MB)</span>
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

              {contentSource === 'link' && (
                <div className="acm-form-group">
                  <label>
                    <MdLink size={18} />
                    External Link (Required)
                  </label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com/resource"
                    className="acm-input"
                    required
                  />
                  <small className="acm-hint">
                    Enter a valid URL including http:// or https://
                  </small>
                </div>
              )}
            </>
          )}

          {(contentType === 'announcement') && (
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
                  <span className="acm-upload-hint">PDF (max 10MB), Videos (max 100MB)</span>
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
              disabled={submitting}
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
