import React, { useState } from "react";

const AddContentModal = ({ closeModal, addContent }) => {
  const [type, setType] = useState("content"); // Content / Quiz / Assessment
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState("video");

  // Store file or link
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    let contentData = { title: topic, type: contentType };

    if (contentType === "link") {
      if (!link) {
        alert("Please enter a link");
        return;
      }
      contentData.url = link; // save link
    } else {
      if (!file) {
        alert("Please select a file");
        return;
      }
      contentData.fileName = file.name; // just store file name for now
      contentData.fileObject = file; // store file object if needed
    }

    addContent(contentData); // Add to parent WeekCard
    closeModal();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Add Item</h3>

        {/* Radio: Content / Quiz / Assessment */}
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="itemType"
              value="content"
              checked={type === "content"}
              onChange={(e) => setType(e.target.value)}
            /> Content
          </label>
          <label>
            <input type="radio" name="itemType" value="quiz" disabled /> Quiz
          </label>
          <label>
            <input type="radio" name="itemType" value="assessment" disabled /> Assessment
          </label>
        </div>

        {type === "content" && (
          <form onSubmit={handleSubmit}>
            <label>Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter topic"
              required
            />

            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="contentType"
                  value="video"
                  checked={contentType === "video"}
                  onChange={(e) => setContentType(e.target.value)}
                /> Video
              </label>
              <label>
                <input
                  type="radio"
                  name="contentType"
                  value="document"
                  checked={contentType === "document"}
                  onChange={(e) => setContentType(e.target.value)}
                /> Document
              </label>
              <label>
                <input
                  type="radio"
                  name="contentType"
                  value="link"
                  checked={contentType === "link"}
                  onChange={(e) => setContentType(e.target.value)}
                /> Link
              </label>
            </div>

            {/* Conditional input based on content type */}
            {contentType === "link" ? (
              <input
                type="text"
                placeholder="Enter URL"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                required
              />
            ) : (
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                required
              />
            )}

            <div className="modal-buttons">
              <button type="submit" className="btn-add">Add</button>
              <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddContentModal;
