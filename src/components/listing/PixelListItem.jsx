import React from "react";
import { Link } from "react-router-dom";
import styles from "./Pixels.module.css";
import PixelModel from "../models/PixelModel";

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
          <div className={styles.modelPlaceholder}>App cannot handle model load</div>
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
