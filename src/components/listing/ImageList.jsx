import React, { useState, useEffect, useRef } from "react";
import ImageWheel from "./ImageWheel";
import styles from "./ImageWheel.module.css";

const ImageList = ({ selectedPixelIndex }) => {
  const [currentImages, setCurrentImages] = useState([]);
  const prevIndexRef = useRef(null);

  useEffect(() => {
    console.log("ImageList received selectedPixelIndex:", selectedPixelIndex);
    console.log("ImageList previous index was:", prevIndexRef.current);

    // Only update images if the index has actually changed
    if (prevIndexRef.current !== selectedPixelIndex) {
      prevIndexRef.current = selectedPixelIndex;

      // Use the selectedPixelIndex from props if available, otherwise fall back to 0
      const modelIndex = selectedPixelIndex !== undefined ? selectedPixelIndex : 0;

      // Generate images for the current model
      const images = Array.from({ length: 6 }, (_, i) => ({
        src: `/data/previews/pixels/model-poster-1.png`,
        alt: `Model ${modelIndex + 1} - Image ${i + 1}`,
      }));

      console.log("ImageList generated images:", images);

      // Force a new array reference to trigger the useEffect in ImageWheel
      setCurrentImages([...images]);
    }
  }, [selectedPixelIndex]);

  return (
    <div className={styles.wheelContainer}>
      <div className={styles.smallWheelWrapper}>
        <ImageWheel
          images={currentImages}
          key={`image-wheel-${selectedPixelIndex}`} // Force remount on index change
        />
      </div>
    </div>
  );
};

export default ImageList;
