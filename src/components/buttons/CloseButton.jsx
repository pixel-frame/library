import React from "react";
import styles from "./CloseButton.module.css";

const CloseButton = ({ onClick, ariaLabel = "Close" }) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      onClick();
    }
  };

  return (
    <button
      className={styles.closeButton}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      tabIndex="0"
      type="button"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" className={styles.icon}>
        <line x1="1" y1="1" x2="11" y2="11" strokeWidth="2" stroke="currentColor" />
        <line x1="1" y1="11" x2="11" y2="1" strokeWidth="2" stroke="currentColor" />
      </svg>
    </button>
  );
};

export default CloseButton;
