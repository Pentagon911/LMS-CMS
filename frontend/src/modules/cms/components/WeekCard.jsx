import { useState } from "react";
import AddContentModal from "./AddContentModal.jsx";
import {MdDescription,MdQuiz,MdCampaign,MdFolder,MdAttachFile,MdLink,MdAccessTime,MdAssignment,MdCalendarToday,MdClose,MdAdd,MdExpandMore,MdChevronRight} from "react-icons/md";
import "./WeekCard.css";

const WeekCard = ({ data, isLecturer, onContentClick }) => {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState(data.items || []);

  const toggleWeek = () => setExpanded(!expanded);
  
  const addContent = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const handleAddContent = (newContent) => {
    setItems([...items, newContent]);
    closeModal();
  };

  const removeContent = (indexToRemove) => {
    if (window.confirm("Are you sure you want to remove this item?")) {
      const updatedItems = items.filter((_, index) => index !== indexToRemove);
      setItems(updatedItems);
    }
  };

  const handleItemClick = (item) => {
    if (onContentClick) {
      onContentClick(item);
    }
  };

  // Get icon based on content type (removed assignment)
  const getTypeIcon = (type) => {
    switch(type) {
      case 'content': return <MdDescription />;
      case 'quiz': return <MdQuiz />;
      case 'announcement': return <MdCampaign />;
      default: return <MdFolder />;
    }
  };

  // Get color based on content type (removed assignment)
  const getTypeColor = (type) => {
    switch(type) {
      case 'content': return '#3498db';      // Blue
      case 'quiz': return '#e74c3c';          // Red
      case 'announcement': return '#27ae60';  // Green
      default: return '#95a5a6';               // Gray
    }
  };

  // Format file size (if available)
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Render content item
  const renderContentItem = (item, index) => {
    const typeColor = getTypeColor(item.type);
    const typeIcon = getTypeIcon(item.type);

    return (
      <div 
        key={index} 
        className="content-card"
        style={{ borderLeftColor: typeColor }}
        onClick={() => handleItemClick(item)}
      >
        <div className="content-icon" style={{ backgroundColor: typeColor + '20', color: typeColor }}>
          {typeIcon}
        </div>
        
        <div className="content-details">
          <div className="content-title">
            {item.title}
            <span className="content-type-badge" style={{ backgroundColor: typeColor + '20', color: typeColor }}>
              {item.type}
            </span>
          </div>
          
          {/* Render different metadata based on type (removed assignment) */}
          <div className="content-meta">
            {item.type === 'content' && (
              <>
                <span className="meta-item"><MdAttachFile /> {item.format || 'File'}</span>
                {item.fileSize && <span className="meta-item">{formatFileSize(item.fileSize)}</span>}
                {item.fileUrl && <span className="meta-item"><MdLink /> View</span>}
              </>
            )}

            {item.type === 'quiz' && (
              <>
                <span className="meta-item"><MdAccessTime /> {item.duration || '15 min'}</span>
                {item.questionsCount && <span className="meta-item">{item.questionsCount} questions</span>}
                <span className="meta-item"><MdAssignment /> {item.quizId ? 'Available' : 'No ID'}</span>
              </>
            )}

            {item.type === 'announcement' && (
              <>
                <span className="meta-item"><MdCalendarToday /> {item.date || new Date().toLocaleDateString()}</span>
                {item.message && (
                  <span className="meta-item">
                    {item.message.length > 30 ? item.message.substring(0, 30) + '...' : item.message}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Preview for announcements */}
          {item.type === 'announcement' && item.message && (
            <div className="announcement-preview">
              {item.message.length > 100 ? item.message.substring(0, 100) + '...' : item.message}
            </div>
          )}
        </div>

        {isLecturer && (
          <button
            className="content-remove"
            onClick={(e) => {
              e.stopPropagation();
              removeContent(index);
            }}
            title="Remove item"
          >
            <MdClose size={20} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`week-container ${expanded ? 'expanded' : ''}`}>
      {/* Week Header */}
      <div className="week-header" onClick={toggleWeek}>
        <div className="week-title">
          <span className="week-number">{data.week}</span>
          <span className="item-count">{items.length} items</span>
        </div>
        
        <div className="week-actions">
          {isLecturer && (
            <button 
              className="add-btn"
              onClick={(e) => {
                e.stopPropagation();
                addContent();
              }}
              title="Add content"
            >
              <MdAdd />
            </button>
          )}
          
          <button className="expand-btn">
            {expanded ? <MdExpandMore />:<MdChevronRight />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="week-content">
          {items.length === 0 ? (
            <div className="empty-state">
              <p>No items in this week yet.</p>
              {isLecturer && (
                <button className="add-first-btn" onClick={addContent}>
                  + Add First Item
                </button>
              )}
            </div>
          ) : (
            <div className="content-grid">
              {items.map((item, index) => renderContentItem(item, index))}
            </div>
          )}
        </div>
      )}

      {/* Add Content Modal */}
      {showModal && (
        <AddContentModal 
          closeModal={closeModal} 
          onAdd={handleAddContent}
          weekNumber={data.week}
        />
      )}
    </div>
  );
};

export default WeekCard;
