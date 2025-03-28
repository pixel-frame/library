import React, { useState, useEffect, useRef } from "react";
import styles from "./Pixels.module.css";
import TestList from "./TestList";
import PixelDetailView from "./PixelPreview";
import PixelSpaceView from "./PixelSpace";
import PixelCanvas2 from "./PixelCanvas2";
import Button from "../../widgets/Button";
import PageHeader from "../common/PageHeader";

const Pixels = () => {
  const [pixels, setPixels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1); // Set to -1 to select "ALL" by default
  const [stableIndex, setStableIndex] = useState(-1);
  const [previousIndex, setPreviousIndex] = useState(null);
  const [transitionDirection, setTransitionDirection] = useState("Right");
  const [viewMode, setViewMode] = useState("vertical"); // 'vertical', 'horizontal', or 'grid'
  const [isScrolling, setIsScrolling] = useState(false);
  const [selectedView, setSelectedView] = useState("compact"); // Track which view button is selected
  const [sortMode, setSortMode] = useState("default"); // Add sort mode state
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
    if (view === "space") {
      setViewMode("vertical"); // Set to normal view for compact
    } else if (view === "compact") {
      setViewMode("grid"); // Set to grid view for detailed
    }
  };

  const handleSelectionChange = (index) => {
    if (index === selectedIndex) return;
    setSelectedIndex(index);
  };

  const handleSortByAssembly = () => {
    // Toggle between default and assembly sort
    setSortMode(sortMode === "default" ? "assembly" : "default");
  };

  if (loading) return <div className={styles.loadingIndicator}>LOADING PIXEL BANK...</div>;
  if (error) return <div className={styles.errorMessage}>{error}</div>;
  if (pixels.length === 0) return <div className={styles.noPixels}>NO PIXELS FOUND</div>;

  // Handle the "ALL" case by using null or a special indicator
  const selectedPixel = selectedIndex >= 0 ? selectedIndex : null;

  return (
    <div className={styles.pixelsContainer}>
      <PageHeader
        title="Material Bank"
        viewToggle={
          <div className={styles.viewToggle}>
            <Button
              className={`${styles.viewButton} ${selectedView === "space" ? styles.selected : ""}`}
              onClick={() => handleViewChange("space")}
              aria-label="Detailed view"
              tabIndex="0"
              onKeyDown={(e) => e.key === "Enter" && handleViewChange("space")}
            >
              [SPACE]
            </Button>
            <Button
              className={`${styles.viewButton} ${selectedView === "compact" ? styles.selected : ""}`}
              onClick={() => handleViewChange("compact")}
              aria-label="Compact view"
              tabIndex="0"
              onKeyDown={(e) => e.key === "Enter" && handleViewChange("compact")}
            >
              [COMPACT]
            </Button>
            <Button
              className={`${styles.viewButton} ${sortMode === "assembly" ? styles.selected : ""}`}
              onClick={handleSortByAssembly}
              aria-label="Sort by assembly"
              tabIndex="0"
              onKeyDown={(e) => e.key === "Enter" && handleSortByAssembly()}
            >
              [SORT BY ASSEMBLY]
            </Button>
          </div>
        }
      />

      <div className={styles.mainPixelContent}>
        <PixelCanvas2
          pixels={pixels}
          selectedIndex={selectedPixel}
          onPixelClick={handleSelectionChange}
          width="100%"
          height="900px"
          sortMode={sortMode}
        />

        <TestList onSelectionChange={handleSelectionChange} />
      </div>
    </div>
  );
};

export default Pixels;
