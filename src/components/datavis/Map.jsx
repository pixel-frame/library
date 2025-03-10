import React, { useEffect, useRef, useState } from "react";
import styles from "./Map.module.css";

const Map = ({ mode }) => {
  const canvasRef = useRef(null);
  const [context, setContext] = useState(null);
  const [assemblies, setAssemblies] = useState([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
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

  const convertCoordinates = (long, lat, canvasWidth, canvasHeight) => {
    const centerLong = -60;
    const centerLat = 45;
    const longScale = 2.5;
    const latScale = 4.5;

    // Center the map by offsetting by half the canvas dimensions
    const x = (((long - centerLong) * longScale + 180) / 360) * canvasWidth;
    const y = ((90 - (lat - centerLat) * latScale) / 180) * canvasHeight;

    return {
      x: x - canvasWidth / 4,
      y: y - canvasHeight / 4,
    };
  };

  const drawLocationMap = () => {
    if (!context || !canvasRef.current || !assemblies.length) return;

    const canvas = canvasRef.current;
    const { width, height } = canvas;
    const dpr = window.devicePixelRatio || 1;

    context.clearRect(0, 0, width, height);
    context.save();

    context.scale(dpr, dpr);
    context.translate(pan.x, pan.y);

    // Draw ASCII-style grid
    context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--text-primary");
    context.lineWidth = 0.5;
    const gridSize = Math.min(50, width / 10);

    // Draw vertical lines with ASCII characters
    for (let x = 0; x < width; x += gridSize) {
      context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text-primary");
      context.textAlign = "center";
      context.textBaseline = "top";
      for (let y = 0; y < height; y += gridSize) {
        context.fillText(".", x, y);
      }
    }

    // Draw locations
    Object.values(locationGroups).forEach((location) => {
      const { x, y } = convertCoordinates(
        location.coordinates.longitude,
        location.coordinates.latitude,
        width / dpr,
        height / dpr
      );

      const markerSize = Math.min(15, width / dpr / 30);

      // Draw ASCII-style marker
      context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text-primary");
      context.font = `${Math.min(14, width / 40)}px "ABC Diatype"`;
      context.textAlign = "center";
      context.textBaseline = "middle";

      // ASCII box around the number
      context.fillText(`+---+`, x, y - markerSize);
      context.fillText(`|${location.assemblies.length}|`, x, y);
      context.fillText(`+---+`, x, y + markerSize);

      // Location name
      context.font = `${Math.min(12, width / 45)}px "ABC Diatype"`;
      context.fillText(`${location.name}`, x, y + markerSize * 2);
    });

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
    context.translate(pan.x, pan.y);

    // Draw ASCII-style grid first
    context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--text-primary");
    context.lineWidth = 0.5;
    const gridSize = Math.min(30, width / (dpr * 20));

    // Draw grid dots
    for (let x = 0; x < width / dpr; x += gridSize) {
      for (let y = 0; y < height / dpr; y += gridSize) {
        context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text-primary");
        context.textAlign = "center";
        context.textBaseline = "top";
        context.fillText(".", x, y);
      }
    }

    // Example pixel grid (replace with actual data)
    const pixelSize = gridSize;
    const pixels = [
      [1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1],
    ];

    const offsetX = (width / dpr - pixels[0].length * pixelSize) / 2;
    const offsetY = (height / dpr - pixels.length * pixelSize) / 2;

    pixels.forEach((row, y) => {
      row.forEach((x, value) => {
        context.fillStyle = value
          ? getComputedStyle(document.documentElement).getPropertyValue("--text-primary")
          : getComputedStyle(document.documentElement).getPropertyValue("--background-secondary");
        context.fillRect(offsetX + x * pixelSize, offsetY + y * pixelSize, pixelSize - 1, pixelSize - 1);
      });
    });

    // Draw location name with theme color
    context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text-primary");
    context.font = `${Math.min(16, width / (dpr * 30))}px "ABC Diatype"`;
    context.textAlign = "center";
    context.fillText(`<${selectedLocation.name}>`, width / (2 * dpr), offsetY - pixelSize);

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

    const clickX = ((e.clientX - rect.left) * dpr - pan.x * dpr) / dpr;
    const clickY = ((e.clientY - rect.top) * dpr - pan.y * dpr) / dpr;

    Object.values(locationGroups).forEach((location) => {
      const { x, y } = convertCoordinates(
        location.coordinates.longitude,
        location.coordinates.latitude,
        canvas.width / dpr,
        canvas.height / dpr
      );

      const markerSize = Math.min(15, canvas.width / (30 * dpr));
      if (
        clickX >= x - markerSize &&
        clickX <= x + markerSize &&
        clickY >= y - markerSize &&
        clickY <= y + markerSize
      ) {
        setSelectedLocation(location);
        setViewMode("pixels");
        setPan({ x: 0, y: 0 });
      }
    });
  };

  const handleZoomOut = () => {
    setViewMode("map");
    setSelectedLocation(null);
    setPan({ x: 0, y: 0 });
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
  }, [context, pan, assemblies, selectedLocation, viewMode]);

  // Add effect logging
  useEffect(() => {
    console.log("Assemblies received:", assemblies);
  }, [assemblies]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newPan = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };
    setPan(newPan);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch event handlers
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDragging) return;
    const touch = e.touches[0];
    const newPan = {
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    };
    setPan(newPan);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className={styles.mapContainer}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
