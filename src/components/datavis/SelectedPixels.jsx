import React, { useEffect, useState, useRef, useMemo } from "react";
import styles from "./SelectedPixels.module.css";
import SparkLine from "./SparkLine";
import Card from "../buttons/Card";
import PixelDetail from "../../pages/PixelDetail";
import WheelListHandler from "../listing/WheelListHandler";
import { useLocation, useSearchParams } from "react-router-dom";

const SelectedPixels = ({ selectedPoints, onScroll, onHighlight, urlPixelId, onPixelSelect }) => {
  const [allPixels, setAllPixels] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0); // Default to first item (ALL PIXELS)
  const scrollRef = useRef(null);
  const lastScrollPosition = useRef(0);
  const [selectedPixelId, setSelectedPixelId] = useState(urlPixelId || null);
  const [isOpen, setIsOpen] = useState(!!urlPixelId);

  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "info";

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

  // Handle URL pixel ID changes
  useEffect(() => {
    if (urlPixelId) {
      setSelectedPixelId(urlPixelId);
      setIsOpen(true);

      // Find and highlight the pixel in the list
      if (allPixels.length > 0) {
        const pixelIndex = enhancedPixels.findIndex((p) => p.serial === urlPixelId || p.pixel_number === urlPixelId);
        if (pixelIndex > 0) {
          setHighlightedIndex(pixelIndex);
          onHighlight(enhancedPixels[pixelIndex]);
        }
      }
    } else {
      setIsOpen(false);
      setSelectedPixelId(null);
    }
  }, [urlPixelId, allPixels]);

  // Create a modified list with "ALL PIXELS" as the first option and embed sparklines
  const enhancedPixels = useMemo(() => {
    const basePixels = selectedPoints?.length > 0 ? selectedPoints : allPixels;

    // Create the ALL option
    const allOption = {
      pixel_number: "ALL",
      serial: "ALL",
      isAllOption: true,
      total_emissions: 0,
      distanceTraveled: 0,
      emissions_over_time: {},
      distance: 0,
    };

    // Process the regular pixels to include sparkline components
    const processedPixels = basePixels
      .map((pixel) => {
        const hasEmissionsData = pixel.emissions_over_time && Object.keys(pixel.emissions_over_time).length > 0;

        // Create a copy of the pixel with the sparkline component
        return {
          ...pixel,
          // Add a sparklineComponent property that WheelListHandler can use
          sparklineComponent: hasEmissionsData ? (
            <div className={styles.sparklineContainer}>
              <SparkLine data={pixel.emissions_over_time} color={"var(--text-primary)"} height={20} width={80} />
            </div>
          ) : null,
        };
      })
      .sort((a, b) => {
        const numA = parseInt(a.pixel_number) || parseInt(a.serial) || 0;
        const numB = parseInt(b.pixel_number) || parseInt(b.serial) || 0;
        return numA - numB;
      });

    return [allOption, ...processedPixels];
  }, [selectedPoints, allPixels]);

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

    // Set the selected pixel ID and open the card
    const pixelId = selectedPixel.serial || selectedPixel.pixel_number;
    setSelectedPixelId(pixelId);
    setIsOpen(true);

    // Update URL via parent component
    const params = new URLSearchParams(searchParams);
    params.set("pixel", pixelId);
    if (!params.has("tab")) {
      params.set("tab", "history"); // Default to history tab when opening
    }
    onPixelSelect(pixelId, params.toString());
  };

  const handleCloseCard = () => {
    setIsOpen(false);
    setSelectedPixelId(null);

    // Update URL to remove pixel parameter but preserve other parameters
    onPixelSelect(null);
  };

  // Handle tab changes from within the PixelDetail component
  const handleTabChange = (tabId) => {
    // We don't need to update state here as PixelDetail handles its own state
    // Just need to ensure the URL is updated correctly
    const params = new URLSearchParams(searchParams);

    if (tabId === "info") {
      params.delete("tab");
    } else {
      params.set("tab", tabId);
    }

    // Make sure pixel ID is preserved
    if (selectedPixelId) {
      params.set("pixel", selectedPixelId);
      onPixelSelect(selectedPixelId, params.toString());
    }
  };

  // Custom formatter for pixels that includes the sparkline component
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

    // Return formatted value with sparkline component
    return {
      left: `PIXEL ${pixelNumber}`,
      right: `${emissions.toFixed(2)}kg CO2e`,
      customContent: pixel.sparklineComponent,
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
          buttonText={showDetailsButton ? "VIEW PIXEL DETAILS" : null}
          onButtonClick={showDetailsButton ? handlePixelClick : null}
        />
      </div>

      {isOpen && selectedPixelId && (
        <Card isOpen={isOpen} onClose={handleCloseCard}>
          <PixelDetail
            id={selectedPixelId}
            initialTab={currentTab}
            onClose={handleCloseCard}
            onTabChange={handleTabChange}
          />
        </Card>
      )}
    </div>
  );
};

export default SelectedPixels;
