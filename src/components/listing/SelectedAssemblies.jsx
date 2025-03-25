import React, { useEffect, useState, useRef } from "react";
import styles from "./SelectedAssemblies.module.css";

const SelectedAssemblies = ({ assemblies = [], onScroll, onHighlight, onExpand }) => {
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const scrollRef = useRef(null);
  const lastScrollPosition = useRef(0);

  const handleItemClick = (assembly, index) => {
    setHighlightedIndex(index);
    onHighlight(assembly);
    onExpand(assembly);
  };

  const handleScroll = (event) => {
    lastScrollPosition.current = event.target.scrollTop;
    onScroll(event);
  };

  if (!assemblies || assemblies.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>No assemblies available</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div ref={scrollRef} className={styles.scrollableList} onScroll={handleScroll}>
        {assemblies.map((assembly, index) => {
          // Safely access nested properties
          const locationName = assembly?.location?.name || "Unknown Location";
          const timestamp = assembly?.timestamp ? new Date(assembly.timestamp).toLocaleDateString() : "No date";
          const pixelCount = Array.isArray(assembly?.pixels) ? assembly.pixels.length : 0;
          const assemblyName = assembly?.name || `Assembly ${index + 1}`;
          const isHighlighted = index === highlightedIndex;

          return (
            <div
              key={assembly?.id || index}
              className={`${styles.listItem} ${isHighlighted ? styles.highlighted : ""}`}
              onClick={() => handleItemClick(assembly, index)}
            >
              <div className={styles.itemInfo}>
                <div className={styles.itemName}>{assemblyName}</div>
                <div className={styles.itemLocation}>{locationName}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SelectedAssemblies;
