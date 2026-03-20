import { useState, useEffect } from "react";
import TextEditor from "../components/TextEditor";
import "./AnnouncementEditor.css";
import { MdCampaign, MdDescription, MdGroups, MdRocketLaunch, MdPublic, MdVisibility, MdMenuBook, MdAttachFile } from "react-icons/md";


const AnnouncementEditor = ({ announcement = null, onSave, onCancel }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
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

  // Populate form if editing existing announcement
  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title || "");
      setContent(announcement.content || "");
      setAudience(announcement.audience?.includes("ALL") ? "ALL" : "SPECIFIC");
      setSelectedModules(announcement.audience?.filter(m => m !== "ALL") || []);
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
        fileUrl: URL.createObjectURL(file),
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
            <span className="label-icon"><MdCampaign /></span>
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

        {/* Rich Text Editor - Using TextEditor component */}
        <div className="form-section">
          <label className="section-label">
            <span className="label-icon"><MdDescription /></span>
            Announcement Content
          </label>
          <TextEditor
            value={content}
            onChange={setContent}
            placeholder="Write your announcement here... You can use formatting, add links, and more."
            height="400px"
          />
        </div>

        {/* Audience Selection */}
        <div className="form-section">
          <label className="section-label">
            <span className="label-icon"><MdGroups /></span>
            Target Audience
          </label>
          
          <div className="audience-tabs">
            <button
              className={`audience-tab ${audience === 'ALL' ? 'active' : ''}`}
              onClick={() => setAudience('ALL')}
            >
              <MdPublic /> All Modules
            </button>
            <button
              className={`audience-tab ${audience === 'SPECIFIC' ? 'active' : ''}`}
              onClick={() => setAudience('SPECIFIC')}
            >
              <MdMenuBook /> Specific Modules
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
            <span className="label-icon"><MdAttachFile /></span>
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
                  <span className="file-icon"><MdDescription /></span>
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
            <span className="btn-icon"><MdVisibility /></span>
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
                  <span className="btn-icon"><MdRocketLaunch /></span>
                  {announcement ? 'Update Announcement' : 'Post Announcement'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview Modal */}
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
                    <span className="audience-badge all"><MdPublic /> All Modules</span>
                  ) : (
                    selectedModules.map(code => (
                      <span key={code} className="audience-badge">{code}</span>
                    ))
                  )}
                </div>

                <div 
                  className="preview-content-html"
                  dangerouslySetInnerHTML={{ __html: content }} 
                />

                {attachments.length > 0 && (
                  <div className="preview-attachments">
                    <h4><MdAttachFile /> Attachments</h4>
                    <div className="preview-attachment-list">
                      {attachments.map((file, idx) => (
                        <div key={idx} className="preview-attachment">
                          <span className="attachment-icon"><MdDescription /></span>
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
