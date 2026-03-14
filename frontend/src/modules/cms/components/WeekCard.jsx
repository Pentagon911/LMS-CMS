import React, { useState } from "react";
import AddContentModal from "./AddContentModal.jsx";

const WeekCard = ({ data, isLecturer }) => {

  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [contents, setContents] = useState(data.contents);

  const toggleWeek = () => { setExpanded(!expanded); };
  const addContent = () => { setShowModal(true); };
  const closeModal = () => { setShowModal(false); };

  const removeContent = (indexToRemove) => {
    alert("Remove content at index: " + indexToRemove);
    const updatedContents = contents.filter(
        (item, index) => index !== indexToRemove );
    setContents(updatedContents);
  };

  return (
    <div className="week-container">

      <div className="week-header">
        <h2>{data.week}</h2>

        <div className="buttons">
          {isLecturer && (
              <button onClick={addContent}>Add</button>
          )}

          <button onClick={toggleWeek}>
            {expanded ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="content-list">
          {contents.map((item, index) => (
              <div key={index} className="content-card">
                <span>
                  {item.title} ({item.type})
                </span>
                {isLecturer && (
                  <button
                    className="content-remove"
                    onClick={() => removeContent(index)}
                  >Remove</button>)}
            </div>
            ))}
        </div>
      )}
      {showModal && <AddContentModal closeModal={closeModal} />}
    </div>
  );
};

export default WeekCard;
