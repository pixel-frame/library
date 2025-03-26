import React from "react";
import ImageWheel from "./ImageWheel";
import styles from "./ImageWheel.module.css";

const ImageList = ({ selectedPixelIndex }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const generateModelImage = (i) => (
    <img
      src={`/data/previews/pixels/model-poster-1.png`}
      alt={`Model ${i}`}
      className={styles.modelImage}
      onError={(e) => {
        e.target.style.display = "none";
      }}
    />
  );

  const handleIndexChange = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className={styles.wheelContainer}>
      <div className={styles.smallWheelWrapper}>
        <ImageWheel
          loop
          length={140}
          width="100%"
          perspective="left"
          setValue={(i) => generateModelImage(i + 1)}
          onIndexChange={handleIndexChange}
          currentIndex={selectedPixelIndex}
        />
      </div>
    </div>
  );
};

export default ImageList;
