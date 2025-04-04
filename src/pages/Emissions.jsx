import React, { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Carbon from "../components/datavis/Carbon";
import SelectedPixels from "../components/datavis/SelectedPixels";
import VisualizationLayout from "../layouts/VisualizationLayout";
import styles from "./Emissions.module.css";

const Emissions = () => {
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [highlightedPoint, setHighlightedPoint] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Parse URL parameters
  const pixelId = searchParams.get("pixel");

  const handleScroll = useCallback((event) => {
    const scrollTop = event.target.scrollTop;
    setIsListExpanded(scrollTop > 10);
  }, []);

  const handleSelectionChange = useCallback((points) => {
    setSelectedPoints(points);
  }, []);

  const handleHighlight = useCallback((point) => {
    setHighlightedPoint(point);
  }, []);

  const handlePixelSelect = useCallback(
    (pixelId, queryString = "") => {
      // Update URL with selected pixel ID or remove parameter if null
      if (pixelId) {
        // If queryString is provided, use it directly
        if (queryString) {
          navigate(`?${queryString}`, { replace: false });
        } else {
          // Otherwise just update the pixel parameter
          const params = new URLSearchParams(searchParams);
          params.set("pixel", pixelId);
          navigate(`?${params.toString()}`, { replace: false });
        }
      } else {
        // When closing, preserve any parameters except pixel
        const params = new URLSearchParams(searchParams);
        params.delete("pixel");
        params.delete("tab"); // Also remove tab when closing pixel detail

        if (params.toString()) {
          navigate(`?${params.toString()}`, { replace: false });
        } else {
          navigate("", { replace: false });
        }
      }
    },
    [navigate, searchParams]
  );

  return (
    <div className={styles.container}>
      {/* <PageHeader title="Carbon Emissions" /> */}

      <div className={styles.content}>
        <VisualizationLayout
          visualization={
            <Carbon
              onSelectionChange={handleSelectionChange}
              selectedPoints={selectedPoints}
              highlightedPoint={highlightedPoint}
            />
          }
          breakerLeftText="PIXEL"
          breakerRightText="A1-A5 EMISSIONS"
          listingComponent={
            <SelectedPixels
              selectedPoints={selectedPoints}
              onScroll={handleScroll}
              onHighlight={handleHighlight}
              urlPixelId={searchParams.get("pixel")}
              onPixelSelect={handlePixelSelect}
            />
          }
          isCollapsed={isListExpanded}
        />
      </div>
    </div>
  );
};

export default Emissions;
