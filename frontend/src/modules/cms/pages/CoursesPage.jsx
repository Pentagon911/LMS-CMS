import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ModuleCard from "../components/ModuleCard";
import request from "../../../utils/requestMethods.jsx";
import "./CoursesPage.css";
import { MdAttachFile, MdCampaign, MdDescription } from "react-icons/md";

// Announcement Card component
const AnnouncementCard = ({ announcement }) => {
  const [expanded, setExpanded] = useState(false);
  
const formatDate = (dateString) => {
  const date = new Date(dateString);

  // Format date & time
  return date.toLocaleString('en-US', { 
    month: 'short',   // "Mar"
    day: 'numeric',   // "23"
    year: 'numeric',  // "2026"
    hour: '2-digit',  // "06 PM"
    minute: '2-digit',
    second: '2-digit',
    hour12: true      // 12-hour format, change to false for 24-hour
  });
};
    // Function to strip HTML tags for preview
  const getPlainTextPreview = (html, maxLength = 100) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className={`announcement-card ${expanded ? 'expanded' : ''}`}>
      <div className="announcement-header" onClick={() => setExpanded(!expanded)}>
        <div className="announcement-title-section">
          <span className="announcement-badge">< MdCampaign /></span>
          <h3 className="announcement-title">{announcement.title}</h3>
        </div>
        <span className="announcement-time">{formatDate(announcement.created_at)}</span>
      </div>
      
      
      {/* Content with HTML rendering */}
      <div 
        className="announcement-content"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <div dangerouslySetInnerHTML={{ __html: announcement.content }} />
        ) : (
          <div dangerouslySetInnerHTML={{ 
            __html: getPlainTextPreview(announcement.content, 150) 
          }} />
        )}
      </div>
      
      {/* Attachments */}
      {expanded && announcement.attachments?.length > 0 && (
        <div className="announcement-attachments">
          <span className="attachments-label"><MdAttachFile /> Attachments:</span>
          <div className="attachments-list">
            {announcement.attachments.map((att, idx) => (
              <a 
                key={idx} 
                href={att.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="attachment-link"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="attachment-icon"><MdDescription /></span>
                {att.fileName}
                {att.fileSize && (
                  <span className="file-size">({(att.fileSize / 1024).toFixed(0)} KB)</span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
      
      <div className="announcement-footer">
        <span className="posted-by">Posted by {announcement.created_by_name}</span>
        <button className="read-more-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Read more'}
        </button>
      </div>
    </div>
  );
};

// Announcements list component
const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

useEffect(() => {
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await request.GET('/cms/announcements/'); 
      setAnnouncements(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.error("Failed to load announcements", err);
      setError(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  fetchAnnouncements();
}, []);

  if (loading) {
    return (
      <div className="announcements-loading">
        <p>Loading announcements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="announcements-loading error">
        <p>Error loading announcements: {error}</p>
      </div>
    );
  }

  return (
    <div className="announcements-container">
      <div className="announcements-header">
        <h2 className="announcements-title"><MdCampaign /> Announcements</h2>
        <span className="announcements-count">{announcements.length} total</span>
      </div>
      
      {announcements.length === 0 ? (
        <p className="no-announcements">No announcements yet.</p>
      ) : (
        <div className="announcements-list">
          {announcements.map((announcement, idx) => (
            <AnnouncementCard 
              key={announcement.id || idx} 
              announcement={announcement} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CoursesPage = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  const scrollRef = useRef(null);
  const navigate = useNavigate();

// Fetch modules using request method
  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        
        const data = await request.GET('/cms/courses/'); 
        console.log(data);
        setModules(data);
        setError('');
        setTimeout(checkScrollButtons, 100);
      } catch (err) {
        console.error("Failed to load modules", err);
        setError(err.message || 'Failed to load modules');
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
    window.addEventListener("resize", checkScrollButtons);
    return () => window.removeEventListener("resize", checkScrollButtons);
  }, []);

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const hasScroll = scrollRef.current.scrollWidth > scrollRef.current.clientWidth;
      setShowScrollButtons(hasScroll);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const cardWidth = 220;
      const scrollAmount = direction === "left" ? -cardWidth * 2 : cardWidth * 2;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleCardClick = (moduleId) => {
    navigate(`/cms/course-content/${moduleId}`);
  };

  if (loading) {
    return (
      <div className="courses-page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your modules...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="courses-page-container">
        <div className="error-container">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-page-container">
      <div className="courses-header">
        <h1 className="courses-title">Available Modules</h1>
        <p className="courses-subtitle">
          {modules.length} {modules.length === 1 ? "module" : "modules"} available
        </p>
      </div>

      <div className="carousel-container">
        {showScrollButtons && (
          <button className="scroll-button scroll-left" onClick={() => scroll("left")}>
            ←
          </button>
        )}

        <div className="modules-carousel" ref={scrollRef} onScroll={checkScrollButtons}>
          {modules.map((mod, index) => (
            <div
              key={mod.id}
              className="module-card-wrapper"
              onClick={() => handleCardClick(mod.id)}
            >
              <ModuleCard code={mod.code} title={mod.title} color={mod.color} />
            </div>
          ))}
        </div>

        {showScrollButtons && (
          <button className="scroll-button scroll-right" onClick={() => scroll("right")}>
            →
          </button>
        )}
      </div>

      {/* Announcements section - vertical list */}
      <Announcements />
    </div>
  );
};

export default CoursesPage;
