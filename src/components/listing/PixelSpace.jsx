import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Pixels.module.css";

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
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pixelPositions, setPixelPositions] = useState({});

  // Initialize pixel positions in a more spread out formation
  useEffect(() => {
    const totalPixels = 60;
    const newPositions = {};
    
    // Create a more spread out grid-like arrangement
    const gridSize = Math.ceil(Math.sqrt(totalPixels));
    const spacing = 300; // Larger spacing between pixels
    
    Array.from({ length: totalPixels }, (_, i) => i + 1).forEach((number) => {
      const row = Math.floor((number - 1) / gridSize);
      const col = (number - 1) % gridSize;
      
      // Add some randomness to make it feel more organic
      const randomOffset = {
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100
      };
      
      newPositions[number] = {
        x: col * spacing + randomOffset.x,
        y: row * spacing + randomOffset.y
      };
    });
    
    setPixelPositions(newPositions);
  }, []);

  // Auto-center on selected pixel when it changes
  useEffect(() => {
    if (selectedPixel && pixelPositions[selectedPixel.number] && containerRef.current) {
      const position = pixelPositions[selectedPixel.number];
      const container = containerRef.current;
      
      // Center the selected pixel by calculating the appropriate pan
      const viewportWidth = container.parentElement.offsetWidth;
      const viewportHeight = container.parentElement.offsetHeight;
      
      setPan({
        x: viewportWidth / 2 - position.x - 100, // 100 is half of pixel width
        y: viewportHeight / 2 - position.y - 100  // 100 is half of pixel height
      });
    }
  }, [selectedPixel, pixelPositions]);

  if (!selectedPixel) return null;

  const totalPixels = 60;
  
  // Mouse event handlers for panning
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newPan = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };
    setPan(newPan);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch event handlers for mobile devices
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDragging) return;
    const touch = e.touches[0];
    const newPan = {
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    };
    setPan(newPan);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className={styles.detailSection}>
      <div className={styles.modelContainer}>
        {viewMode !== "grid" ? (
          <div className={styles.pixelSpaceViewport}
               onMouseDown={handleMouseDown}
               onMouseMove={handleMouseMove}
               onMouseUp={handleMouseUp}
               onMouseLeave={handleMouseUp}
               onTouchStart={handleTouchStart}
               onTouchMove={handleTouchMove}
               onTouchEnd={handleTouchEnd}>
            <div 
              className={styles.pixelSpace} 
              ref={containerRef} 
              style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
            >
              {Array.from({ length: totalPixels }, (_, i) => i + 1).map((number) => {
                const position = pixelPositions[number] || { x: 0, y: 0 };
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
