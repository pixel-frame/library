import React from "react";
import { Link } from "react-router-dom";
import styles from "./Pixels.module.css";
import PixelModelTransition from "../models/PixelModelTransition";
import { RollingText } from "../text/RollingText";
import ViewModeToggle from "./ViewModeToggle";

const PixelDetailView = ({
  selectedPixel,
  previousPixel,
  transitionDirection,
  viewMode,
  onViewModeChange,
  isScrolling,
  targetPixel,
}) => {
  if (!selectedPixel) return null;

  return (
    <div className={styles.detailSection}>
      <div className={styles.modelContainer}>
        {viewMode !== "grid" ? (
          <PixelModelTransition
            currentSerial={selectedPixel.number}
            previousSerial={previousPixel?.number || null}
            direction={transitionDirection}
            viewMode={viewMode}
            pixelNumber={selectedPixel.number}
            isScrolling={isScrolling}
            targetPixel={targetPixel?.number}
          />
        ) : (
          <div className={styles.modelPlaceholder}>App cannot handle model load</div>
        )}
      </div>

      <div className={styles.moreInfoLink}>
        <Link
          to={`/pixel/${selectedPixel.serial}`}
          className={styles.pixelDetailLink}
          aria-label={`View detailed information for Pixel ${selectedPixel.number}`}
          tabIndex="0"
        >
          <RollingText text="MORE INFORMATION →  MORE INFORMATION → MORE INFORMATION →  " />
        </Link>
      </div>
    </div>
  );
};

export default PixelDetailView;
