import React from "react";
import styles from "./PageHeader.module.css";

const PageHeader = ({ title, viewToggle, className }) => {
  return (
    <div className={`${styles.titleContainer} ${className || ""}`}>
      <span className={styles.title}>{title}</span>
      {viewToggle && <div className={styles.viewToggle}>{viewToggle}</div>}
    </div>
  );
};

export default PageHeader;
