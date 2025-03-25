import React, { useEffect, useState, useRef } from "react";
import styles from "./SelectedPixels.module.css";
import SparkLine from "./SparkLine";
import Card from "../buttons/Card";
import PixelDetail from "../../pages/PixelDetail";

const SelectedPixels = ({ selectedPoints, onScroll, onHighlight }) => {
  const [allPixels, setAllPixels] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const scrollRef = useRef(null);
  const lastScrollPosition = useRef(0);
  const [selectedPixelId, setSelectedPixelId] = useState(null);

  // Fetch all pixels when component mounts
  useEffect(() => {
    const fetchPixels = async () => {
      try {
        const response = await fetch("/data/bank/pixel/pixels.json");
        const data = await response.json();
        // Process the data to ensure all required fields exist
        const processedPixels = data.pixels.map((pixel) => ({
          pixel_number: pixel.pixel_number || pixel.serial || "N/A",
          total_emissions: pixel.total_emissions || 0,
          distanceTraveled: pixel.distance_traveled || 0,
          emissions_over_time: pixel.emissions_over_time || {},
          serial: pixel.serial || pixel.pixel_number || "N/A",
        }));
        setAllPixels(processedPixels);
      } catch (error) {
        console.error("Error fetching pixels:", error);
        setAllPixels([]);
      }
    };

    fetchPixels();
  }, []);

  // Preserve scroll position when selection changes
  useEffect(() => {
    if (scrollRef.current && lastScrollPosition.current > 10) {
      scrollRef.current.scrollTop = lastScrollPosition.current;
    }
  }, [selectedPoints]);

  // Update useEffect for highlighting to include onHighlight callback
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

      // Call onHighlight with the actual pixel data
      const pixelsToShow = selectedPoints?.length > 0 ? selectedPoints : allPixels;
      if (closestItem !== null && pixelsToShow[closestItem]) {
        onHighlight(pixelsToShow[closestItem]);
      }
    };

    const scrollContainer = scrollRef.current;
    const debouncedCheck = debounce(handleVisibilityCheck, 100); // Add debounce for performance

    scrollContainer.addEventListener("scroll", debouncedCheck);
    handleVisibilityCheck(); // Initial check

    return () => {
      scrollContainer.removeEventListener("scroll", debouncedCheck);
    };
  }, [selectedPoints, allPixels, onHighlight]);

  // Add debounce utility function
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

  const pixelsToShow = selectedPoints?.length > 0 ? selectedPoints : allPixels;

  // Update click handler to only pass the ID
  const handlePixelClick = (pixel) => {
    setSelectedPixelId(pixel.serial || pixel.pixel_number);
  };

  return (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        {/* <div className={styles.title}>
          {selectedPoints?.length > 0
            ? `Selected Pixels (${selectedPoints.length})`
            : `All Pixels (${allPixels.length})`}
        </div> */}
      </div>
      <div ref={scrollRef} className={styles.scrollableList} onScroll={handleScroll}>
        {pixelsToShow.map((pixel, index) => {
          // Ensure we have valid data for each field
          const emissions = typeof pixel.total_emissions === "number" ? pixel.total_emissions : 0;
          const distance = pixel.distanceTraveled ?? 0;
          const pixelNumber = pixel.pixel_number || pixel.serial || `Unknown-${index}`;
          const isHighlighted = index === highlightedIndex;

          return (
            <div
              key={pixel.serial || index}
              className={`${styles.listItem} ${isHighlighted ? styles.highlighted : ""}`}
              onClick={() => handlePixelClick(pixel)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handlePixelClick(pixel)}
            >
              <div className={styles.itemInfo}>
                <div className={styles.itemNumber}>PIXEL {pixelNumber}</div>
                <div className={styles.itemEmissions}>{emissions.toFixed(2)}kg CO2e</div>
                <div className={styles.itemState}>{distance.toFixed(0)}km</div>
                <div className={styles.sparkline}>
                  <SparkLine data={pixel.emissions_over_time || {}} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {selectedPixelId && (
        <Card>
          <PixelDetail id={selectedPixelId} initialTab="story" onClose={() => setSelectedPixelId(null)} />
        </Card>
      )}
    </div>
  );
};

export default SelectedPixels;
