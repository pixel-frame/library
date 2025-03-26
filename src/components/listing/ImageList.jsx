import React, { useEffect, useState } from "react";
import ImageWheel from "./ImageWheel";
import styles from "./ImageWheel.module.css";
import { useSelection } from "../../context/SelectionContext";

const ImageList = () => {
  const { selectedIndex } = useSelection();
  const [currentImages, setCurrentImages] = useState([]);

  useEffect(() => {
    // Create images based on the selected index
    // For example, if we have 6 images per model and 140 models total
    const modelIndex = selectedIndex || 0;

    // Generate images for the current model
    const images = Array.from({ length: 6 }, (_, i) => ({
      src: `/data/previews/pixels/model-poster-${(modelIndex % 24) + 1}-${i + 1}.png`,
      alt: `Model ${modelIndex + 1} - Image ${i + 1}`,
    }));

    setCurrentImages(images);
  }, [selectedIndex]);

  return (
    <div className={styles.wheelContainer}>
      <div className={styles.smallWheelWrapper}>
        <ImageWheel images={currentImages} />
      </div>
    </div>
  );
};

export default ImageList;
