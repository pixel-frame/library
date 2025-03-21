import React, { useState, useEffect } from "react";
import PixelModel from "./PixelModel";
import styles from "./PixelModelTransition.module.css";

const PixelModelTransition = ({
  currentSerial,
  previousSerial,
  direction,
  viewMode,
  pixelNumber,
  isScrolling,
  targetPixel,
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showPrevious, setShowPrevious] = useState(false);
  const [displayedPixel, setDisplayedPixel] = useState(currentSerial);
  const [pendingPixel, setPendingPixel] = useState(null);

  // Determine the animation direction based on viewMode and direction
  const getAnimationDirection = () => {
    if (viewMode === "horizontal") {
      return direction === "Left" ? "Left" : "Right";
    } else {
      return direction === "Left" ? "Up" : "Down"; // In vertical mode, "Left" means going down
    }
  };

  const animationDirection = getAnimationDirection();

  // Store the target pixel when scrolling
  useEffect(() => {
    if (isScrolling && targetPixel) {
      setPendingPixel(targetPixel);
    }
  }, [isScrolling, targetPixel]);

  // Handle transition when scrolling stops
  useEffect(() => {
    // Only trigger transition when scrolling stops and we have a pending pixel
    if (!isScrolling && pendingPixel && pendingPixel !== displayedPixel) {
      setShowPrevious(true);
      setIsTransitioning(true);

      // After animation completes, hide the previous model
      const timer = setTimeout(() => {
        setShowPrevious(false);
        setIsTransitioning(false);
        setDisplayedPixel(pendingPixel);
        setPendingPixel(null);
      }, 500); // Match with CSS animation duration

      return () => clearTimeout(timer);
    }
  }, [isScrolling, pendingPixel, displayedPixel]);

  // Update displayed pixel when current serial changes without animation
  useEffect(() => {
    if (!previousSerial) {
      setDisplayedPixel(currentSerial);
    }
  }, [currentSerial, previousSerial]);

  return (
    <div className={styles.transitionContainer}>
      {showPrevious && (
        <div className={`${styles.modelSlide} ${styles.slideOut} ${styles[`slideOut${animationDirection}`]}`}>
          <PixelModel modelPath={displayedPixel} isPreview={true} />
          <div className={styles.pixelOverlay}>
            <button className={styles.expandButton}>[+]</button>
            <div className={styles.pixelLabel}>[PIXEL {displayedPixel}]</div>
          </div>
        </div>
      )}

      <div
        className={`${styles.modelSlide} ${isTransitioning ? styles.slideIn : ""} ${
          isTransitioning ? styles[`slideIn${animationDirection}`] : ""
        }`}
      >
        <PixelModel modelPath={isTransitioning ? pendingPixel : displayedPixel} isPreview={true} />
        <div className={styles.pixelOverlay}>
          <button className={styles.expandButton}>[+]</button>
          <div className={styles.pixelLabel}>[PIXEL {isTransitioning ? pendingPixel : displayedPixel}]</div>
        </div>
      </div>
    </div>
  );
};

export default PixelModelTransition;
