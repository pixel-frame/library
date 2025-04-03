import React, { useState, useEffect, useRef } from "react";
import styles from "./Pixels.module.css";
import TestList from "./TestList";
import PixelDetailView from "./PixelPreview";
import Button from "../../widgets/Button";
import PageHeader from "../common/PageHeader";
import WheelListHandler from "./WheelListHandler";
import PixelList from "./PixelList";
import { AnimatedText } from "../text/AnimatedText";
import { RollingText } from "../text/RollingText";
import Card from "../buttons/Card";
import PixelDetail from "../../pages/PixelDetail";
import PixelCanvas2 from "./PixelCanvas";
import SheetModal from "../buttons/Card";
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
  const [showExpandButton, setShowExpandButton] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPixelId, setSelectedPixelId] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState("number");
  const [filterBy, setFilterBy] = useState("all");

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

  const handleSelectionChange = (index) => {
    if (index === selectedIndex) return;
    setSelectedIndex(index);
  };

  const handleExpandClick = () => {
    const selectedPixel = pixels[selectedIndex];
    if (!selectedPixel) return;

    setSelectedPixelId(selectedPixel.serial);
    setIsOpen(true);
  };

  const handleCloseCard = () => {
    setIsOpen(false);
    setSelectedPixelId(null);
  };

  const handleTabChange = (tabId) => {
    // Optional: Handle tab changes if needed
  };

  if (loading) return <div className={styles.loadingIndicator}>LOADING PIXEL BANK...</div>;
  if (error) return <div className={styles.errorMessage}>{error}</div>;
  if (pixels.length === 0) return <div className={styles.noPixels}>NO PIXELS FOUND</div>;

  const selectedPixel = pixels[selectedIndex];
  const stablePixel = pixels[stableIndex];
  const previousPixel = previousIndex !== null ? pixels[previousIndex] : null;

  return (
    <div className={styles.pixelsContainer}>
      <div className={styles.viewToggle}>
        <Button
          className={`${styles.viewButton} ${selectedView === "compact" ? styles.selected : ""}`}
          onClick={() => setIsFilterOpen(true)}
          aria-label="Filter view"
          tabIndex="0"
          onKeyDown={(e) => e.key === "Enter" && setIsFilterOpen(true)}
        >
          [FILTER / EXPAND / IMAGINE]
        </Button>
      </div>

      <SheetModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)}>
        <div className={styles.filterContent}>
          <div className={styles.filterControls}>
            <div className={styles.dropdownContainer}>
              <Button
                className={styles.dropdownButton}
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                aria-label="Sort options"
                tabIndex="0"
                onKeyDown={(e) => e.key === "Enter" && setIsSortDropdownOpen(!isSortDropdownOpen)}
              >
                SORT BY
              </Button>
              {isSortDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <Button
                    onClick={() => {
                      setSortBy("number");
                      setIsSortDropdownOpen(false);
                    }}
                  >
                    Number
                  </Button>
                  <Button
                    onClick={() => {
                      setSortBy("generation");
                      setIsSortDropdownOpen(false);
                    }}
                  >
                    Generation
                  </Button>
                  <Button
                    onClick={() => {
                      setSortBy("state");
                      setIsSortDropdownOpen(false);
                    }}
                  >
                    State
                  </Button>
                </div>
              )}
            </div>

            <div className={styles.dropdownContainer}>
              <Button
                className={styles.dropdownButton}
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                aria-label="Filter options"
                tabIndex="0"
                onKeyDown={(e) => e.key === "Enter" && setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              >
                FILTER
              </Button>
              {isFilterDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <Button
                    onClick={() => {
                      setFilterBy("all");
                      setIsFilterDropdownOpen(false);
                    }}
                  >
                    All
                  </Button>
                  <Button
                    onClick={() => {
                      setFilterBy("available");
                      setIsFilterDropdownOpen(false);
                    }}
                  >
                    Available
                  </Button>
                  <Button
                    onClick={() => {
                      setFilterBy("locked");
                      setIsFilterDropdownOpen(false);
                    }}
                  >
                    Locked
                  </Button>
                </div>
              )}
            </div>
          </div>
          <PixelCanvas2
            pixels={pixels}
            selectedIndex={selectedIndex}
            onPixelClick={handleSelectionChange}
            sortMode={sortBy}
          />
        </div>
      </SheetModal>

      <div className={styles.mainPixelContent}>
        {viewMode !== "grid" && (
          <>
            <PixelDetailView
              selectedPixel={stablePixel}
              previousPixel={previousPixel}
              transitionDirection={transitionDirection}
              viewMode={viewMode}
              onViewModeChange={cycleViewMode}
              isScrolling={isScrolling}
              targetPixel={selectedPixel}
            />
            <div className={styles.breaker}>
              {selectedIndex === 0 ? (
                <RollingText text="SCROLL THE WHEEL TO EXPLORE /////// " />
              ) : (
                <>
                  <AnimatedText text="PIXELS" />
                  <AnimatedText text="STATUS" />
                </>
              )}
            </div>
            <WheelListHandler
              items={pixels}
              titleText="PIXEL BANK"
              onSelectionChange={(item, index) => handleSelectionChange(index)}
              perspective="left"
              initialIndex={selectedIndex >= 0 ? selectedIndex : 0}
              valueFormatter={(item) => ({
                left: `Pixel ${item.number || item.serial}`,
                right: item.state_description || "Available",
              })}
              buttonText="VIEW PIXEL DETAILS"
              onButtonClick={handleExpandClick}
            />
          </>
        )}
        {viewMode === "grid" && (
          <PixelList
            pixels={pixels}
            selectedIndex={selectedIndex}
            viewMode={viewMode}
            onItemClick={handleSelectionChange}
          />
        )}
      </div>

      {isOpen && selectedPixelId && (
        <Card isOpen={isOpen} onClose={handleCloseCard}>
          <PixelDetail id={selectedPixelId} initialTab="info" onClose={handleCloseCard} onTabChange={handleTabChange} />
        </Card>
      )}
    </div>
  );
};

export default Pixels;
