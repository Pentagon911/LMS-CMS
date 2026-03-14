import { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import "./AnnouncementEditor.css";

const AnnouncementEditor = ({ announcement = null, onSave, onCancel }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState("ALL");
  const [selectedModules, setSelectedModules] = useState([]);
  const [modules, setModules] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Load modules for audience selection
  useEffect(() => {
    fetch("/_data/moduleCard.json")
      .then(res => res.json())
      .then(data => setModules(data))
      .catch(err => console.error("Failed to load modules", err));
  }, []);

  // Initialize Quill editor
  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: "Write your announcement here... You can use formatting, add links, and more.",
        modules: {
          toolbar: [
            ["bold", "italic", "underline", "strike"],
            [{ header: [1, 2, 3, false] }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "blockquote", "code-block"],
            ["clean"]
          ]
        }
      });

      // If editing existing announcement, populate content
      if (announcement) {
        setTitle(announcement.title || "");
        setAudience(announcement.audience?.includes("ALL") ? "ALL" : "SPECIFIC");
        setSelectedModules(announcement.audience?.filter(m => m !== "ALL") || []);
        
        if (announcement.content) {
          quillRef.current.root.innerHTML = announcement.content;
        }
      }
    }
  }, [announcement]);

  // File upload handlers
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Module selection toggle
  const handleModuleToggle = (moduleCode) => {
    setSelectedModules(prev => 
      prev.includes(moduleCode)
        ? prev.filter(code => code !== moduleCode)
        : [...prev, moduleCode]
    );
  };

  // Submit handler
  const handleSubmit = async () => {
    const content = quillRef.current.root.innerHTML;
    
    // Validation
    if (!title.trim()) {
      alert("Please enter an announcement title");
      return;
    }
    
    if (!content.trim() || content === "<p><br></p>") {
      alert("Please enter announcement content");
      return;
    }

    if (audience === "SPECIFIC" && selectedModules.length === 0) {
      alert("Please select at least one module for this announcement");
      return;
    }

    setIsSubmitting(true);

    const announcementData = {
      id: announcement?.id || Date.now(),
      title: title,
      content: content,
      postedBy: JSON.parse(localStorage.getItem('user'))?.username || 'admin',
      createdAt: announcement?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      audience: audience === "ALL" ? ["ALL"] : selectedModules,
      attachments: attachments.map(file => ({
        fileName: file.name,
        fileUrl: URL.createObjectURL(file), // In real app, upload to server
        fileSize: file.size,
        fileType: file.type
      }))
    };

    console.log("Announcement Data:", announcementData);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      if (onSave) {
        onSave(announcementData);
      }
    }, 1000);
  };

  return (
    <div className="announcement-editor-container">
      <div className="announcement-editor-header">
        <h1>{announcement ? 'Edit Announcement' : 'Create New Announcement'}</h1>
        <p>Share important updates with your students</p>
      </div>

      <div className="announcement-editor-content">
        {/* Title Section */}
        <div className="form-section">
          <label className="section-label">
            <span className="label-icon">📢</span>
            Announcement Title
          </label>
          <input
            type="text"
            className="title-input"
            placeholder="e.g., Midterm Exam Schedule Update"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength="200"
          />
          <div className="char-count">{title.length}/200</div>
        </div>

        {/* Rich Text Editor */}
        <div className="form-section">
          <label className="section-label">
            <span className="label-icon">📝</span>
            Announcement Content
          </label>
          <div className="editor-wrapper">
            <div
              ref={editorRef}
              className="quill-editor"
            />
          </div>
        </div>

        {/* Audience Selection */}
        <div className="form-section">
          <label className="section-label">
            <span className="label-icon">👥</span>
            Target Audience
          </label>
          
          <div className="audience-tabs">
            <button
              className={`audience-tab ${audience === 'ALL' ? 'active' : ''}`}
              onClick={() => setAudience('ALL')}
            >
              🌐 All Modules
            </button>
            <button
              className={`audience-tab ${audience === 'SPECIFIC' ? 'active' : ''}`}
              onClick={() => setAudience('SPECIFIC')}
            >
              📚 Specific Modules
            </button>
          </div>

          {audience === 'SPECIFIC' && (
            <div className="module-selection">
              <p className="module-hint">Select modules for this announcement:</p>
              <div className="module-grid">
                {modules.map(module => (
                  <label key={module.code} className="module-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedModules.includes(module.code)}
                      onChange={() => handleModuleToggle(module.code)}
                    />
                    <span className="module-code">{module.code}</span>
                    <span className="module-title">{module.title}</span>
                  </label>
                ))}
              </div>
              {selectedModules.length > 0 && (
                <div className="selected-count">
                  ✓ {selectedModules.length} module(s) selected
                </div>
              )}
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="form-section">
          <label className="section-label">
            <span className="label-icon">📎</span>
            Attachments (Optional)
          </label>
          
          <div className="file-upload-area">
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleFileUpload}
              className="file-input"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
            />
            <label htmlFor="file-upload" className="file-upload-label">
              <span className="upload-icon">+</span>
              <span className="upload-text">Click to upload files</span>
              <span className="upload-hint">PDF, DOC, PPT, Images (max 10MB each)</span>
            </label>
          </div>

          {attachments.length > 0 && (
            <div className="file-list">
              {attachments.map((file, index) => (
                <div key={index} className="file-item">
                  <span className="file-icon">📄</span>
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">
                    {(file.size / 1024).toFixed(1)} KB
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

        {/* Form Actions */}
        <div className="form-actions">
          <button
            className="preview-btn"
            onClick={() => setShowPreview(true)}
          >
            <span className="btn-icon">👁️</span>
            Preview
          </button>
          
          <div className="action-buttons">
            {onCancel && (
              <button
                className="cancel-btn"
                onClick={onCancel}
                type="button"
              >
                Cancel
              </button>
            )}
            
            <button
              className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  {announcement ? 'Updating...' : 'Posting...'}
                </>
              ) : (
                <>
                  <span className="btn-icon">🚀</span>
                  {announcement ? 'Update Announcement' : 'Post Announcement'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview Modal - Cleaned version without priority and expiry */}
        {showPreview && (
          <div className="preview-modal" onClick={() => setShowPreview(false)}>
            <div className="preview-content" onClick={e => e.stopPropagation()}>
              <div className="preview-header">
                <h3>Announcement Preview</h3>
                <button className="close-preview" onClick={() => setShowPreview(false)}>×</button>
              </div>
              
              <div className="preview-body">
                <div className="preview-date">
                  {new Date().toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>

                <h2 className="preview-title">{title || "Untitled Announcement"}</h2>
                
                <div className="preview-audience">
                  {audience === "ALL" ? (
                    <span className="audience-badge all">🌐 All Modules</span>
                  ) : (
                    selectedModules.map(code => (
                      <span key={code} className="audience-badge">{code}</span>
                    ))
                  )}
                </div>

                <div 
                  className="preview-content-html"
                  dangerouslySetInnerHTML={{ 
                    __html: quillRef.current?.root.innerHTML || "No content entered" 
                  }} 
                />

                {attachments.length > 0 && (
                  <div className="preview-attachments">
                    <h4>📎 Attachments</h4>
                    <div className="preview-attachment-list">
                      {attachments.map((file, idx) => (
                        <div key={idx} className="preview-attachment">
                          <span className="attachment-icon">📄</span>
                          <span className="attachment-name">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementEditor;
