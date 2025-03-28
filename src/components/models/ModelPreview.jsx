import React, { useRef, useEffect } from "react";
import "./ModelPreview.css";

const ModelPreview = ({ children, isExpanded, onClose }) => {
  const modelContainerRef = useRef(null);

  const handleCloseExpanded = () => {
    onClose(false);
    document.body.style.overflow = "auto";
  };

  const handleExpand = () => {
    if (onClose) {
      onClose(true);
      document.body.style.overflow = "hidden";
    }
  };

  // Use a single container that changes its styling based on expanded state
  return (
    <div className={`model-container ${isExpanded ? "expanded" : "preview"}`} ref={modelContainerRef}>
      {isExpanded && (
        <button className="close-button" onClick={handleCloseExpanded} aria-label="Close expanded view" tabIndex="0">
          ×
        </button>
      )}

      {/* Single instance of children that stays mounted */}
      {children}
    </div>
  );
};

export default ModelPreview;
