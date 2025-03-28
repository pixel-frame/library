import React, { useEffect, useRef, useState } from "react";
import styles from "./Map.module.css";

// TO REPLACE MAP WHEN FINALIZED

const Map = ({ mode }) => {
  const canvasRef = useRef(null);
  const [context, setContext] = useState(null);
  const [assemblies, setAssemblies] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [viewMode, setViewMode] = useState("map"); // 'map' or 'pixels'

  // Only fetch assemblies data if in map mode
  useEffect(() => {
    if (mode === "map") {
      console.log(mode);
      const fetchData = async () => {
        try {
          const response = await fetch("/data/bank/assembly/assemblies.json");
          const data = await response.json();
          console.log("Fetched assemblies:", data.reconfigurations);
          setAssemblies(data.reconfigurations);
        } catch (error) {
          console.error("Error fetching assemblies:", error);
        }
      };
      fetchData();
    }
  }, [mode]);

  // Group locations after data is fetched
  const locationGroups = assemblies.reduce((acc, assembly) => {
    const key = `${assembly.location.coordinates.latitude},${assembly.location.coordinates.longitude}`;
    if (!acc[key]) {
      acc[key] = {
        name: assembly.location.name,
        coordinates: assembly.location.coordinates,
        assemblies: [],
      };
    }
    acc[key].assemblies.push(assembly);
    return acc;
  }, {});

  // Add this new function to calculate map bounds
  const calculateMapBounds = () => {
    if (!assemblies.length) return null;
    
    // Initialize 
    const bounds = {
      minLat: Infinity,
      maxLat: -Infinity,
      minLong: Infinity,
      maxLong: -Infinity
    };
    
    // Find min/max coordinates across all locations
    Object.values(locationGroups).forEach(location => {
      const { latitude, longitude } = location.coordinates;
      
      bounds.minLat = Math.min(bounds.minLat, latitude);
      bounds.maxLat = Math.max(bounds.maxLat, latitude);
      bounds.minLong = Math.min(bounds.minLong, longitude);
      bounds.maxLong = Math.max(bounds.maxLong, longitude);
    });
    
    return bounds;
  };

  const convertCoordinates = (long, lat, canvasWidth, canvasHeight) => {
    // Calculate map bounds
    const bounds = calculateMapBounds();
    
    if (!bounds) {
      // Fallback to original logic if no data
      const centerLong = -60;
      const centerLat = 45;
      const longScale = 2.5;
      const latScale = 4.5;

      const x = (((long - centerLong) * longScale + 180) / 360) * canvasWidth;
      const y = ((90 - (lat - centerLat) * latScale) / 180) * canvasHeight;

      return {
        x: x - canvasWidth / 4,
        y: y - canvasHeight / 4,
      };
    }
    
    // Add padding to ensure points aren't at the very edge
    const padding = 0.15; // 15% padding on each side
    const paddedWidth = canvasWidth * (1 - padding * 2);
    const paddedHeight = canvasHeight * (1 - padding * 2);
    
    // Calculate the range of coordinates
    const longRange = bounds.maxLong - bounds.minLong || 1; // Prevent division by zero
    const latRange = bounds.maxLat - bounds.minLat || 1;
    
    // Calculate position as percentage of the range
    const longPercent = (long - bounds.minLong) / longRange;
    const latPercent = (lat - bounds.minLat) / latRange;
    
    // Convert to canvas coordinates with padding
    const x = (longPercent * paddedWidth) + (canvasWidth * padding);
    const y = ((1 - latPercent) * paddedHeight) + (canvasHeight * padding); // Invert Y-axis
    
    return { x, y };
  };

  const drawLocationMap = () => {
    if (!context || !canvasRef.current || !assemblies.length) return;

    const canvas = canvasRef.current;
    const { width, height } = canvas;
    const dpr = window.devicePixelRatio || 1;

    context.clearRect(0, 0, width, height);
    context.save();

    context.scale(dpr, dpr);
    
    // Define ASCII-like spacing - wider horizontally than vertically
    const gridSizeX = Math.min(30, width / (dpr * 20));  // Horizontal spacing (character width)
    const gridSizeY = gridSizeX * 1.8;  // Vertical spacing (line height)
    
    // Set up consistent text styling for the grid
    context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text-primary");
    context.textAlign = "center";
    context.textBaseline = "middle";
    
    // Calculate grid dimensions 
    const gridCols = Math.floor(width / (dpr * gridSizeX));
    const gridRows = Math.floor(height / (dpr * gridSizeY));
    
    // Create a virtual text grid to represent our ASCII display
    // This will hold characters for the entire display
    const textGrid = Array(gridRows).fill().map(() => Array(gridCols).fill(" "));
    
    // Draw background grid dots with larger spacing
    context.font = `${Math.min(6, width / 80)}px "ABC Diatype"`;
    context.globalAlpha = 0.3;
    
    // Mark positions for background dots (every other grid cell)
    for (let row = 0; row < gridRows; row += 2) {
      for (let col = 0; col < gridCols; col += 2) {
        // Only place a dot if the cell is empty
        if (textGrid[row][col] === " ") {
          textGrid[row][col] = "▪";
        }
      }
    }
    
    // Reset opacity for location markers
    context.globalAlpha = 1.0;
    context.font = `${Math.min(14, width / 40)}px "ABC Diatype"`;
    
    // Place location markers in the grid
    Object.values(locationGroups).forEach((location) => {
      // Get approximate position first
      const { x: approxX, y: approxY } = convertCoordinates(
        location.coordinates.longitude,
        location.coordinates.latitude,
        width / dpr,
        height / dpr
      );
      
      // Snap to nearest grid position
      const centerCol = Math.min(Math.max(2, Math.round(approxX / gridSizeX)), gridCols - 3);
      const centerRow = Math.min(Math.max(2, Math.round(approxY / gridSizeY)), gridRows - 5);
      
      // Draw ASCII box in the grid (each character in its own grid cell)
      // Top row of box
      textGrid[centerRow-2][centerCol-2] = "+";
      textGrid[centerRow-2][centerCol-1] = "-";
      textGrid[centerRow-2][centerCol] = "-";
      textGrid[centerRow-2][centerCol+1] = "+";
      
      // Middle row with number
      textGrid[centerRow-1][centerCol-2] = "|";
      textGrid[centerRow-1][centerCol-1] = "0";
      textGrid[centerRow-1][centerCol] = `${location.assemblies.length}`;
      textGrid[centerRow-1][centerCol+1] = "|";
      
      // Bottom row of box
      textGrid[centerRow][centerCol-2] = "+";
      textGrid[centerRow][centerCol-1] = "-";
      textGrid[centerRow][centerCol] = "-";
      textGrid[centerRow][centerCol+1] = "+";
      
      // Location name (centered below box)
      const name = location.name;
      const startCol = centerCol - Math.floor(name.length / 2);
      for (let i = 0; i < name.length; i++) {
        const col = startCol + i;
        if (col >= 0 && col < gridCols) {
          textGrid[centerRow+1][col] = name[i];
        }
      }
    });
    
    // Now draw the entire text grid
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const char = textGrid[row][col];
        if (char !== " ") {
          // Set appropriate opacity for background dots
          if (char === "▪") {
            context.globalAlpha = 0.3;
            context.font = `${Math.min(6, width / 80)}px "ABC Diatype"`;
          } else {
            context.globalAlpha = 1.0;
            context.font = `${Math.min(14, width / 40)}px "ABC Diatype"`;
          }
          
          // Draw the character
          context.fillText(char, col * gridSizeX + gridSizeX/2, row * gridSizeY + gridSizeY/2);
        }
      }
    }

    context.restore();
  };

  const drawPixelMap = () => {
    if (!context || !canvasRef.current || !selectedLocation) return;

    const canvas = canvasRef.current;
    const { width, height } = canvas;
    const dpr = window.devicePixelRatio || 1;

    context.clearRect(0, 0, width, height);
    context.save();

    context.scale(dpr, dpr);

    // Define ASCII-like spacing
    const gridSizeX = Math.min(30, width / (dpr * 20));  // Horizontal spacing (character width)
    const gridSizeY = gridSizeX * 1.8;  // Vertical spacing (line height)
    
    // Calculate grid dimensions
    const gridCols = Math.floor(width / (dpr * gridSizeX));
    const gridRows = Math.floor(height / (dpr * gridSizeY));
    
    // Create a virtual text grid for our ASCII display
    const textGrid = Array(gridRows).fill().map(() => Array(gridCols).fill(" "));
    
    // Mark positions for background dots (every other grid cell)
    for (let row = 0; row < gridRows; row += 2) {
      for (let col = 0; col < gridCols; col += 2) {
        textGrid[row][col] = "▪";
      }
    }

    // Example pixel grid (replace with actual data)
    const pixels = [
      [1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1],
    ];

    // Calculate centered position for the pixel grid
    const centerRow = Math.floor(gridRows / 2) - Math.floor(pixels.length / 2);
    const centerCol = Math.floor(gridCols / 2) - Math.floor(pixels[0].length / 2);

    // Place pixels in the grid
    pixels.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        if (value) {
          const gridRow = centerRow + rowIndex;
          const gridCol = centerCol + colIndex;
          
          // Make sure we're within grid bounds
          if (gridRow >= 0 && gridRow < gridRows && gridCol >= 0 && gridCol < gridCols) {
            textGrid[gridRow][gridCol] = "■";
          }
        }
      });
    });

    // Add location name at the top
    const name = `<${selectedLocation.name}>`;
    const nameStartCol = Math.floor(gridCols / 2) - Math.floor(name.length / 2);
    const nameRow = centerRow - 2;
    
    if (nameRow >= 0) {
      for (let i = 0; i < name.length; i++) {
        const col = nameStartCol + i;
        if (col >= 0 && col < gridCols) {
          textGrid[nameRow][col] = name[i];
        }
      }
    }
    
    // Now draw the entire text grid
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const char = textGrid[row][col];
        if (char !== " ") {
          // Set appropriate size and opacity based on character
          if (char === "▪") {
            context.globalAlpha = 0.3;
            context.font = `${Math.min(6, width / 80)}px "ABC Diatype"`;
          } else {
            context.globalAlpha = 1.0;
            context.font = `${Math.min(14, width / 40)}px "ABC Diatype"`;
          }
          
          // Draw the character
          context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text-primary");
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(char, col * gridSizeX + gridSizeX/2, row * gridSizeY + gridSizeY/2);
        }
      }
    }

    context.restore();
  };

  const draw = () => {
    if (viewMode === "map") {
      drawLocationMap();
    } else {
      drawPixelMap();
    }
  };

  const handleClick = (e) => {
    if (!canvasRef.current || !assemblies.length) return;

    // Don't handle canvas clicks in pixel view
    if (viewMode === "pixels") return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const clickX = ((e.clientX - rect.left) * dpr) / dpr;
    const clickY = ((e.clientY - rect.top) * dpr) / dpr;

    // Define the grid size like in the draw functions
    const gridSizeX = Math.min(30, canvas.width / (dpr * 20));
    const gridSizeY = gridSizeX * 1.8;

    // Convert click to grid coordinates
    const clickCol = Math.floor(clickX / gridSizeX);
    const clickRow = Math.floor(clickY / gridSizeY);

    Object.values(locationGroups).forEach((location) => {
      const { x, y } = convertCoordinates(
        location.coordinates.longitude,
        location.coordinates.latitude,
        canvas.width / dpr,
        canvas.height / dpr
      );

      // Snap to grid
      const centerCol = Math.round(x / gridSizeX);
      const centerRow = Math.round(y / gridSizeY);
      
      // Check if click is within the 5x3 box area
      if (
        clickCol >= centerCol - 2 && clickCol <= centerCol + 2 &&
        clickRow >= centerRow - 2 && clickRow <= centerRow + 1
      ) {
        setSelectedLocation(location);
        setViewMode("pixels");
      }
    });
  };

  const handleZoomOut = () => {
    setViewMode("map");
    setSelectedLocation(null);
  };

  // Canvas setup with DPR support
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const handleResize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      canvas.style.width = `${canvas.offsetWidth}px`;
      canvas.style.height = `${canvas.offsetHeight}px`;
      draw();
    };

    setContext(ctx);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (assemblies.length > 0) {
      draw();
    }
  }, [context, assemblies, selectedLocation, viewMode]);

  // Add effect logging
  useEffect(() => {
    console.log("Assemblies received:", assemblies);
  }, [assemblies]);


  return (
    <div className={styles.mapContainer}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onClick={handleClick}
      />
      {viewMode === "pixels" && (
        <button className={styles.zoomOutButton} onClick={handleZoomOut} aria-label="Zoom back out to full map view">
          [ZOOM BACK OUT]
        </button>
      )}
    </div>
  );
};

export default Map;
