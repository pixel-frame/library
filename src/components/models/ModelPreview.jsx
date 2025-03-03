import React, { useState } from "react";
import "./ModelPreview.css";

const ModelPreview = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpandClick = () => {
    setIsExpanded(true);
    document.body.style.overflow = "hidden";
  };

  const handleCloseExpanded = () => {
    setIsExpanded(false);
    document.body.style.overflow = "auto";
  };

  const childWithPreviewState = React.cloneElement(children, {
    isPreview: !isExpanded,
  });

  return (
    <>
      <div className="preview-container">
        <div className="preview-content">{React.cloneElement(children, { isPreview: true })}</div>
        <button className="expand-button" onClick={handleExpandClick} aria-label="Expand model view" tabIndex="0">
          <span className="expand-icon">⤢</span>
          EXPAND
        </button>
      </div>

      {isExpanded && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="close-button"
              onClick={handleCloseExpanded}
              aria-label="Close expanded view"
              tabIndex="0"
            >
              ×
            </button>
            {React.cloneElement(children, { isPreview: false })}
          </div>
        </div>
      )}
    </>
  );
};

export default ModelPreview;
