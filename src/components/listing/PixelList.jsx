import React, { useEffect } from "react";
import styles from "./Pixels.module.css";
import PixelListItem from "./PixelListItem";

const PixelList = ({ pixels, selectedIndex, viewMode, onItemClick }) => {
  useEffect(() => {
    if (pixels.length === 0) return;

    const selectedElement = document.querySelector(`.${styles.selected}`);
    if (selectedElement) {
      if (viewMode === "horizontal") {
        selectedElement.scrollIntoView({ behavior: "smooth", inline: "center" });
      } else if (viewMode === "vertical" || viewMode === "grid") {
        selectedElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedIndex, viewMode, pixels.length]);

  useEffect(() => {
    if (pixels.length === 0 || viewMode === "grid") return;

    let lastWheelTime = Date.now();
    const wheelThreshold = 100;

    const handleWheel = (event) => {
      const now = Date.now();
      if (now - lastWheelTime < wheelThreshold) return;

      const delta = Math.sign(viewMode === "horizontal" ? event.deltaX : event.deltaY);

      if (delta !== 0) {
        const newIndex = delta > 0 ? Math.min(selectedIndex + 1, pixels.length - 1) : Math.max(selectedIndex - 1, 0);

        if (newIndex !== selectedIndex) {
          onItemClick(newIndex);
        }
      }

      lastWheelTime = now;
    };

    const listElement = document.querySelector(`.${styles.scrollableList}`);
    listElement?.addEventListener("wheel", handleWheel);

    return () => {
      listElement?.removeEventListener("wheel", handleWheel);
    };
  }, [pixels.length, viewMode, selectedIndex, onItemClick]);

  return (
    <div className={`${styles.scrollableList} ${styles[viewMode]}`}>
      {pixels.map((pixel, index) => (
        <PixelListItem
          key={pixel.id}
          pixel={pixel}
          index={index}
          isSelected={selectedIndex === index}
          viewMode={viewMode}
          onItemClick={onItemClick}
        />
      ))}
    </div>
  );
};

export default PixelList;
