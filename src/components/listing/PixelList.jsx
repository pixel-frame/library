import React from "react";
import styles from "./Pixels.module.css";
import PixelListItem from "./PixelListItem";

const PixelList = ({ pixels, selectedIndex, onItemClick }) => {
  if (!pixels || pixels.length === 0) {
    return <div className={styles.noPixels}>NO PIXELS FOUND</div>;
  }

  return (
    <div className={`${styles.scrollableList} ${styles.grid}`}>
      {pixels.map((pixel, index) => (
        <PixelListItem
          key={pixel.id}
          pixel={pixel}
          index={index}
          isSelected={selectedIndex === index}
          viewMode="grid"
          onItemClick={onItemClick}
        />
      ))}
    </div>
  );
};

export default PixelList;
