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

  // Add structural connections state
  const [structuralConnections, setStructuralConnections] = useState({
    beams: [],
    columns: [],
  });

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
      carbon: Math.random() * 10,
      distance: Math.random() * 30000,
      health: (() => {
        const rand = Math.random();
        if (rand < 0.25) return "new";
        if (rand < 0.5) return "nominal";
        if (rand < 0.75) return "degraded";
        return "archived";
      })(),
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

  // Define cluster locations with more precise positions
  const clusterLocations = {
    0: { name: "Venice", position: { row: 2, col: 2 } },
    1: { name: "Boston", position: { row: 4, col: 7 } },
    2: { name: "New York", position: { row: 12, col: 2 } },
    3: { name: "London", position: { row: 12, col: 8 } },
  };

  // Update getSpatialPosition for better clustering
  const getSpatialPosition = useCallback((pixel) => {
    const id = parseInt(pixel.id);

    // Determine which cluster the pixel belongs to based on ID ranges
    let cluster;
    if (id >= 1 && id <= 20) cluster = 0; // Venice
    else if (id >= 21 && id <= 40) cluster = 1; // Boston
    else if (id >= 41 && id <= 60) cluster = 2; // New York
    else cluster = 3; // London

    const clusterData = clusterLocations[cluster];

    // Create a 3x3 grid pattern within each cluster
    const localPosition = id % 9; // Position within the cluster (0-8)
    const row = Math.floor(localPosition / 3); // 0, 1, or 2
    const col = localPosition % 3; // 0, 1, or 2

    return {
      row: clusterData.position.row + row - 1, // -1 to center the pattern
      col: clusterData.position.col + col - 1, // -1 to center the pattern
    };
  }, []);

  // Update getSortedPixels to handle new layouts
  const getSortedPixels = useCallback(() => {
    switch (sortBy) {
      case "metrics":
        // Position based on carbon (y) and distance (x)
        const maxCarbon = Math.max(...pixels.map((p) => p.carbon));
        const maxDistance = Math.max(...pixels.map((p) => p.distance));
        return pixels.map((pixel) => ({
          ...pixel,
          position: {
            row: Math.floor((1 - pixel.carbon / maxCarbon) * 10) + 1,
            col: Math.floor((pixel.distance / maxDistance) * 10) + 1,
          },
        }));

      case "health":
        // Cluster by health status
        const healthClusters = {
          new: { row: 2, col: 2 },
          nominal: { row: 2, col: 8 },
          degraded: { row: 8, col: 2 },
          archived: { row: 8, col: 8 },
        };
        return pixels.map((pixel, index) => {
          const basePosition = healthClusters[pixel.health];
          const offset = index % 9; // Create 3x3 grid within each cluster
          return {
            ...pixel,
            position: {
              row: basePosition.row + Math.floor(offset / 3) - 1,
              col: basePosition.col + (offset % 3) - 1,
            },
          };
        });

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

  // Update when a pixel is selected to set its connections
  useEffect(() => {
    if (selectedPixel) {
      // Mock connection logic - in real app this would come from API/props
      const pixelId = selectedPixel.id;
      const baseNum = parseInt(pixelId);

      // Generate some logical connections based on pixel ID
      setStructuralConnections({
        beams: [
          (baseNum + 1).toString().padStart(3, "0"),
          (baseNum + 2).toString().padStart(3, "0"),
          (baseNum + 3).toString().padStart(3, "0"),
        ].filter((id) => id <= "075"), // Keep only valid IDs
        columns: [(baseNum - 8).toString().padStart(3, "0"), (baseNum - 16).toString().padStart(3, "0")].filter(
          (id) => id > "000"
        ), // Keep only valid IDs
      });
    }
  }, [selectedPixel]);

  // Update getPixelClassName to handle health colors
  const getPixelClassName = (pixel) => {
    const classes = ["pixel-box"];
    if (isAnimating) classes.push("animating");
    if (pixel.id === selectedId || pixel.id === selectedPixel?.id) classes.push("selected");

    if (sortBy === "location") {
      classes.push("spatial");
      classes.push(pixel.location === "near" ? "near-field" : "far-field");
    } else if (sortBy === "health") {
      classes.push(pixel.health); // Add health status as class
    }

    // Add connected class if this pixel is connected to selected pixel
    if (
      selectedPixel &&
      (structuralConnections.beams.includes(pixel.id) || structuralConnections.columns.includes(pixel.id))
    ) {
      classes.push("connected");
      classes.push(structuralConnections.beams.includes(pixel.id) ? "beam" : "column");
    }
    return classes.join(" ");
  };

  const handleTouchStart = useCallback((e) => {
    e.preventDefault(); // Prevent double-tap zoom
  }, []);

  // Update calculateConnections to match cluster logic
  const calculateConnections = useCallback(
    (pixels) => {
      if (sortBy !== "location") return [];

      const connections = [];
      const cellSize = 48; // 40px + 8px gap

      pixels.forEach((pixel, i) => {
        const id = parseInt(pixel.id);
        // Use same clustering logic as getSpatialPosition
        let cluster;
        if (id >= 1 && id <= 20) cluster = 0;
        else if (id >= 21 && id <= 40) cluster = 1;
        else if (id >= 41 && id <= 60) cluster = 2;
        else cluster = 3;

        pixels.forEach((otherPixel, j) => {
          if (i >= j) return;

          const otherId = parseInt(otherPixel.id);
          let otherCluster;
          if (otherId >= 1 && otherId <= 20) otherCluster = 0;
          else if (otherId >= 21 && otherId <= 40) otherCluster = 1;
          else if (otherId >= 41 && otherId <= 60) otherCluster = 2;
          else otherCluster = 3;

          if (cluster === otherCluster) {
            const x1 = (pixel.position.col - 1) * cellSize + 20;
            const y1 = (pixel.position.row - 1) * cellSize + 20;
            const x2 = (otherPixel.position.col - 1) * cellSize + 20;
            const y2 = (otherPixel.position.row - 1) * cellSize + 20;

            const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;

            connections.push({
              id: `${pixel.id}-${otherPixel.id}`,
              style: {
                width: `${length}px`,
                left: `${x1}px`,
                top: `${y1}px`,
                transform: `rotate(${angle}deg)`,
              },
            });
          }
        });
      });

      return connections;
    },
    [sortBy]
  );

  // Add function to render cluster labels
  const renderClusterLabels = useCallback(() => {
    if (sortBy !== "location") return null;

    return Object.entries(clusterLocations).map(([cluster, data]) => {
      const cellSize = 48; // 40px + 8px gap
      const x = (data.position.col - 1) * cellSize;
      const y = (data.position.row - 1) * cellSize + 60; // Position below the cluster

      return (
        <div
          key={`cluster-${cluster}`}
          className="cluster-label"
          style={{
            left: `${x}px`,
            top: `${y}px`,
          }}
        >
          {data.name}
        </div>
      );
    });
  }, [sortBy]);

  // Add health cluster labels similar to location clusters
  const renderHealthLabels = useCallback(() => {
    if (sortBy !== "health") return null;

    const healthClusters = {
      new: { name: "NEW", position: { row: 2, col: 2 } },
      nominal: { name: "NOMINAL", position: { row: 2, col: 8 } },
      degraded: { name: "DEGRADED", position: { row: 8, col: 2 } },
      archived: { name: "ARCHIVED", position: { row: 8, col: 8 } },
    };

    return Object.entries(healthClusters).map(([status, data]) => {
      const cellSize = 48;
      const x = (data.position.col - 1) * cellSize;
      const y = (data.position.row - 1) * cellSize + 60;

      return (
        <div
          key={`health-${status}`}
          className="cluster-label"
          style={{
            left: `${x}px`,
            top: `${y}px`,
          }}
        >
          {data.name}
        </div>
      );
    });
  }, [sortBy]);

  return (
    <div
      className={`grid-map ${sortBy === "location" ? "location-view" : ""} ${sortBy === "health" ? "health-view" : ""}`}
      onTouchStart={handleTouchStart}
    >
      <div className="dot-grid">
        {dots.map((_, index) => (
          <div key={index} className="dot" />
        ))}
      </div>
      <div className="grid-header">
        <h2>PIXELFRAME</h2>
        <div className="grid-controls">
          <button
            className={`filter-button ${sortBy === "default" ? "active" : ""}`}
            onClick={() => handleSort("default")}
          >
            Inventory
          </button>
          <button
            className={`filter-button ${sortBy === "location" ? "active" : ""}`}
            onClick={() => handleSort("location")}
          >
            Location
          </button>
          <button
            className={`filter-button ${sortBy === "metrics" ? "active" : ""}`}
            onClick={() => handleSort("metrics")}
          >
            Carbon/Distance
          </button>
          <button
            className={`filter-button ${sortBy === "health" ? "active" : ""}`}
            onClick={() => handleSort("health")}
          >
            Health
          </button>
        </div>
      </div>
      <div className="grid-container">
        {sortBy === "location" && renderClusterLabels()}
        {sortBy === "health" && renderHealthLabels()}
        {/* Connection lines */}
        {sortBy === "location" &&
          calculateConnections(getSortedPixels()).map((connection) => (
            <div key={connection.id} className="connection-line" style={connection.style} />
          ))}
        {/* Pixel boxes */}
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
            <model-viewer
              src="/pixel.gltf"
              alt={`Pixel ${pixel.id}`}
              shadow-intensity="1"
              environment-image="neutral"
              camera-orbit="0deg 0deg 2.5m"
              exposure="2"
              environment-intensity="2"
              auto-rotate
            />
            <div className="pixel-id">{pixel.id}</div>
          </div>
        ))}
      </div>
      {selectedPixel && (
        <DetailModal
          pixel={selectedPixel}
          onClose={handleCloseModal}
          structuralConnections={structuralConnections} // Pass connections as prop
        />
      )}
    </div>
  );
}

export default GridMap;
