import React, { useState, useEffect } from "react";
import PixelModel from "./PixelModel";
import styles from "./PixelModelTransition.module.css";

const PixelModelTransition = ({ currentSerial, previousSerial, direction, viewMode, pixelNumber }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showPrevious, setShowPrevious] = useState(false);

  // Determine the animation direction based on viewMode and direction
  const getAnimationDirection = () => {
    if (viewMode === "horizontal") {
      return direction === "Left" ? "Left" : "Right";
    } else {
      return direction === "Left" ? "Down" : "Up"; // In vertical mode, "Left" means going down
    }
  };

  const animationDirection = getAnimationDirection();

  useEffect(() => {
    if (previousSerial) {
      setShowPrevious(true);
      setIsTransitioning(true);

      // After animation completes, hide the previous model
      const timer = setTimeout(() => {
        setShowPrevious(false);
        setIsTransitioning(false);
      }, 500); // Match with CSS animation duration

      return () => clearTimeout(timer);
    }
    console.log(currentSerial);
    console.log(previousSerial);
  }, [currentSerial, previousSerial]);

  return (
    <div className={styles.transitionContainer}>
      {showPrevious && (
        <div className={`${styles.modelSlide} ${styles.slideOut} ${styles[`slideOut${animationDirection}`]}`}>
          <PixelModel modelPath={previousSerial} isPreview={true} />
          <div className={styles.pixelOverlay}>
            <button className={styles.expandButton}>[+]</button>
            <div className={styles.pixelLabel}>[PIXEL {pixelNumber}]</div>
          </div>
        </div>
      )}

      <div
        className={`${styles.modelSlide} ${styles.slideIn} ${
          isTransitioning ? styles[`slideIn${animationDirection}`] : ""
        }`}
      >
        <PixelModel modelPath={currentSerial} isPreview={true} />
        <div className={styles.pixelOverlay}>
          <button className={styles.expandButton}>[+]</button>
          <div className={styles.pixelLabel}>[PIXEL {pixelNumber}]</div>
        </div>
      </div>
    </div>
  );
};

export default PixelModelTransition;
