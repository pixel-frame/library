import React, { useEffect, useState, useRef } from "react";
import styles from "./SelectedPixels.module.css";
import SparkLine from "./SparkLine";
import Card from "../buttons/Card";
import PixelDetail from "../../pages/PixelDetail";
import WheelListHandler from "../listing/WheelListHandler";

const SelectedPixels = ({ selectedPoints, onScroll, onHighlight }) => {
  const [allPixels, setAllPixels] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0); // Default to first item (ALL PIXELS)
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

  // Create a modified list with "ALL PIXELS" as the first option
  const enhancedPixels = [
    {
      pixel_number: "ALL",
      serial: "ALL",
      isAllOption: true,
      total_emissions: 0,
      distanceTraveled: 0,
      emissions_over_time: {},
      distance: 0, // Add this to prevent the error
    },
    ...(selectedPoints?.length > 0 ? selectedPoints : allPixels),
  ];

  const handleSelectionChange = (pixel, index) => {
    setHighlightedIndex(index);

    // If the "ALL PIXELS" option is selected, pass null to onHighlight
    if (index === 0 && pixel.isAllOption) {
      onHighlight(null);
    } else {
      onHighlight(pixel);
    }
  };

  const handleScroll = (event) => {
    lastScrollPosition.current = event.target.scrollTop;
    onScroll(event);
  };

  const handlePixelClick = () => {
    // Get the currently selected pixel
    const selectedPixel = enhancedPixels[highlightedIndex];

    // Don't show details if it's the "ALL PIXELS" option
    if (selectedPixel.isAllOption) return;

    // Set the selected pixel ID
    setSelectedPixelId(selectedPixel.serial || selectedPixel.pixel_number);
  };

  // Custom formatter for pixels
  const pixelFormatter = (pixel, index) => {
    // Special case for "ALL PIXELS" option
    if (pixel.isAllOption) {
      return {
        left: "ALL PIXELS",
        right: "",
      };
    }

    // Format regular pixels
    const emissions = typeof pixel.total_emissions === "number" ? pixel.total_emissions : 0;
    const pixelNumber = pixel.pixel_number || pixel.serial || `Unknown-${index}`;

    return {
      left: `PIXEL ${pixelNumber}`,
      right: `${emissions.toFixed(2)}kg CO2e`,
    };
  };

  if (!allPixels || allPixels.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>No pixels available</div>
      </div>
    );
  }

  // Determine if we should show the view details button (not for ALL PIXELS)
  const showDetailsButton = highlightedIndex > 0;

  return (
    <div className={styles.container}>
      <div ref={scrollRef} className={styles.scrollableList} onScroll={handleScroll}>
        <WheelListHandler
          items={enhancedPixels}
          onSelectionChange={handleSelectionChange}
          valueFormatter={pixelFormatter}
          perspective="left"
          initialIndex={highlightedIndex}
          buttonText={showDetailsButton ? "View Details" : null}
          onButtonClick={showDetailsButton ? handlePixelClick : null}
        />
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
