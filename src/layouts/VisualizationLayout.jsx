import React from "react";
import styles from "./VisualizationLayout.module.css";
import { AnimatedText } from "../components/text/AnimatedText";

const VisualizationLayout = ({
  visualization,
  breakerLeftText,
  breakerRightText,
  listingComponent,
  isCollapsed = false,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={`${styles.visualizationContainer} ${isCollapsed ? styles.collapsed : ""}`}>{visualization}</div>

        <div className={styles.breaker}>
          <AnimatedText text={breakerLeftText} />
          <AnimatedText text={breakerRightText} />
        </div>

        <div className={`${styles.listingContainer} ${isCollapsed ? styles.expanded : ""}`}>{listingComponent}</div>
      </div>
    </div>
  );
};

export default VisualizationLayout;
