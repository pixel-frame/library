import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styles from "./Pixels.module.css";
import PixelModelTransition from "../models/PixelModelTransition";
import { RollingText } from "../text/RollingText";

const Pixels = () => {
  const [pixels, setPixels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(null);
  const [transitionDirection, setTransitionDirection] = useState("Right");
  const [viewMode, setViewMode] = useState("vertical"); // 'vertical', 'horizontal', or 'grid'

  // Use ref to track previous selected index for direction calculation
  const prevSelectedIndexRef = useRef(selectedIndex);

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

  useEffect(() => {
    if (pixels.length === 0) return;

    let lastWheelTime = Date.now();
    const wheelThreshold = 100;

    const handleWheel = (event) => {
      if (viewMode === "grid") return;

      const now = Date.now();
      if (now - lastWheelTime < wheelThreshold) return;

      const delta = Math.sign(viewMode === "horizontal" ? event.deltaX : event.deltaY);

      if (delta !== 0) {
        const newIndex = delta > 0 ? Math.min(selectedIndex + 1, pixels.length - 1) : Math.max(selectedIndex - 1, 0);

        if (newIndex !== selectedIndex) {
          setPreviousIndex(selectedIndex);
          setTransitionDirection(delta > 0 ? "Left" : "Right");
          setSelectedIndex(newIndex);
        }
      }

      lastWheelTime = now;
    };

    const listElement = document.querySelector(`.${styles.scrollableList}`);
    listElement?.addEventListener("wheel", handleWheel);

    return () => {
      listElement?.removeEventListener("wheel", handleWheel);
    };
  }, [pixels.length, viewMode, selectedIndex]);

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

  const cycleViewMode = () => {
    setViewMode(viewMode === "vertical" ? "horizontal" : viewMode === "horizontal" ? "grid" : "vertical");
  };

  const handleItemClick = (index) => {
    if (index === selectedIndex) return;

    setPreviousIndex(selectedIndex);
    setTransitionDirection(index > selectedIndex ? "Left" : "Right");
    setSelectedIndex(index);
  };

  if (loading) return <div className={styles.loadingIndicator}>LOADING PIXEL BANK...</div>;
  if (error) return <div className={styles.errorMessage}>{error}</div>;
  if (pixels.length === 0) return <div className={styles.noPixels}>NO PIXELS FOUND</div>;

  return (
    <div className={styles.pixelsContainer}>
      <div className={styles.mainPixelContent}>
        {viewMode !== "grid" && (
          <div className={styles.detailSection}>
            <div className={styles.modelContainer}>
              <PixelModelTransition
                currentSerial={pixels[selectedIndex]?.serial}
                previousSerial={previousIndex !== null ? pixels[previousIndex]?.serial : null}
                direction={transitionDirection}
                viewMode={viewMode}
                pixelNumber={pixels[selectedIndex]?.number}
              />

              {/* View mode toggle button positioned absolutely on top of model viewer */}
              <button
                className={styles.viewToggleBtn}
                onClick={cycleViewMode}
                aria-label={`Current view: ${viewMode}. Click to change view mode`}
                tabIndex="0"
              >
                {viewMode === "vertical" ? "→" : viewMode === "horizontal" ? "□" : "↓"}
              </button>
            </div>

            <div className={styles.moreInfoLink}>
              <Link
                to={`/pixel/${pixels[selectedIndex]?.serial}`}
                className={styles.pixelDetailLink}
                aria-label={`View detailed information for Pixel ${pixels[selectedIndex]?.number}`}
              >
                <RollingText text="MORE INFORMATION →  MORE INFORMATION → MORE INFORMATION →  " />
              </Link>
            </div>
          </div>
        )}

        <div className={`${styles.scrollableList} ${styles[viewMode]}`}>
          {pixels.map((pixel, index) => (
            <div
              key={pixel.id}
              className={`${styles.listItem} ${selectedIndex === index ? styles.selected : ""}`}
              onClick={() => handleItemClick(index)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleItemClick(index);
              }}
              tabIndex="0"
              aria-label={`Pixel ${pixel.number}, ${pixel.state_description}`}
            >
              <div className={styles.pixelPreview}>{generateSimpleASCII(pixel.serial)}</div>
              <div className={styles.itemInfo}>
                <div className={styles.itemNumber}>PIXEL {pixel.number}</div>
                <div className={styles.itemGeneration}>GEN {pixel.generation}</div>
                <div className={styles.itemState}>{pixel.state_description}</div>
                {viewMode === "grid" && (
                  <Link
                    to={`/pixel/${pixel.serial}`}
                    className={styles.gridItemLink}
                    aria-label={`View detailed information for Pixel ${pixel.number}`}
                  >
                    VIEW →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const generateSimpleASCII = (serial) => {
  const patterns = ["▣", "▢", "▤", "▥", "▦", "▧", "▨", "▩"];
  return patterns[parseInt(serial, 10) % patterns.length];
};

export default Pixels;
