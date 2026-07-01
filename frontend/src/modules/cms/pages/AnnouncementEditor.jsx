import { useState, useEffect } from "react";
import TextEditor from "../components/TextEditor";
import "./AnnouncementEditor.css";
import { MdCampaign, MdDescription, MdGroups, MdRocketLaunch, MdPublic, MdVisibility, MdMenuBook, MdAttachFile, MdSchool, MdCalendarToday, MdFilterList, MdClear} from "react-icons/md";
import request from "../../../utils/requestMethods";

const AnnouncementEditor = ({ announcement = null, onSave, onCancel }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState("ALL");
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);


  const [facultiesData, setFacultiesData] = useState([]); // { faculty_id, faculty_name, faculty_code, batch_years }
  const [batchYearsList, setBatchYearsList] = useState([]); // unique sorted batch years


  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [selectedBatchYears, setSelectedBatchYears] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);


  const [showFacultyFilter, setShowFacultyFilter] = useState(false);
  const [showBatchFilter, setShowBatchFilter] = useState(false);
  const [showDepartmentFilter, setShowDepartmentFilter] = useState(false);


  const [facultySearchTerm, setFacultySearchTerm] = useState("");
  const [batchSearchTerm, setBatchSearchTerm] = useState("");
  const [deptSearchTerm, setDeptSearchTerm] = useState("");


  const dummyDepartments = [
    { id: 1, name: "Computer Science", code: "CS" },
    { id: 2, name: "Information Technology", code: "IT" },
    { id: 3, name: "Electrical Engineering", code: "EE" },
    { id: 4, name: "Mechanical Engineering", code: "ME" },
    { id: 5, name: "Civil Engineering", code: "CE" }
  ];


  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await request.GET("/cms/global-announcements/faculty-batch-years/");
        setFacultiesData(data);
        

        const allYears = data.flatMap(faculty => faculty.batch_years || []);
        const uniqueYears = [...new Set(allYears)].sort((a, b) => b - a); // descending order
        setBatchYearsList(uniqueYears);
      } catch (err) {
        console.error("Failed to load faculties/batch years", err);
      }
    };
    fetchData();
  }, []);


  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title || "");
      setContent(announcement.content || "");
      setAudience(announcement.target_type === "all" ? "ALL" : "SPECIFIC");
      

      if (announcement.targets) {

        const facultyTarget = announcement.targets.find(t => t.target_type === "faculty");
        if (facultyTarget) setSelectedFaculties(facultyTarget.faculty_ids || []);
        
        const batchTarget = announcement.targets.find(t => t.target_type === "batch");
        if (batchTarget) setSelectedBatchYears(batchTarget.batch_years || []);
        
        const deptTarget = announcement.targets.find(t => t.target_type === "department");
        if (deptTarget) setSelectedDepartments(deptTarget.department_ids || []);
      }
    }
  }, [announcement]);


  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };


  const handleFacultyToggle = (facultyId) => {
    setSelectedFaculties(prev => 
      prev.includes(facultyId) ? prev.filter(id => id !== facultyId) : [...prev, facultyId]
    );
  };

  const handleBatchYearToggle = (year) => {
    setSelectedBatchYears(prev => 
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  const handleDepartmentToggle = (deptId) => {
    setSelectedDepartments(prev => 
      prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]
    );
  };

  const handleSelectAllFaculties = () => {
    if (selectedFaculties.length === facultiesData.length) {
      setSelectedFaculties([]);
    } else {
      setSelectedFaculties(facultiesData.map(f => f.faculty_id));
    }
  };

  const handleSelectAllBatchYears = () => {
    if (selectedBatchYears.length === batchYearsList.length) {
      setSelectedBatchYears([]);
    } else {
      setSelectedBatchYears([...batchYearsList]);
    }
  };

  const handleSelectAllDepartments = () => {
    if (selectedDepartments.length === dummyDepartments.length) {
      setSelectedDepartments([]);
    } else {
      setSelectedDepartments(dummyDepartments.map(d => d.id));
    }
  };

  const clearAllFilters = () => {
    setSelectedFaculties([]);
    setSelectedBatchYears([]);
    setSelectedDepartments([]);
  };


  const filteredFaculties = facultiesData.filter(faculty =>
    faculty.faculty_name?.toLowerCase().includes(facultySearchTerm.toLowerCase()) ||
    faculty.faculty_code?.toLowerCase().includes(facultySearchTerm.toLowerCase())
  );

  const filteredBatchYears = batchYearsList.filter(year =>
    year.toString().includes(batchSearchTerm)
  );

  const filteredDepartments = dummyDepartments.filter(dept =>
    dept.name.toLowerCase().includes(deptSearchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(deptSearchTerm.toLowerCase())
  );

    const buildTargets = () => {
      const targets = [];
    

      if (selectedFaculties.length > 0) {
        targets.push({
          target_type: "faculty",
          faculty_ids: selectedFaculties
        });
      }
    

      if (selectedDepartments.length > 0) {
        targets.push({
          target_type: "department",
          department_ids: selectedDepartments
        });
      }
    

      const hasBatch = selectedBatchYears.length > 0;
      const hasDept = selectedDepartments.length > 0;
      const hasFaculty = selectedFaculties.length > 0;
    
      if (hasBatch) {

        targets.push({
          target_type: "batch",
          batch_years: selectedBatchYears
        });
    

        if (hasDept) {
          targets.push({
            target_type: "batch",
            batch_years: selectedBatchYears,
            department_ids: selectedDepartments
          });
        }
    

        if (hasFaculty) {
          targets.push({
            target_type: "batch",
            batch_years: selectedBatchYears,
            faculty_ids: selectedFaculties
          });
        }
    

        if (hasDept && hasFaculty) {
          targets.push({
            target_type: "batch",
            batch_years: selectedBatchYears,
            department_ids: selectedDepartments,
            faculty_ids: selectedFaculties
          });
        }
      } else {

        if (hasDept) {
          targets.push({
            target_type: "batch",
            department_ids: selectedDepartments
          });
        }
        if (hasFaculty) {
          targets.push({
            target_type: "batch",
            faculty_ids: selectedFaculties
          });
        }
      }
    
      return targets;
    };

    const handleSubmit = async () => {

      if (!title.trim()) {
        alert("Please enter an announcement title");
        return;
      }
      if (!content.trim() || content === "<p><br></p>") {
        alert("Please enter announcement content");
        return;
      }
      if (audience === "SPECIFIC") {
        const targets = buildTargets();
        if (targets.length === 0) {
          alert("Please select at least one faculty, batch year, or department.");
          return;
        }
      }
    
      setIsSubmitting(true);
    

      const jsonData = {
        title: title,
        content: content,
        pdf_file: null,                     // keep null if not uploading files here
        is_active: true,                    // you can make this dynamic later
        publish_from: new Date().toISOString(),
        publish_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        targets: audience === "ALL" ? [] : buildTargets()
      };
    
      try {

        const response = await request.POST("/cms/global-announcements/bulk-create/", jsonData);
        console.log("Announcement posted:", response);
    
        if (onSave) {
          onSave(response);
        }
    

        setTitle("");
        setContent("");
        setAttachments([]);
        setSelectedFaculties([]);
        setSelectedBatchYears([]);
        setSelectedDepartments([]);
      } catch (err) {
        console.error("Failed to post announcement", err);
        alert("Failed to post announcement. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    };

  return (
    <div className="announcement-editor-container">
      <div className="announcement-editor-header">
        <h1>{announcement ? 'Edit Announcement' : 'Create New Announcement'}</h1>
        <p>Share important updates with your students</p>
      </div>

      <div className="announcement-editor-content">
        {/* Title Section */}
        <div className="announcement-form-section">
          <label className="announcement-section-label">
            <span className="announcement-label-icon"><MdCampaign /></span>
            Announcement Title
          </label>
          <input
            type="text"
            className="announcement-title-input"
            placeholder="e.g., Midterm Exam Schedule Update"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength="200"
          />
          <div className="announcement-char-count">{title.length}/200</div>
        </div>

        {/* Rich Text Editor */}
        <div className="announcement-form-section">
          <label className="announcement-section-label">
            <span className="announcement-label-icon"><MdDescription /></span>
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
        <div className="announcement-form-section">
          <label className="announcement-section-label">
            <span className="announcement-label-icon"><MdGroups /></span>
            Target Audience
          </label>
          
          <div className="announcement-audience-tabs">
            <button
              className={`announcement-audience-tab ${audience === 'ALL' ? 'active' : ''}`}
              onClick={() => setAudience('ALL')}
            >
              <MdPublic /> All Users
            </button>
            <button
              className={`announcement-audience-tab ${audience === 'SPECIFIC' ? 'active' : ''}`}
              onClick={() => setAudience('SPECIFIC')}
            >
              <MdMenuBook /> Specific Groups
            </button>
          </div>

          {audience === 'SPECIFIC' && (
            <div className="announcement-filters-container">
              {/* Filter Header */}
              <div className="announcement-filters-header">
                <MdFilterList />
                <span>Select Groups to Target</span>
                {(selectedFaculties.length > 0 || selectedBatchYears.length > 0 || selectedDepartments.length > 0) && (
                  <button className="announcement-clear-filters-btn" onClick={clearAllFilters}>
                    <MdClear /> Clear All
                  </button>
                )}
              </div>

              {/* Faculties */}
              <div className="announcement-filter-group">
                <div 
                  className="announcement-filter-group-header"
                  onClick={() => setShowFacultyFilter(!showFacultyFilter)}
                >
                  <span>Faculties</span>
                  <span className="announcement-filter-count">
                    {selectedFaculties.length} selected
                  </span>
                  <button className="announcement-select-all-btn" onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAllFaculties();
                  }}>
                    {selectedFaculties.length === facultiesData.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                {showFacultyFilter && (
                  <div className="announcement-filter-content">
                    <div className="announcement-filter-search">
                      <input
                        type="text"
                        placeholder="Search faculties..."
                        value={facultySearchTerm}
                        onChange={(e) => setFacultySearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="announcement-filter-options">
                      {filteredFaculties.map(faculty => (
                        <label key={faculty.faculty_id} className="announcement-filter-option">
                          <input
                            type="checkbox"
                            checked={selectedFaculties.includes(faculty.faculty_id)}
                            onChange={() => handleFacultyToggle(faculty.faculty_id)}
                          />
                          <span className="announcement-filter-option-name">{faculty.faculty_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Batch Years */}
              <div className="announcement-filter-group">
                <div 
                  className="announcement-filter-group-header"
                  onClick={() => setShowBatchFilter(!showBatchFilter)}
                >
                  <span>Batch Years</span>
                  <span className="announcement-filter-count">
                    {selectedBatchYears.length} selected
                  </span>
                  <button className="announcement-select-all-btn" onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAllBatchYears();
                  }}>
                    {selectedBatchYears.length === batchYearsList.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                {showBatchFilter && (
                  <div className="announcement-filter-content">
                    <div className="announcement-filter-search">
                      <input
                        type="text"
                        placeholder="Search years..."
                        value={batchSearchTerm}
                        onChange={(e) => setBatchSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="announcement-filter-options announcement-batch-options">
                      {filteredBatchYears.map(year => (
                        <label key={year} className="announcement-filter-option">
                          <input
                            type="checkbox"
                            checked={selectedBatchYears.includes(year)}
                            onChange={() => handleBatchYearToggle(year)}
                          />
                          <span className="announcement-filter-option-icon">
                            <MdCalendarToday />
                          </span>
                          <span className="announcement-filter-option-name">{year}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Departments (dummy) */}
              <div className="announcement-filter-group">
                <div 
                  className="announcement-filter-group-header"
                  onClick={() => setShowDepartmentFilter(!showDepartmentFilter)}
                >
                  <span>Departments</span>
                  <span className="announcement-filter-count">
                    {selectedDepartments.length} selected
                  </span>
                  <button className="announcement-select-all-btn" onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAllDepartments();
                  }}>
                    {selectedDepartments.length === dummyDepartments.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                {showDepartmentFilter && (
                  <div className="announcement-filter-content">
                    <div className="announcement-filter-search">
                      <input
                        type="text"
                        placeholder="Search departments..."
                        value={deptSearchTerm}
                        onChange={(e) => setDeptSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="announcement-filter-options">
                      {filteredDepartments.map(dept => (
                        <label key={dept.id} className="announcement-filter-option">
                          <input
                            type="checkbox"
                            checked={selectedDepartments.includes(dept.id)}
                            onChange={() => handleDepartmentToggle(dept.id)}
                          />
                          <span className="announcement-filter-option-icon">
                            <MdSchool />
                          </span>
                          <span className="announcement-filter-option-name">{dept.name} ({dept.code})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Summary */}
              {(selectedFaculties.length > 0 || selectedBatchYears.length > 0 || selectedDepartments.length > 0) && (
                <div className="announcement-selected-summary">
                  <h4>Selected Groups Summary</h4>
                  {selectedFaculties.length > 0 && (
                    <div className="announcement-summary-group">
                      <strong>Faculties:</strong>
                      <div className="announcement-summary-tags">
                        {selectedFaculties.map(fId => {
                          const faculty = facultiesData.find(f => f.faculty_id === fId);
                          return <span key={fId} className="announcement-summary-tag">{faculty?.faculty_name}</span>;
                        })}
                      </div>
                    </div>
                  )}
                  {selectedBatchYears.length > 0 && (
                    <div className="announcement-summary-group">
                      <strong>Batch Years:</strong>
                      <div className="announcement-summary-tags">
                        {selectedBatchYears.map(year => (
                          <span key={year} className="announcement-summary-tag">{year}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedDepartments.length > 0 && (
                    <div className="announcement-summary-group">
                      <strong>Departments:</strong>
                      <div className="announcement-summary-tags">
                        {selectedDepartments.map(dId => {
                          const dept = dummyDepartments.find(d => d.id === dId);
                          return <span key={dId} className="announcement-summary-tag">{dept?.name}</span>;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="announcement-form-section">
          <label className="announcement-section-label">
            <span className="announcement-label-icon"><MdAttachFile /></span>
            Attachments (Optional)
          </label>
          
          <div className="announcement-file-upload-area">
            <input
              type="file"
              id="announcement-file-upload"
              multiple
              onChange={handleFileUpload}
              className="announcement-file-input"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
            />
            <label htmlFor="announcement-file-upload" className="announcement-file-upload-label">
              <span className="announcement-upload-icon">+</span>
              <span className="announcement-upload-text">Click to upload files</span>
              <span className="announcement-upload-hint">PDF, DOC, PPT, Images (max 10MB each)</span>
            </label>
          </div>

          {attachments.length > 0 && (
            <div className="announcement-file-list">
              {attachments.map((file, index) => (
                <div key={index} className="announcement-file-item">
                  <span className="announcement-file-icon"><MdDescription /></span>
                  <span className="announcement-file-name">{file.name}</span>
                  <span className="announcement-file-size">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    type="button"
                    className="announcement-file-remove"
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
        <div className="announcement-form-actions">
          <button
            className="announcement-preview-btn"
            onClick={() => setShowPreview(true)}
          >
            <span className="announcement-btn-icon"><MdVisibility /></span>
            Preview
          </button>
          
          <div className="announcement-action-buttons">
            {onCancel && (
              <button
                className="announcement-cancel-btn"
                onClick={onCancel}
                type="button"
              >
                Cancel
              </button>
            )}
            
            <button
              className={`announcement-submit-btn ${isSubmitting ? 'submitting' : ''}`}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="announcement-spinner"></span>
                  {announcement ? 'Updating...' : 'Posting...'}
                </>
              ) : (
                <>
                  <span className="announcement-btn-icon"><MdRocketLaunch /></span>
                  {announcement ? 'Update Announcement' : 'Post Announcement'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="announcement-preview-modal" onClick={() => setShowPreview(false)}>
            <div className="announcement-preview-content" onClick={e => e.stopPropagation()}>
              <div className="announcement-preview-header">
                <h3>Announcement Preview</h3>
                <button className="announcement-close-preview" onClick={() => setShowPreview(false)}>×</button>
              </div>
              
              <div className="announcement-preview-body">
                <div className="announcement-preview-date">
                  {new Date().toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>

                <h2 className="announcement-preview-title">{title || "Untitled Announcement"}</h2>
                
                <div className="announcement-preview-audience">
                  {audience === "ALL" ? (
                    <span className="announcement-audience-badge all"><MdPublic /> All Users</span>
                  ) : (
                    <>
                      <span className="announcement-audience-label">Target Audience:</span>
                      {selectedFaculties.length > 0 && (
                        <span className="announcement-audience-badge">Faculties: {selectedFaculties.length}</span>
                      )}
                      {selectedBatchYears.length > 0 && (
                        <span className="announcement-audience-badge">Batches: {selectedBatchYears.length}</span>
                      )}
                      {selectedDepartments.length > 0 && (
                        <span className="announcement-audience-badge">Departments: {selectedDepartments.length}</span>
                      )}
                    </>
                  )}
                </div>

                {/* Preview Filters (show selected groups) */}
                {(selectedFaculties.length > 0 || selectedBatchYears.length > 0 || selectedDepartments.length > 0) && (
                  <div className="announcement-preview-filters">
                    <h4>Selected Groups:</h4>
                    {selectedFaculties.length > 0 && (
                      <div className="announcement-preview-filter-group">
                        <strong>Faculties:</strong>
                        <div className="announcement-preview-filter-tags">
                          {selectedFaculties.map(fId => {
                            const faculty = facultiesData.find(f => f.faculty_id === fId);
                            return <span key={fId} className="announcement-preview-filter-tag">{faculty?.faculty_name}</span>;
                          })}
                        </div>
                      </div>
                    )}
                    {selectedBatchYears.length > 0 && (
                      <div className="announcement-preview-filter-group">
                        <strong>Batch Years:</strong>
                        <div className="announcement-preview-filter-tags">
                          {selectedBatchYears.map(year => (
                            <span key={year} className="announcement-preview-filter-tag">{year}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedDepartments.length > 0 && (
                      <div className="announcement-preview-filter-group">
                        <strong>Departments:</strong>
                        <div className="announcement-preview-filter-tags">
                          {selectedDepartments.map(dId => {
                            const dept = dummyDepartments.find(d => d.id === dId);
                            return <span key={dId} className="announcement-preview-filter-tag">{dept?.name}</span>;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div 
                  className="announcement-preview-content-html"
                  dangerouslySetInnerHTML={{ __html: content }} 
                />

                {attachments.length > 0 && (
                  <div className="announcement-preview-attachments">
                    <h4><MdAttachFile /> Attachments ({attachments.length})</h4>
                    <div className="announcement-preview-attachment-list">
                      {attachments.map((file, idx) => (
                        <div key={idx} className="announcement-preview-attachment">
                          <span className="announcement-attachment-icon"><MdDescription /></span>
                          <span className="announcement-attachment-name">{file.name}</span>
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
