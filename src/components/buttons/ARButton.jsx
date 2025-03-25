import React from "react";
import styles from "./ExpandButton.module.css";

const ARButton = ({ onClick }) => {
  return (
    <button
      className={styles["expand-button"]}
      onClick={onClick}
      aria-label="Toggle AR mode"
      tabIndex="0"
      slot="ar-button"
    >
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
      AR ]
    </button>
  );
};

export default ARButton;
