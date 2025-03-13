import React from "react";
import styles from "./ExpandButton.module.css";

const ExpandButton = ({ onClick }) => {
  return (
    <button className={styles["expand-button"]} onClick={onClick} aria-label="Expand model view" tabIndex="0">
      [
      <svg
        width="12"
        height="11"
        viewBox="0 0 12 11"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="expand-icon"
      >
        <path d="M9.5 2L1.5 10" stroke="currentColor" stroke-width="2" />
        <path d="M2.5 1H10.5V9" stroke="currentColor" stroke-width="2" />
      </svg>
      EXPAND ]
    </button>
  );
};

export default ExpandButton;
