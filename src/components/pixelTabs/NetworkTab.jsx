import React from "react";
import styles from "./NetworkTab.module.css";

const NetworkTab = () => {
  return (
    <div className={styles.networkTabContainer}>
      <h2>Network</h2>
      <div className={styles.networkContent}>{/* Network tab content will go here */}</div>
    </div>
  );
};

export default NetworkTab;
