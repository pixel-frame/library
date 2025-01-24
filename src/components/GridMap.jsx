import { useState, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./GridMap.css";

function GridMap({ selectedId }) {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("default");
  const [isAnimating, setIsAnimating] = useState(false);
  const positionsRef = useRef(new Map());

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
    (pixelId) => {
      navigate(`/pixel/${pixelId}`);
    },
    [navigate]
  );

  const getSortedPixels = useCallback(() => {
    switch (sortBy) {
      case "location":
        return [...pixels].sort((a, b) => (a.location === "near" ? -1 : 1));
      case "availability":
        return [...pixels].sort((a, b) => b.availability - a.availability);
      default:
        return pixels;
    }
  }, [sortBy, pixels]);

  // Add selected state to pixel box
  const getPixelClassName = (pixelId) => {
    const classes = ["pixel-box"];
    if (isAnimating) classes.push("animating");
    if (pixelId === selectedId) classes.push("selected");
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
            className={getPixelClassName(pixel.id)}
            onClick={() => handlePixelClick(pixel.id)}
          >
            {pixel.id}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GridMap;
