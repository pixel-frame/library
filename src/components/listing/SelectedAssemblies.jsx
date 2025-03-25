import React, { useEffect, useState, useRef } from "react";
import styles from "./SelectedAssemblies.module.css";

const SelectedAssemblies = ({ assemblies = [], onScroll, onHighlight, onExpand }) => {
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const scrollRef = useRef(null);
  const lastScrollPosition = useRef(0);

  // Update highlighting based on scroll position
  useEffect(() => {
    if (!scrollRef.current || !onHighlight) return;

    const handleVisibilityCheck = () => {
      const container = scrollRef.current;
      const items = container.querySelectorAll(`.${styles.listItem}`);
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 2;

      let closestItem = null;
      let minDistance = Infinity;

      items.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        const itemCenter = rect.top + rect.height / 2;
        const distance = Math.abs(containerCenter - itemCenter);

        if (distance < minDistance) {
          minDistance = distance;
          closestItem = index;
        }
      });

      setHighlightedIndex(closestItem);

      if (closestItem !== null && assemblies[closestItem]) {
        onHighlight(assemblies[closestItem]);
      }
    };

    const scrollContainer = scrollRef.current;
    const debouncedCheck = debounce(handleVisibilityCheck, 100);

    scrollContainer.addEventListener("scroll", debouncedCheck);
    handleVisibilityCheck();

    return () => {
      scrollContainer.removeEventListener("scroll", debouncedCheck);
    };
  }, [assemblies, onHighlight]);

  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
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
            >
              <div className={styles.itemInfo}>
                <div className={styles.itemName}>{assemblyName}</div>
                <div className={styles.itemLocation}>{locationName}</div>
              </div>
              {isHighlighted && (
                <button
                  className={styles.expandButton}
                  onClick={() => onExpand(assembly)}
                  aria-label="Expand assembly details"
                >
                  Expand
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SelectedAssemblies;
