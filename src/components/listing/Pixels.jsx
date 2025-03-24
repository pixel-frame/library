import React, { useState, useEffect, useRef } from "react";
import styles from "./Pixels.module.css";
import PixelList from "./PixelList";
import PixelDetailView from "./PixelPreview";
import Button from "../../widgets/Button";
const Pixels = () => {
  const [pixels, setPixels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [stableIndex, setStableIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(null);
  const [transitionDirection, setTransitionDirection] = useState("Right");
  const [viewMode, setViewMode] = useState("vertical"); // 'vertical', 'horizontal', or 'grid'
  const [isScrolling, setIsScrolling] = useState(false);
  const [selectedView, setSelectedView] = useState("compact"); // Track which view button is selected
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchPixels = async () => {
      try {
        const response = await fetch("/data/bank/pixel/pixels.json");
        const data = await response.json();

        const mappedPixels = data.pixels.map((pixel) => ({
          id: `pixel-${pixel.serial}`,
          number: pixel.pixel_number,
          serial: pixel.serial,
          generation: pixel.generation,
          state: pixel.state,
          state_description: pixel.state_description || "Available",
          number_of_reconfigurations: pixel.number_of_reconfigurations,
        }));

        setPixels(mappedPixels);
        setLoading(false);
      } catch (err) {
        setError("Failed to load pixels data");
        setLoading(false);
      }
    };

    fetchPixels();
  }, []);

  // Handle scrolling detection and stable index updates
  useEffect(() => {
    // When selectedIndex changes, mark as scrolling
    if (selectedIndex !== stableIndex) {
      setIsScrolling(true);

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set a timeout to detect when scrolling stops
      scrollTimeoutRef.current = setTimeout(() => {
        setPreviousIndex(stableIndex);
        setStableIndex(selectedIndex);
        setTransitionDirection(selectedIndex > stableIndex ? "Left" : "Right");
        setIsScrolling(false);
      }, 500); // Wait 500ms after last scroll event
    }

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [selectedIndex, stableIndex]);

  const cycleViewMode = () => {
    setViewMode(viewMode === "vertical" ? "horizontal" : viewMode === "horizontal" ? "grid" : "vertical");
  };

  const handleViewChange = (view) => {
    setSelectedView(view);
    if (view === "compact") {
      setViewMode("vertical"); // Set to normal view for compact
    } else if (view === "detailed") {
      setViewMode("grid"); // Set to grid view for detailed
    }
  };

  const handleItemClick = (index) => {
    if (index === selectedIndex) return;
    setSelectedIndex(index);
  };

  if (loading) return <div className={styles.loadingIndicator}>LOADING PIXEL BANK...</div>;
  if (error) return <div className={styles.errorMessage}>{error}</div>;
  if (pixels.length === 0) return <div className={styles.noPixels}>NO PIXELS FOUND</div>;

  const selectedPixel = pixels[selectedIndex];
  const stablePixel = pixels[stableIndex];
  const previousPixel = previousIndex !== null ? pixels[previousIndex] : null;

  return (
    <div className={styles.pixelsContainer}>
      <div className={styles.titleContainer}>
        {" "}
        <span className={styles.title}>Material Bank</span>{" "}
        <div className={styles.viewToggle}>
          <Button
            className={`${styles.viewButton} ${selectedView === "compact" ? styles.selected : ""}`}
            onClick={() => handleViewChange("compact")}
            aria-label="Compact view"
            tabIndex="0"
            onKeyDown={(e) => e.key === "Enter" && handleViewChange("compact")}
          >
            [DETAILED
          </Button>
          <Button
            className={`${styles.viewButton} ${selectedView === "detailed" ? styles.selected : ""}`}
            onClick={() => handleViewChange("detailed")}
            aria-label="Detailed view"
            tabIndex="0"
            onKeyDown={(e) => e.key === "Enter" && handleViewChange("detailed")}
          >
            COMPACT]
          </Button>
        </div>
      </div>

      <div className={styles.mainPixelContent}>
        {viewMode !== "grid" && (
          <PixelDetailView
            selectedPixel={stablePixel}
            previousPixel={previousPixel}
            transitionDirection={transitionDirection}
            viewMode={viewMode}
            onViewModeChange={cycleViewMode}
            isScrolling={isScrolling}
            targetPixel={selectedPixel}
          />
        )}

        <PixelList
          pixels={pixels}
          selectedIndex={selectedIndex}
          viewMode={viewMode}
          onItemClick={handleItemClick}
          onViewModeChange={cycleViewMode}
        />
      </div>
    </div>
  );
};

export default Pixels;
