import { useState, useCallback, useMemo, useRef, useLayoutEffect, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import DetailModal from "./DetailModal";
import "./GridMap.css";
import { setModalActive } from "../store/cardSlice";

function GridMap({ selectedId, onModalOpen, onModalClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { navigationSource, modalActive } = useSelector((state) => state.card);
  const [sortBy, setSortBy] = useState("default");
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedPixel, setSelectedPixel] = useState(null);
  const positionsRef = useRef(new Map());

  useEffect(() => {
    // Clear selection when returning to map view
    if (location.pathname === "/" && navigationSource === "map") {
      setSelectedPixel(null);
      // Don't need to dispatch setModalActive(false) here as it's handled by ListingDetailPage
    }
  }, [location.pathname, navigationSource]);

  // Create dot grid - increased to cover viewport
  const dots = useMemo(() => Array(4000).fill(null), []); // Increased from 500 to 2000

  // Mock data - in real app this would come from props/context
  const pixels = Array(75)
    .fill(null)
    .map((_, index) => ({
      id: (index + 1).toString().padStart(3, "0"),
      position: index,
      location: Math.random() > 0.5 ? "near" : "far",
      availability: Math.random() > 0.5,
    }));

  // Store positions before update
  const storePositions = () => {
    const positions = new Map();
    const boxes = document.querySelectorAll(".pixel-box");
    boxes.forEach((box) => {
      const rect = box.getBoundingClientRect();
      positions.set(box.dataset.id, { top: rect.top, left: rect.left });
    });
    return positions;
  };

  // Calculate and apply transforms
  const animateGridChanges = (oldPositions) => {
    const boxes = document.querySelectorAll(".pixel-box");
    boxes.forEach((box) => {
      const oldPos = oldPositions.get(box.dataset.id);
      const newPos = box.getBoundingClientRect();

      // Calculate the difference
      const deltaX = oldPos.left - newPos.left;
      const deltaY = oldPos.top - newPos.top;

      // Set initial position
      box.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      box.style.transition = "none";

      // Force reflow
      box.offsetHeight;

      // Animate to final position
      box.style.transform = "translate(0, 0)";
      box.style.transition = "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
    });
  };

  const handleSort = useCallback(
    (type) => {
      if (type !== sortBy) {
        const oldPositions = storePositions();
        setIsAnimating(true);
        setSortBy(type);

        // Wait for next frame to calculate new positions
        requestAnimationFrame(() => {
          animateGridChanges(oldPositions);
          setTimeout(() => setIsAnimating(false), 500);
        });
      }
    },
    [sortBy]
  );

  const handlePixelClick = useCallback(
    (pixel) => {
      // Only handle clicks if we're not in a transitional state
      if (location.pathname === "/") {
        setSelectedPixel(pixel);
        dispatch(setModalActive(true));
        onModalOpen();
      }
    },
    [dispatch, onModalOpen, location.pathname]
  );

  const handleCloseModal = useCallback(() => {
    setSelectedPixel(null);
    dispatch(setModalActive(false));
    onModalClose();
  }, [dispatch, onModalClose]);

  // Helper function to get spatial position
  const getSpatialPosition = useCallback((pixel) => {
    // Create clusters based on ID ranges
    const id = parseInt(pixel.id);
    const cluster = Math.floor(id / 10);

    // Generate positions based on location and cluster
    if (pixel.location === "near") {
      // Near field pixels cluster in top-left and bottom-right
      const isTopLeft = cluster % 2 === 0;
      return {
        row: isTopLeft ? 1 + cluster * 2 : 8 + (cluster % 3),
        col: isTopLeft ? 1 + (id % 3) : 9 + (id % 3),
      };
    } else {
      // Far field pixels cluster in top-right and bottom-left
      const isTopRight = cluster % 2 === 0;
      return {
        row: isTopRight ? 2 + cluster * 2 : 9 + (cluster % 3),
        col: isTopRight ? 8 + (id % 3) : 2 + (id % 3),
      };
    }
  }, []);

  // Update getSortedPixels to handle spatial layout
  const getSortedPixels = useCallback(() => {
    switch (sortBy) {
      case "location":
        return [...pixels].map((pixel) => ({
          ...pixel,
          position: getSpatialPosition(pixel),
        }));
      case "default":
        return pixels.map((pixel, index) => ({
          ...pixel,
          position: {
            row: Math.floor(index / 8) + 1,
            col: (index % 8) + 1,
          },
        }));
      case "availability":
        return [...pixels]
          .sort((a, b) => b.availability - a.availability)
          .map((pixel, index) => ({
            ...pixel,
            position: {
              row: Math.floor(index / 8) + 1,
              col: (index % 8) + 1,
            },
          }));
      default:
        return pixels;
    }
  }, [sortBy, pixels, getSpatialPosition]);

  // Update getPixelClassName to include spatial classes
  const getPixelClassName = (pixel) => {
    const classes = ["pixel-box"];
    if (isAnimating) classes.push("animating");
    if (pixel.id === selectedId || pixel.id === selectedPixel?.id) classes.push("selected");
    if (sortBy === "location") {
      classes.push("spatial");
      classes.push(pixel.location === "near" ? "near-field" : "far-field");
    }
    return classes.join(" ");
  };

  const handleTouchStart = useCallback((e) => {
    e.preventDefault(); // Prevent double-tap zoom
  }, []);

  return (
    <div className="grid-map" onTouchStart={handleTouchStart}>
      <div className="dot-grid">
        {dots.map((_, index) => (
          <div key={index} className="dot" />
        ))}
      </div>
      <div className="grid-header">
        <h2>PIXELFRAME</h2>
        <div className="grid-controls">
          <button className={sortBy === "default" ? "active" : ""} onClick={() => handleSort("default")}>
            Default
          </button>
          <button className={sortBy === "location" ? "active" : ""} onClick={() => handleSort("location")}>
            Location
          </button>
          <button className={sortBy === "availability" ? "active" : ""} onClick={() => handleSort("availability")}>
            Availability
          </button>
        </div>
      </div>
      <div className="grid-container">
        {getSortedPixels().map((pixel) => (
          <div
            key={pixel.id}
            data-id={pixel.id}
            className={getPixelClassName(pixel)}
            style={
              sortBy === "location"
                ? {
                    "--grid-row": pixel.position.row,
                    "--grid-col": pixel.position.col,
                  }
                : {}
            }
            onClick={() => handlePixelClick(pixel)}
          >
            {pixel.id}
          </div>
        ))}
      </div>
      {selectedPixel && <DetailModal pixel={selectedPixel} onClose={handleCloseModal} />}
    </div>
  );
}

export default GridMap;
