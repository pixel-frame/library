import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styles from "./Pixels.module.css";
import PixelModelTransition from "../models/PixelModelTransition";
import { RollingText } from "../text/RollingText";
import ViewModeToggle from "./ViewModeToggle";

const PixelSpaceView = ({
  selectedPixel,
  previousPixel,
  transitionDirection,
  viewMode,
  onViewModeChange,
  isScrolling,
  targetPixel,
}) => {
  const containerRef = useRef(null);
  const selectedPixelRef = useRef(null);

  useEffect(() => {
    if (selectedPixelRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = selectedPixelRef.current;
      
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const offsetX = -elementRect.left + (containerRect.width / 2) - (elementRect.width / 2);
      const offsetY = -elementRect.top + (containerRect.height / 2) - (elementRect.height / 2);
      
      container.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }
  }, [selectedPixel]);

  if (!selectedPixel) return null;

  const totalPixels = 60;
  
  const getRandomPosition = () => {
    const PIXEL_WIDTH = 200; // Width of each pixel preview
    const PADDING = 20; // Padding from container edges
    
    return {
      x: PADDING + Math.random() * (window.innerWidth - PIXEL_WIDTH - PADDING * 2),
      y: PADDING + Math.random() * (window.innerHeight - PIXEL_WIDTH - PADDING * 2)
    };
  };

  return (
    <div className={styles.detailSection}>
      <div className={styles.modelContainer}>
        {viewMode !== "grid" ? (
          <div className={styles.pixelSpaceViewport}>
            <div className={styles.pixelSpace} ref={containerRef}>
              {Array.from({ length: totalPixels }, (_, i) => i + 1).map((number) => {
                const position = getRandomPosition();
                return (
                  <div 
                    key={number}
                    ref={number === selectedPixel.number ? selectedPixelRef : null}
                    className={`${styles.pixelPreview} ${number === selectedPixel.number ? styles.selected : ''}`}
                    style={{
                      left: `${position.x}px`,
                      top: `${position.y}px`
                    }}
                  >
                    <img
                      src={`data/previews/pixels/model-poster-${number}.png`}
                      alt={`Preview of Pixel ${number}`}
                      className={styles.previewImage}
                      onError={(e) => {
                        e.target.src = "data/previews/pixels/model-poster-46.png";
                        e.target.classList.add(styles.previewFallback);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={styles.modelPlaceholder}>App cannot handle model load</div>
        )}
      </div>

      {/* <div className={styles.moreInfoLink}>
        <Link
          to={`/pixel/${selectedPixel.serial}`}
          className={styles.pixelDetailLink}
          aria-label={`View detailed information for Pixel ${selectedPixel.number}`}
          tabIndex="0"
        >
          <RollingText text="MORE INFORMATION →  MORE INFORMATION → MORE INFORMATION →  " />
        </Link>
      </div> */}
    </div>
  );
};

export default PixelSpaceView;
