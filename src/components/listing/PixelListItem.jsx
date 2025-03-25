import React from "react";
import { Link } from "react-router-dom";
import styles from "./Pixels.module.css";

const PixelListItem = ({ pixel, index, isSelected, viewMode, onItemClick }) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") onItemClick(index);
  };

  const selectionClass = isSelected ? styles.selected : "";

  return (
    <div
      className={`${styles.listItem} ${selectionClass}`}
      onClick={() => onItemClick(index)}
      onKeyDown={handleKeyDown}
      tabIndex="0"
      aria-label={`Pixel ${pixel.number}, ${pixel.state_description}`}
      style={{ transition: "none" }}
    >
      {viewMode === "grid" && (
        <div className={styles.pixelPreview}>
          <img 
            src={`data/previews/pixels/model-poster-${pixel.number}.png`}
            alt={`Preview of Pixel ${pixel.number}`}
            className={styles.previewImage}
            onError={(e) => {
              e.target.src = 'data/previews/pixels/model-poster-46.png';
              e.target.classList.add(styles.previewFallback);
            }}
          />
        </div>
      )}
      <div className={styles.itemInfo}>
        <div className={styles.itemNumber}>PIXEL {pixel.number}</div>
        <div className={styles.itemGeneration}>GEN {pixel.generation}</div>
        <div className={styles.itemState}>{pixel.state_description}</div>
      </div>
    </div>
  );
};

export default PixelListItem;
