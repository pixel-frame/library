import React from "react";
import styles from "./Pixels.module.css";

const ViewModeToggle = ({ viewMode, onViewModeChange }) => {
  const getToggleIcon = () => {
    if (viewMode === "vertical") return "→";
    if (viewMode === "horizontal") return "□";
    return "↓";
  };

  return (
    <button
      className={styles.viewToggleBtn}
      onClick={onViewModeChange}
      aria-label={`Current view: ${viewMode}. Click to change view mode`}
      tabIndex="0"
    >
      {getToggleIcon()}
    </button>
  );
};

export default ViewModeToggle;
