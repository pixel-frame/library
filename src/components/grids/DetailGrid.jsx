import React, { useState } from "react";
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
          className={`${styles.gridItem} ${item.fullWidth ? styles.fullWidth : ""} ${
            item.isGlobe ? styles.globeItem : ""
          }`}
        >
          <div className={styles.titleRow}>
            <span className={styles.title}>{item.title}</span>
            {item.info && (
              <button
                className={styles.infoButton}
                onClick={(e) => handleInfoClick(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                aria-label={`Information about ${item.title}`}
                tabIndex="0"
              >
                i
              </button>
            )}
          </div>
          <div className={styles.content}>
            <div className={styles.value}>{item.value}</div>
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
