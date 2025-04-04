import React, { useState } from "react";
import SparkLine from "../datavis/SparkLine";
import styles from "./DetailGrid.module.css";

const DetailGrid = ({ items }) => {
  const [activeInfo, setActiveInfo] = useState(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

  const handleInfoClick = (event, index) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = Math.min(
      rect.left,
      window.innerWidth - 300 // 300px is modal max-width
    );
    const y = Math.min(
      rect.bottom + 8, // 8px offset from button
      window.innerHeight - 100 // rough estimate for modal height
    );

    setModalPosition({ x, y });
    setActiveInfo(index);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleInfoClick(e, index);
    }
  };

  return (
    <div className={styles.grid}>
      {items.map((item, index) => (
        <div
          key={index}
          className={`${styles.gridItem} ${item.fullSpan ? styles.notes : ""} ${item.isGlobe ? styles.globeItem : ""} ${
            item.isSparkline ? styles.sparklineItem : ""
          }`}
          onClick={(e) => item.info && handleInfoClick(e, index)}
          onKeyDown={(e) => item.info && handleKeyDown(e, index)}
          tabIndex={item.info ? "0" : undefined}
          role={item.info ? "button" : undefined}
          aria-label={item.info ? `Information about ${item.title}` : undefined}
        >
          <div className={styles.titleRow}>
            <span className={styles.title}>{item.title}</span>
            {item.info && (
              <div className={styles.infoButton} aria-hidden="true" tabIndex="-1">
                i
              </div>
            )}
          </div>
          <div className={styles.content}>
            <div className={styles.value}>
              {item.isSparkline ? (
                <SparkLine data={item.sparklineData} color="var(--text-primary)" height={24} width={120} />
              ) : item.title === "Status" ? (
                <div className={styles.statusContainer}>
                  <div className={`${styles.statusIndicator} ${styles[item.value.toLowerCase()]}`} />
                  {item.value}
                </div>
              ) : (
                item.value
              )}
            </div>
          </div>
        </div>
      ))}
      {activeInfo !== null && items[activeInfo]?.info && (
        <div
          className={styles.modalOverlay}
          onClick={() => setActiveInfo(null)}
          role="dialog"
          aria-label="Information details"
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            style={{
              left: `${modalPosition.x}px`,
              top: `${modalPosition.y}px`,
            }}
          >
            {items[activeInfo].info}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailGrid;
