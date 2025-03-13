import React from "react";
import "./ModelPreview.css";

const ModelPreview = ({ children, isExpanded, onClose }) => {
  const handleCloseExpanded = () => {
    onClose();
    document.body.style.overflow = "auto";
  };

  return (
    <>
      <div className="preview-container">
        <div className="preview-content">{React.cloneElement(children, { isPreview: true })}</div>
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
