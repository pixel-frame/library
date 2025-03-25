import React, { useState, useCallback } from "react";
import Carbon from "../components/datavis/Carbon";
import SelectedPixels from "../components/datavis/SelectedPixels";
import PageHeader from "../components/common/PageHeader";
import styles from "./Emissions.module.css";

const Emissions = () => {
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [highlightedPoint, setHighlightedPoint] = useState(null);

  const handleScroll = useCallback((event) => {
    const scrollTop = event.target.scrollTop;
    console.log("Scrolling:", scrollTop);
    setIsListExpanded(scrollTop > 10);
  }, []);

  const handleSelectionChange = (points) => {
    setSelectedPoints(points);
  };

  return (
    <div className={styles.container}>
      <PageHeader title="Carbon Emissions" />

      <div className={styles.content}>
        <div className={`${styles.visualizationContainer} ${isListExpanded ? styles.collapsed : ""}`}>
          <Carbon
            onSelectionChange={handleSelectionChange}
            selectedPoints={selectedPoints}
            highlightedPoint={highlightedPoint}
          />
        </div>
        <div className={`${styles.listingContainer} ${isListExpanded ? styles.expanded : ""}`}>
          <SelectedPixels
            selectedPoints={selectedPoints}
            onScroll={handleScroll}
            onHighlight={(point) => setHighlightedPoint(point)}
          />
        </div>
      </div>
    </div>
  );
};

export default Emissions;
