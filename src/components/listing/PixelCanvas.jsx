import React, { useEffect, useRef, useState } from "react";
import styles from "./Pixels.module.css";
import "@google/model-viewer";

const PixelCanvas = ({ width = "100%", height = "300px", pixels = [], selectedIndex = null, onPixelClick = null }) => {
  const canvasRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [pixelImages, setPixelImages] = useState([]);
  const [scale, setScale] = useState(1);
  const animationRef = useRef(null);

  // Simpler animation approach with fewer state variables
  const animateToCenterPixel = useRef({
    active: false,
    startPan: { x: 0, y: 0 },
    targetPan: { x: 0, y: 0 },
    startScale: 1,
    targetScale: 1,
    startTime: 0,
    duration: 300, // animation duration in ms
  }).current;

  // Add new state for model position
  const [modelPosition, setModelPosition] = useState(null);

  // Handle selecting a pixel
  useEffect(() => {
    // only proceed if we have pixels and dimensions
    if (!pixelImages.length || canvasDimensions.width === 0) return;

    // cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (selectedIndex !== null) {
      // find the selected pixel image
      const selectedPixelImage = pixelImages.find((img) => img.pixel.serial === pixels[selectedIndex]?.serial);

      if (selectedPixelImage) {
        // set up animation parameters
        animateToCenterPixel.active = true;
        animateToCenterPixel.startPan = { ...pan };

        // for exact centering, we need to reverse our transformation math
        // canvas center is at (width/2, height/2) in screen coordinates
        // we want the pixel at (pixel.x, pixel.y) to end up there

        // to achieve this with our transformation sequence, we need:
        // pan.x = -pixel.x * scale
        // pan.y = -pixel.y * scale

        animateToCenterPixel.targetPan = {
          x: -selectedPixelImage.x * animateToCenterPixel.targetScale,
          y: -selectedPixelImage.y * animateToCenterPixel.targetScale,
        };

        animateToCenterPixel.startScale = scale;
        animateToCenterPixel.targetScale = 1.5;
        animateToCenterPixel.startTime = performance.now();

        // start the animation
        animationRef.current = requestAnimationFrame(animateFrame);
      }
    } else {
      // reset to default when no pixel is selected
      animateToCenterPixel.active = true;
      animateToCenterPixel.startPan = { ...pan };
      animateToCenterPixel.targetPan = { x: 0, y: 0 };
      animateToCenterPixel.startScale = scale;
      animateToCenterPixel.targetScale = 1;
      animateToCenterPixel.startTime = performance.now();

      // start the animation
      animationRef.current = requestAnimationFrame(animateFrame);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [selectedIndex, pixelImages, pixels, canvasDimensions]);

  // Simplified animation function with easeInOutCubic easing
  const animateFrame = (timestamp) => {
    if (!animateToCenterPixel.active) {
      animationRef.current = null;
      return;
    }

    const elapsed = timestamp - animateToCenterPixel.startTime;
    const progress = Math.min(elapsed / animateToCenterPixel.duration, 1);

    // apply easing function (easeInOutCubic)
    const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    // calculate current values
    const newPan = {
      x: animateToCenterPixel.startPan.x + (animateToCenterPixel.targetPan.x - animateToCenterPixel.startPan.x) * eased,
      y: animateToCenterPixel.startPan.y + (animateToCenterPixel.targetPan.y - animateToCenterPixel.startPan.y) * eased,
    };

    const newScale =
      animateToCenterPixel.startScale + (animateToCenterPixel.targetScale - animateToCenterPixel.startScale) * eased;

    // update state
    setPan(newPan);
    setScale(newScale);

    // continue or end animation
    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animateFrame);
    } else {
      // ensure we end at exactly the target values
      setPan(animateToCenterPixel.targetPan);
      setScale(animateToCenterPixel.targetScale);
      animateToCenterPixel.active = false;
      animationRef.current = null;
    }
  };

  // Call drawGrid when component updates with new images
  useEffect(() => {
    if (pixelImages.length > 0) {
      drawGrid();
    }
  }, [pixelImages]);

  // Also call drawGrid when pan changes
  useEffect(() => {
    drawGrid();
  }, [pan]);

  // Ensure drawGrid is called after canvas is resized
  useEffect(() => {
    if (canvasDimensions.width > 0) {
      drawGrid();
    }
  }, [canvasDimensions]);

  // Set up canvas and handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    // Set canvas dimensions accounting for device pixel ratio
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // Store actual canvas dimensions for pan boundary calculations
      setCanvasDimensions({
        width: rect.width,
        height: rect.height,
      });
    };

    // Initial size setup
    updateCanvasSize();

    // Handle resize
    window.addEventListener("resize", updateCanvasSize);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  // Load pixel images
  useEffect(() => {
    if (!pixels.length || !canvasDimensions.width) return;

    const loadedImages = [];
    const panExtension = canvasDimensions.width / 3;

    // Calculate the full pannable area dimensions
    const totalWidth = canvasDimensions.width + 2 * panExtension;
    const totalHeight = canvasDimensions.height + 2 * panExtension;

    // Load all images and track completion
    let loadedCount = 0;
    const totalToLoad = pixels.length;

    // Shuffle pixels to randomize load order
    const shuffledPixels = [...pixels].sort(() => Math.random() - 0.5);

    shuffledPixels.forEach((pixel, index) => {
      const img = new Image();
      const pixelNumber = pixel.number || pixel.serial;

      img.src = `data/previews/pixels/model-poster-${pixelNumber}.png`;

      // Generate random positions
      const randomX = Math.random() * totalWidth - panExtension;
      const randomY = Math.random() * totalHeight - panExtension;

      // First loaded: 60px, Last loaded: 80px
      const minSize = 60;
      const maxSize = 80;
      const loadOrderRatio = index / totalToLoad; // 0 for first, 1 for last
      const baseSize = minSize + (maxSize - minSize) * loadOrderRatio;

      // Fallback image
      img.onerror = () => {
        const fallbackImages = [45, 46, 50];
        const randomFallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
        img.src = `data/previews/pixels/model-poster-${randomFallback}.png`;
      };

      // Store image with position and metadata once loaded
      img.onload = () => {
        loadedCount++;

        // Calculate proportional dimensions
        let width, height;
        const aspectRatio = img.naturalWidth / img.naturalHeight;

        if (aspectRatio >= 1) {
          // Wider than tall
          width = baseSize;
          height = baseSize / aspectRatio;
        } else {
          // Taller than wide
          height = baseSize;
          width = baseSize * aspectRatio;
        }

        loadedImages.push({
          img,
          x: randomX,
          y: randomY,
          width: width,
          height: height,
          pixel,
          loadOrder: index,
        });

        if (loadedCount === totalToLoad || loadedCount % 10 === 0) {
          setPixelImages([...loadedImages]);
          drawGrid();
        }
      };
    });
  }, [pixels, canvasDimensions.width, canvasDimensions.height]);

  const drawGrid = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    context.clearRect(0, 0, width, height);

    // Set up transformation
    context.save();

    // Transformation sequence puts the origin at canvas center
    // Then applies scale, then applies pan
    context.translate(width / 2, height / 2);
    context.scale(scale * dpr, scale * dpr);
    context.translate(pan.x / scale, pan.y / scale);

    // Determine the size of the grid area based on pixel distribution
    // First, find the min/max coordinates of all pixels to ensure the grid covers them
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    pixelImages.forEach((pixelItem) => {
      const halfWidth = pixelItem.width / 2;
      const halfHeight = pixelItem.height / 2;

      minX = Math.min(minX, pixelItem.x - halfWidth);
      maxX = Math.max(maxX, pixelItem.x + halfWidth);
      minY = Math.min(minY, pixelItem.y - halfHeight);
      maxY = Math.max(maxY, pixelItem.y + halfHeight);
    });

    // Add padding around the pixels
    const padding = Math.max(canvasDimensions.width, canvasDimensions.height) / 3;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    // Make sure valid coordinates even with no pixels
    if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
      const panExtension = canvasDimensions.width / 3;
      minX = -panExtension;
      maxX = canvasDimensions.width + panExtension;
      minY = -panExtension;
      maxY = canvasDimensions.height + panExtension;
    }

    // Calculate the grid area dimensions
    const totalWidth = maxX - minX;
    const totalHeight = maxY - minY;
    const rectLeft = minX;
    const rectTop = minY;

    // Fill background
    context.fillStyle = "rgba(50, 50, 50, 0.1)";
    context.fillRect(rectLeft, rectTop, totalWidth, totalHeight);

    // Setup for grid lines
    const gridSize = 20; // Base grid size for horizontal spacing (X direction)
    context.strokeStyle = "rgba(180, 180, 180, 0.5)";
    context.lineWidth = 0.5 / scale; // Adjust line width for zoom

    // Calculate grid boundaries to cover the entire area
    const startX = Math.floor(rectLeft / gridSize) * gridSize;
    const endX = Math.ceil((rectLeft + totalWidth) / gridSize) * gridSize;

    // Draw vertical grid lines (these define the WIDTH of cells)
    for (let x = startX; x <= endX; x += gridSize) {
      context.beginPath();
      context.moveTo(x, rectTop);
      context.lineTo(x, rectTop + totalHeight);
      context.stroke();
    }

    // For a 2:3 ratio (width:height), if width is defined by gridSize,
    // then height should be 1.5 times larger (3/2 = 1.5)
    // So horizontal lines should be FURTHER apart (not closer)
    const verticalGridSize = gridSize * (3 / 2); // Makes cells taller than wide in 2:3 ratio
    const startY = Math.floor(rectTop / verticalGridSize) * verticalGridSize;
    const endY = Math.ceil((rectTop + totalHeight) / verticalGridSize) * verticalGridSize;

    // Draw horizontal grid lines (these define the HEIGHT of cells)
    for (let y = startY; y <= endY; y += verticalGridSize) {
      context.beginPath();
      context.moveTo(rectLeft, y);
      context.lineTo(rectLeft + totalWidth, y);
      context.stroke();
    }

    // Draw border
    context.strokeStyle = "rgba(200, 200, 200, 0.8)";
    context.lineWidth = 3 / scale;
    context.strokeRect(rectLeft, rectTop, totalWidth, totalHeight);

    // Draw pixel images
    let sortedPixelImages = [...pixelImages].sort((a, b) => a.loadOrder - b.loadOrder);

    // Now find the selected pixel
    const selectedPixelImage =
      selectedIndex !== null
        ? sortedPixelImages.find((img) => img.pixel.serial === pixels[selectedIndex]?.serial)
        : null;

    // If there's a selected pixel, remove it from the array to be drawn last
    if (selectedPixelImage) {
      sortedPixelImages = sortedPixelImages.filter((img) => img.pixel.serial !== selectedPixelImage.pixel.serial);
    }

    // Draw all non-selected pixels first
    sortedPixelImages.forEach((pixelItem) => {
      drawPixelImage(pixelItem, false);
    });

    // Then draw the selected pixel last (on top)
    if (selectedPixelImage) {
      drawPixelImage(selectedPixelImage, true);
    }

    // Helper function to draw a pixel image
    function drawPixelImage(pixelItem, isSelected) {
      const pixel = pixelItem.pixel;
      const isUnavailable = pixel.state === 4;

      // calculate size based on selection status
      let width, height;

      if (isSelected) {
        // scale to 100px while maintaining aspect ratio
        const aspectRatio = pixelItem.width / pixelItem.height;

        if (aspectRatio >= 1) {
          // wider than tall
          width = 100;
          height = 100 / aspectRatio;
        } else {
          // taller than wide
          height = 100;
          width = 100 * aspectRatio;
        }
      } else {
        // use original dimensions
        width = pixelItem.width;
        height = pixelItem.height;
      }

      if (pixelItem.img) {
        // apply opacity based on state and selection
        if (isUnavailable && !isSelected) {
          // reduce opacity only if unavailable AND not selected
          context.globalAlpha = 0.3;
        } else {
          // full opacity for available items or selected items
          context.globalAlpha = 1.0;
        }

        // draw the image with potentially modified dimensions
        context.drawImage(pixelItem.img, pixelItem.x - width / 2, pixelItem.y - height / 2, width, height);

        // draw label for selected pixel
        if (isSelected) {
          const pixelNumber = pixel.number || pixel.serial;

          // determine label dimensions
          const labelPadding = 6;
          const fontSize = 14 / scale;
          const labelText = `PIXEL ${pixelNumber}`;
          const textMetrics = context.measureText(labelText);
          const labelWidth = textMetrics.width + labelPadding * 2;
          const labelHeight = fontSize + labelPadding * 2;

          // position label above the image
          const labelX = pixelItem.x - labelWidth / 2;
          const labelY = pixelItem.y - height / 2 - labelHeight - 5 / scale;

          // draw black background
          context.fillStyle = "black";
          context.fillRect(labelX, labelY, labelWidth, labelHeight);

          // draw white text
          context.fillStyle = "white";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(labelText, pixelItem.x, labelY + labelHeight / 2);
        }

        // DEBUG: selection highlight - comment this block out when not debugging
        if (isSelected) {
          context.strokeStyle = "red";
          context.lineWidth = 3 / scale;
          context.strokeRect(
            pixelItem.x - width / 2 - 5 / scale,
            pixelItem.y - height / 2 - 5 / scale,
            width + 10 / scale,
            height + 10 / scale
          );
        }

        // reset opacity
        context.globalAlpha = 1.0;
      } else {
        // for pixels without valid images, draw a placeholder
        let fillColor;

        if (isUnavailable) {
          // unavailable placeholders
          fillColor = isSelected
            ? "rgba(150, 150, 150, 1.0)" // solid if selected
            : "rgba(150, 150, 150, 0.3)"; // transparent if not
        } else {
          // available placeholders
          fillColor = "rgba(150, 150, 150, 0.6)";
        }

        context.fillStyle = fillColor;
        context.fillRect(pixelItem.x - width / 2, pixelItem.y - height / 2, width, height);

        // draw label for selected pixel (same as above)
        if (isSelected) {
          const pixelNumber = pixel.number || pixel.serial;

          // determine label dimensions
          const labelPadding = 6;
          const fontSize = 14 / scale;
          const fontFamily = "Arial, sans-serif";

          context.font = `${fontSize}px ${fontFamily}`;
          const labelText = `Pixel ${pixelNumber}`;
          const textMetrics = context.measureText(labelText);
          const labelWidth = textMetrics.width + labelPadding * 2;
          const labelHeight = fontSize + labelPadding * 2;

          // position label above the image
          const labelX = pixelItem.x - labelWidth / 2;
          const labelY = pixelItem.y - height / 2 - labelHeight - 5 / scale;

          // draw black background
          context.fillStyle = "black";
          context.fillRect(labelX, labelY, labelWidth, labelHeight);

          // draw white text
          context.fillStyle = "white";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(labelText, pixelItem.x, labelY + labelHeight / 2);
        }

        // selection highlight for placeholders
        if (isSelected) {
          context.strokeStyle = "red";
          context.lineWidth = 3 / scale;
          context.strokeRect(
            pixelItem.x - width / 2 - 5 / scale,
            pixelItem.y - height / 2 - 5 / scale,
            width + 10 / scale,
            height + 10 / scale
          );
        }
      }

      if (isSelected) {
        // Store position for model-viewer
        const screenX = pixelItem.x * scale + canvasDimensions.width / 2 + pan.x;
        const screenY = pixelItem.y * scale + canvasDimensions.height / 2 + pan.y;

        setModelPosition({
          x: screenX,
          y: screenY,
          width: width * scale,
          height: height * scale,
          serial: pixelItem.pixel.serial,
        });
      }
    }

    // DEBUG: crosshair at origin (0,0)
    context.strokeStyle = "red";
    context.lineWidth = 1 / scale;
    context.beginPath();
    context.moveTo(-10, 0);
    context.lineTo(10, 0);
    context.moveTo(0, -10);
    context.lineTo(0, 10);
    context.stroke();

    context.restore();
  };

  const handleMouseDown = (e) => {
    if (e.button === 0) {
      // Left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    // Calculate pan boundaries
    const maxPan = canvasDimensions.width / 3;

    // Calculate new pan position
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;

    // Apply limits - adjust these for zoomed view
    const zoomFactor = 1 + (scale - 1) * 0.8; // Reduce constraint when zoomed
    newX = Math.max(-maxPan * zoomFactor, Math.min(maxPan * zoomFactor, newX));
    newY = Math.max(-maxPan * zoomFactor, Math.min(maxPan * zoomFactor, newY));

    setPan({
      x: newX,
      y: newY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];

    // Calculate pan boundaries
    const maxPan = canvasDimensions.width / 3;

    // Calculate new pan position
    let newX = touch.clientX - dragStart.x;
    let newY = touch.clientY - dragStart.y;

    // Apply limits - adjust these for zoomed view
    const zoomFactor = 1 + (scale - 1) * 0.5; // Reduce constraint when zoomed
    newX = Math.max(-maxPan * zoomFactor, Math.min(maxPan * zoomFactor, newX));
    newY = Math.max(-maxPan * zoomFactor, Math.min(maxPan * zoomFactor, newY));

    setPan({
      x: newX,
      y: newY,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Add click handler for pixels in the canvas
  const handleCanvasClick = (e) => {
    if (isDragging) return; // Don't register clicks during drag

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale - pan.x;
    const y = (e.clientY - rect.top) / scale - pan.y;

    // Check if click hit any pixel
    const clickedPixel = pixelImages.find((pixelItem) => {
      const halfWidth = pixelItem.width / 2;
      const halfHeight = pixelItem.height / 2;

      return (
        x >= pixelItem.x - halfWidth &&
        x <= pixelItem.x + halfWidth &&
        y >= pixelItem.y - halfHeight &&
        y <= pixelItem.y + halfHeight
      );
    });

    if (clickedPixel && onPixelClick) {
      // Find index of this pixel in the original pixels array
      const index = pixels.findIndex((p) => p.serial === clickedPixel.pixel.serial);
      if (index !== -1) {
        onPixelClick(index);
      }
    }
  };

  return (
    <div className={styles.canvasContainer} style={{ width, height, position: "relative" }}>
      <canvas
        ref={canvasRef}
        className={styles.pixelCanvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          width: "100%",
          height: "100%",
          cursor: isDragging ? "grabbing" : "grab",
        }}
      />

      {modelPosition && selectedIndex !== null && !animateToCenterPixel.active && (
        <div
          className={styles.modelViewer}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "160px",
            height: "160px",
            transition: "all 0.3s ease-in-out",
            zIndex: 10,
            opacity: animateToCenterPixel.active ? 0 : 1, // fade out during animation
          }}
        >
          <model-viewer
            src={`/data/models/pixels/Pixel ${parseInt(pixels[selectedIndex].serial)}.glb`}
            alt="3D pixel model"
            shadow-intensity=".1"
            environment-image="neutral"
            camera-orbit="45deg 55deg 2.5m"
            exposure="1.1"
            poster-image={`/data/previews/pixels/model-poster-${parseInt(pixels[selectedIndex].serial)}.png`}
            environment-intensity="1"
            auto-rotate
            camera-controls
            interaction-prompt="none"
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="fixed"
            loading="eager"
            reveal="auto"
            onError={(error) => {
              console.error("Model viewer error:", error);
            }}
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PixelCanvas;
