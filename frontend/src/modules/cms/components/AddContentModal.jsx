import React, { useState } from 'react';
import './tt.css';

const AddContentModal = ({ closeModal, onAdd, weekNumber }) => {
  const [contentType, setContentType] = useState('content');
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState('PDF');
  const [fileUrl, setFileUrl] = useState('');
  const [duration, setDuration] = useState('15');
  const [questionsCount, setQuestionsCount] = useState('5');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newContent = {
      type: contentType,
      title: title,
      ...(contentType === 'content' && { format, fileUrl: fileUrl || '/files/sample.pdf' }),
      ...(contentType === 'quiz' && { 
        duration: duration + ' min', 
        questionsCount: parseInt(questionsCount),
        quizId: `quiz-${Date.now()}`
      }),
      ...(contentType === 'announcement' && { 
        message,
        date: new Date().toLocaleDateString()
      })
    };
    
    onAdd(newContent);
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Content to Week {weekNumber}</h2>
          <button className="close-btn" onClick={closeModal}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Content Type</label>
            <div className="type-selector">
              <button
                type="button"
                className={`type-btn ${contentType === 'content' ? 'active' : ''}`}
                onClick={() => setContentType('content')}
              >
                📄 Content
              </button>
              <button
                type="button"
                className={`type-btn ${contentType === 'quiz' ? 'active' : ''}`}
                onClick={() => setContentType('quiz')}
              >
                ❓ Quiz
              </button>
              <button
                type="button"
                className={`type-btn ${contentType === 'announcement' ? 'active' : ''}`}
                onClick={() => setContentType('announcement')}
              >
                📢 Announcement
              </button>
            </div>
          </div>

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

          {contentType === 'content' && (
            <>
              <div className="form-group">
                <label>Format</label>
                <select value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option value="PDF">PDF</option>
                  <option value="Video">Video</option>
                  <option value="Document">Document</option>
                  <option value="Link">Link</option>
                </select>
              </div>
              <div className="form-group">
                <label>File URL (optional)</label>
                <input
                  type="text"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="/files/sample.pdf"
                />
              </div>
            </>
          )}

          {contentType === 'quiz' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Questions Count</label>
                  <input
                    type="number"
                    value={questionsCount}
                    onChange={(e) => setQuestionsCount(e.target.value)}
                    min="1"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {contentType === 'announcement' && (
            <div className="form-group">
              <label>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="4"
                required
                placeholder="Enter announcement message..."
              />
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Add {contentType}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContentModal;
