import React, { useState, useEffect } from 'react';
import TextEditor from './TextEditor';
import request from '../../../utils/requestMethods.jsx'; 
import { MdDescription, MdCampaign, MdQuiz, MdClose, MdAttachFile, MdSchedule, MdAccessTime, MdStar, MdFileUpload } from 'react-icons/md';
import './AddContentModal.css';

const AddContentModal = ({ closeModal, onAdd, weekNumber }) => {
  const [contentType, setContentType] = useState('content');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [duration, setDuration] = useState('30');
  const [startTime, setStartTime] = useState(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 60); // Default to 1 hour from now
        return now.toISOString().slice(0, 16)
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load available quizzes using request.GET
  useEffect(() => {
    if (contentType === 'quiz') {
      const fetchQuizzes = async () => {
        setLoading(true);
        try {
          const data = await request.GET('/_data/quizzes.json');
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

  // File upload handler using request.UPLOAD
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 0) {
      setUploading(true);
      try {
        const formData = new FormData();
        files.forEach(file => {
          formData.append('attachments', file);
        });
        
        const uploadedFiles = await request.UPLOAD('/api/upload', formData);
        setAttachments(prev => [...prev, ...uploadedFiles]);
      } catch (err) {
        console.error("Failed to upload files", err);
        alert("Failed to upload files. Please try again.");
      } finally {
        setUploading(false);
      }
    } else {
      setAttachments(prev => [...prev, ...files]);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const baseContent = {
      type: contentType,
      title: title,
      weekNumber: weekNumber,
      attachments: attachments.map(file => ({
        fileName: file.name || file.fileName,
        fileUrl: file.url || file.fileUrl || URL.createObjectURL(file),
        fileSize: file.size || file.fileSize,
        fileType: file.type || file.fileType
      }))
    };

    let newContent;

    if (contentType === 'content') {
      newContent = {
        ...baseContent,
        content: content,
        format: 'Document',
        createdAt: new Date().toISOString()
      };
    } 
    else if (contentType === 'announcement') {
      newContent = {
        ...baseContent,
        content: content,
        postedAt: new Date().toISOString()
      };
    } 
    else if (contentType === 'quiz') {
      newContent = {
        ...baseContent,
        quizId: selectedQuiz?.quizId,
        quizTitle: selectedQuiz?.title,
        duration: parseInt(duration),
        startTime: startTime,
        questions: selectedQuiz?.questions || [],
        totalPoints: selectedQuiz?.totalPoints || 0
      };
    }

    try {
      const savedContent = await request.POST('/api/course-content', newContent);
      onAdd(savedContent);
    } catch (err) {
      console.error("Failed to save content", err);
      alert("Failed to save content. Please try again.");
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Content to Week {weekNumber}</h2>
          <button className="close-btn" onClick={closeModal}>
            <MdClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Content Type Selection */}
          <div className="form-group">
            <label>Content Type</label>
            <div className="type-selector">
              <button
                type="button"
                className={`type-btn ${contentType === 'content' ? 'active' : ''}`}
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
                className={`type-btn ${contentType === 'announcement' ? 'active' : ''}`}
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
                className={`type-btn ${contentType === 'quiz' ? 'active' : ''}`}
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

          {/* Title */}
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={`Enter ${contentType} title`}
            />
          </div>

          {/* Content/Announcement Editor */}
          {(contentType === 'content' || contentType === 'announcement') && (
            <div className="form-group">
              <label>{contentType === 'content' ? 'Content' : 'Announcement Message'}</label>
              <TextEditor
                value={content}
                onChange={setContent}
                placeholder={`Write your ${contentType} here...`}
                height="250px"
              />
            </div>
          )}

          {/* Attachments */}
          {(contentType === 'content' || contentType === 'announcement') && (
            <div className="form-group">
              <label>
                <MdAttachFile size={18} />
                Attachments (Optional)
              </label>
              
              <div className="file-upload-area">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  onChange={handleFileUpload}
                  className="file-input"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.mp4,.zip"
                  disabled={uploading}
                />
                <label htmlFor="file-upload" className="file-upload-label">
                  <span className="upload-icon">+</span>
                  <span className="upload-text">
                    {uploading ? 'Uploading...' : 'Click to upload files'}
                  </span>
                  <span className="upload-hint">PDF, DOC, PPT, Images, Videos (max 50MB each)</span>
                </label>
              </div>

              {attachments.length > 0 && (
                <div className="file-list">
                  {attachments.map((file, index) => (
                    <div key={index} className="file-item">
                      <span className="file-icon"><MdFileUpload /></span>
                      <span className="file-name">{file.name || file.fileName}</span>
                      <span className="file-size">
                        {file.size ? (file.size / 1024).toFixed(1) : file.fileSize} KB
                      </span>
                      <button
                        type="button"
                        className="file-remove"
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

          {/* Quiz Selection - Radio buttons completely removed */}
          {contentType === 'quiz' && (
            <>
              <div className="form-group">
                <label>Select Quiz</label>
                {loading ? (
                  <p>Loading quizzes...</p>
                ) : (
                  <div className="quiz-selector">
                    {quizzes.map(quiz => (
                      <div
                        key={quiz.quizId}
                        className={`quiz-option ${selectedQuiz?.quizId === quiz.quizId ? 'selected' : ''}`}
                        onClick={() => setSelectedQuiz(quiz)}
                      >
                        <div className="quiz-info">
                          <div className="quiz-title-row">
                            <span className="quiz-title">{quiz.title}</span>
                          </div>
                          <div className="quiz-details">
                            <span className="quiz-course">{quiz.course}</span>
                            <span className="quiz-time"><MdAccessTime /> {quiz.time}</span>
                            <span className="quiz-date"><MdAccessTime /> {new Date(quiz.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
          
              {selectedQuiz && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        Duration (miniutes)
                      </label>
                      <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        min="1"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Start Time

                  </label>
                      <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Form Actions */}
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={closeModal}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={
                !title || 
                ((contentType === 'content' || contentType === 'announcement') && !content) ||
                (contentType === 'quiz' && (!selectedQuiz || !startTime)) ||
                uploading
              }
            >
              {uploading ? 'Uploading...' : `Add ${contentType}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContentModal;
