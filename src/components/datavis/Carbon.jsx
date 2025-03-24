import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import styles from "./Carbon.module.css";
import Button from "../../widgets/Button";
const Carbon = () => {
  const svgRef = useRef(null);
  const [xAxisMetric, setXAxisMetric] = useState("age"); // Default to age
  const [selection, setSelection] = useState(null); // Track selection coordinates
  const [selectedPoints, setSelectedPoints] = useState([]); // Track points in selection
  const [isDragging, setIsDragging] = useState(false); // Track if user is dragging
  const [pixelData, setPixelData] = useState([]); // Store the fetched pixel data
  const [showJitter, setShowJitter] = useState(true); // New state to toggle jitter
  const [jitteredPositions, setJitteredPositions] = useState({}); // Store positions of jittered points

  // Fetch pixel data
  useEffect(() => {
    const fetchPixelData = async () => {
      try {
        const response = await fetch("/data/bank/pixel/pixels.json");
        const data = await response.json();

        // Process the data to calculate age
        const currentDate = new Date();
        const processedData = data.pixels.map((pixel) => {
          // Calculate age in years based on date_of_manufacture
          const manufactureYear = parseInt(pixel.date_of_manufacture);
          const currentYear = currentDate.getFullYear();
          const age = currentYear - manufactureYear;

          return {
            ...pixel,
            age,
            emissions: pixel.total_emissions,
            distanceTraveled: pixel.distance_traveled,
          };
        });

        setPixelData(processedData);
      } catch (error) {
        console.error("Error fetching pixel data:", error);
      }
    };

    fetchPixelData();
  }, []);

  useEffect(() => {
    if (!svgRef.current || pixelData.length === 0) return;

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    // Grid configuration
    const gridSize = 300;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = gridSize;
    const height = gridSize * 2; // Double the height

    // Define grid dimensions
    const gridCellsX = 24;
    const gridCellsY = 30; // Double the number of cells on y-axis (was 15)

    // Calculate cell size to ensure squares (use the smaller dimension)
    const cellSize = Math.min(width / gridCellsX, height / gridCellsY);

    // Recalculate actual grid width and height based on cell size
    const actualGridWidth = cellSize * gridCellsX;
    const actualGridHeight = cellSize * gridCellsY;

    // Find max values for scales
    const maxAge = Math.max(...pixelData.map((d) => d.age), 5);
    const maxEmissions = Math.max(...pixelData.map((d) => d.emissions), 15);
    const maxDistance = Math.max(...pixelData.map((d) => d.distanceTraveled), 10000);

    // Count the maximum number of points in any single grid cell for scaling
    const pointCounts = {};
    pixelData.forEach((d) => {
      const x = xAxisMetric === "age" ? d.age : d.distanceTraveled;
      const y = d.emissions;
      const key = `${Math.round(x)}-${Math.round(y * 10)}`;
      pointCounts[key] = (pointCounts[key] || 0) + 1;
    });
    const maxPointsInCell = Math.max(...Object.values(pointCounts), 1);

    // Adjust domain padding based on point density
    const xPadding = maxPointsInCell > 20 ? 0 : 0.15;
    const yPadding = maxPointsInCell > 20 ? 0 : 0.15;

    // Set domain based on selected metric with dynamic padding
    const xDomain = xAxisMetric === "age" ? [0, maxAge * (1 + xPadding)] : [0, maxDistance * (1 + xPadding)];

    // Create scales with adjusted domains
    const xScale = d3.scaleLinear().domain(xDomain).range([0, actualGridWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, maxEmissions * (1 + yPadding)])
      .range([actualGridHeight, 0]);

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", actualGridWidth + margin.left + margin.right)
      .attr("height", actualGridHeight + margin.top + margin.bottom)
      .style("background-color", "var(--accent-light)")
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Draw grid
    const gridLines = svg.append("g").attr("class", "grid-lines");

    // Vertical grid lines
    gridLines
      .selectAll(".vertical-line")
      .data(d3.range(0, gridCellsX + 1))
      .enter()
      .append("line")
      .attr("class", "vertical-line")
      .attr("x1", (d) => d * cellSize)
      .attr("y1", 0)
      .attr("x2", (d) => d * cellSize)
      .attr("y2", actualGridHeight)
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1);

    // Horizontal grid lines
    gridLines
      .selectAll(".horizontal-line")
      .data(d3.range(0, gridCellsY + 1))
      .enter()
      .append("line")
      .attr("class", "horizontal-line")
      .attr("x1", 0)
      .attr("y1", (d) => d * cellSize)
      .attr("x2", actualGridWidth)
      .attr("y2", (d) => d * cellSize)
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1);

    // Group data points by their position on the grid
    const groupedData = {};
    const newJitteredPositions = {}; // Will store all jittered positions

    if (showJitter) {
      // Group points by grid cell
      pixelData.forEach((d) => {
        const x = xScale(xAxisMetric === "age" ? d.age : d.distanceTraveled);
        const y = yScale(d.emissions);

        // Snap to grid - find the nearest grid cell center
        const gridX = Math.floor(x / cellSize);
        const gridY = Math.floor(y / cellSize);

        // Calculate the center of the grid cell
        const cellCenterX = gridX * cellSize + cellSize / 2;
        const cellCenterY = gridY * cellSize + cellSize / 2;

        // Create a grid cell identifier
        const cellId = `${gridX}-${gridY}`;

        if (!groupedData[cellId]) {
          groupedData[cellId] = {
            x: cellCenterX,
            y: cellCenterY,
            gridX: gridX,
            gridY: gridY,
            points: [],
          };
        }

        groupedData[cellId].points.push(d);
      });

      // Draw the grouped data with jitter
      Object.values(groupedData).forEach((group) => {
        const { x, y, gridX, gridY, points } = group;

        // Size the points to fit within grid cells
        // Make the circle 60% of the cell size
        const circleSize = cellSize * 0.6;

        // Draw the first point as a circle at the grid cell center
        svg
          .append("circle")
          .attr("class", "data-point primary")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", circleSize / 2)
          .attr("fill", "black")
          .attr("stroke", "transparent")
          .attr("stroke-width", 1)
          .attr("data-count", points.length);

        // Store the primary point position
        points.forEach((point, idx) => {
          if (idx === 0) {
            // First point is at the circle position
            newJitteredPositions[point.serial] = { x, y, isCircle: true };
          }
        });

        // If there are additional points, draw them as squares in surrounding grid cells
        if (points.length > 1) {
          // Calculate how many points we need to draw
          const pointsToDrawCount = points.length - 1;

          // Keep track of all occupied grid cells across the entire visualization
          const globalOccupiedCells = new Set();

          // Mark cells as occupied from all groups
          Object.values(groupedData).forEach((g) => {
            globalOccupiedCells.add(`${g.gridX}-${g.gridY}`);
          });

          // Find valid grid cells using a cellular automata-like expansion
          const validCells = [];

          // Start with the center cell's neighbors
          let frontierCells = [
            [gridX - 1, gridY - 1],
            [gridX, gridY - 1],
            [gridX + 1, gridY - 1],
            [gridX - 1, gridY],
            [gridX + 1, gridY],
            [gridX - 1, gridY + 1],
            [gridX, gridY + 1],
            [gridX + 1, gridY + 1],
          ];

          // Keep expanding until we have enough cells or no more frontier
          while (validCells.length < pointsToDrawCount && frontierCells.length > 0) {
            const newFrontier = [];

            // Process current frontier
            frontierCells.forEach((cell) => {
              const [cellX, cellY] = cell;

              // Check if the cell is within bounds
              if (cellX >= 0 && cellX < gridCellsX && cellY >= 0 && cellY < gridCellsY) {
                const cellId = `${cellX}-${cellY}`;

                // Check if the cell is not already occupied
                if (!globalOccupiedCells.has(cellId)) {
                  validCells.push({
                    gridX: cellX,
                    gridY: cellY,
                    cellId: cellId,
                  });

                  // Mark as occupied
                  globalOccupiedCells.add(cellId);

                  // Add neighbors to new frontier (4-connected)
                  newFrontier.push([cellX - 1, cellY], [cellX + 1, cellY], [cellX, cellY - 1], [cellX, cellY + 1]);

                  // Also add diagonals (8-connected)
                  newFrontier.push(
                    [cellX - 1, cellY - 1],
                    [cellX + 1, cellY - 1],
                    [cellX - 1, cellY + 1],
                    [cellX + 1, cellY + 1]
                  );
                }
              }
            });

            // Update frontier for next iteration
            frontierCells = newFrontier;

            // Break if we have enough cells
            if (validCells.length >= pointsToDrawCount) {
              break;
            }
          }

          // If we still don't have enough cells, search the entire grid
          if (validCells.length < pointsToDrawCount) {
            // Scan the entire grid for any available cells
            for (let i = 0; i < gridCellsX; i++) {
              for (let j = 0; j < gridCellsY; j++) {
                const cellId = `${i}-${j}`;

                if (!globalOccupiedCells.has(cellId)) {
                  validCells.push({
                    gridX: i,
                    gridY: j,
                    cellId: cellId,
                  });

                  globalOccupiedCells.add(cellId);

                  // Break if we have enough cells
                  if (validCells.length >= pointsToDrawCount) {
                    break;
                  }
                }
              }

              if (validCells.length >= pointsToDrawCount) {
                break;
              }
            }
          }

          // Sort valid cells by distance from the center cell
          validCells.sort((a, b) => {
            const distA = Math.sqrt(Math.pow(a.gridX - gridX, 2) + Math.pow(a.gridY - gridY, 2));
            const distB = Math.sqrt(Math.pow(b.gridX - gridX, 2) + Math.pow(b.gridY - gridY, 2));
            return distA - distB;
          });

          // Draw squares in valid grid cells
          validCells.slice(0, pointsToDrawCount).forEach((cell, i) => {
            if (i < points.length - 1) {
              // Ensure we have enough points
              const pointIndex = i + 1; // +1 because first point is the circle
              const point = points[pointIndex];

              // Calculate the center of the grid cell
              const cellCenterX = cell.gridX * cellSize + cellSize / 2;
              const cellCenterY = cell.gridY * cellSize + cellSize / 2;

              // Make squares 80% of the cell size
              const squareSize = cellSize * 0.8;
              const squareX = cellCenterX - squareSize / 2;
              const squareY = cellCenterY - squareSize / 2;

              svg
                .append("rect")
                .attr("class", "data-point secondary")
                .attr("x", squareX)
                .attr("y", squareY)
                .attr("width", squareSize)
                .attr("height", squareSize)
                .attr("fill", "black")
                .attr("stroke", "transparent")
                .attr("stroke-width", 1);

              // Store the square position
              newJitteredPositions[point.serial] = {
                x: cellCenterX,
                y: cellCenterY,
                size: squareSize,
                isCircle: false,
              };
            }
          });

          // If we still couldn't draw all points (which should be impossible now), add a count label
          if (validCells.length < pointsToDrawCount) {
            svg
              .append("text")
              .attr("x", x)
              .attr("y", y)
              .attr("text-anchor", "middle")
              .attr("dominant-baseline", "central")
              .attr("fill", "white")
              .attr("font-size", `${circleSize * 0.6}px`)
              .attr("font-weight", "bold")
              .text(points.length);
          }
        }
      });

      // Update the jittered positions state
      setJitteredPositions(newJitteredPositions);
    } else {
      // Original visualization without jitter
      svg
        .selectAll(".data-point")
        .data(pixelData)
        .enter()
        .append("rect")
        .attr("class", "data-point")
        .attr("x", (d) => xScale(xAxisMetric === "age" ? d.age : d.distanceTraveled))
        .attr("y", (d) => yScale(d.emissions))
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("fill", "black");

      // Clear jittered positions when not using jitter
      setJitteredPositions({});
    }

    // Only add text labels for selected points
    if (selection && selectedPoints.length > 0) {
      svg
        .selectAll(".data-label")
        .data(selectedPoints)
        .enter()
        .append("text")
        .attr("class", "data-label")
        .attr("x", (d) => xScale(xAxisMetric === "age" ? d.age : d.distanceTraveled) + cellSize / 2)
        .attr("y", (d) => yScale(d.emissions) - 5) // Position above the square
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "bottom")
        .attr("fill", "black")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text((d) => d.serial);
    }

    // Add X axis with fewer ticks
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(6) // Reduced from 12 to 6
      .tickFormat((d) => (xAxisMetric === "age" ? `${d}y` : `${d}`));

    svg.append("g").attr("transform", `translate(0, ${actualGridHeight})`).call(xAxis);

    // Add X axis label
    svg
      .append("text")
      .attr("x", actualGridWidth / 2)
      .attr("y", actualGridHeight + 40)
      .attr("text-anchor", "middle")
      .text(xAxisMetric === "age" ? "Age (years)" : "Distance Traveled (km)");

    // Add Y axis with fewer ticks
    const yAxis = d3.axisLeft(yScale).ticks(8); // Reduced from 15 to 8

    svg.append("g").call(yAxis);

    // Add Y axis label
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -actualGridHeight / 2)
      .attr("text-anchor", "middle")
      .text("Carbon Emissions (kg CO2e)");

    // Draw selection highlight if exists
    if (selection) {
      // Use the same cellSize for the selection highlight to ensure squares
      const selectionSize = cellSize * 3;

      // Position the highlight centered on the selection point
      const highlightX = selection.x - selectionSize / 2;
      const highlightY = selection.y - selectionSize / 2;

      svg
        .append("rect")
        .attr("class", `selection-highlight ${styles.selectionHighlight}`)
        .attr("x", highlightX)
        .attr("y", highlightY)
        .attr("width", selectionSize)
        .attr("height", selectionSize)
        .attr("stroke-width", 2);

      // Update the style of selected points to be white
      svg.selectAll(".data-point").classed(styles.selectedPoint, function (d) {
        // Check if d is defined and has a serial property
        if (!d || typeof d !== "object") return false;

        // For primary visualization without jitter
        if (!showJitter && d.serial) {
          return selectedPoints.some((p) => p.serial === d.serial);
        }

        // For jittered visualization
        // The data bound to elements might be different depending on how they were created
        // Try to match by serial if available, otherwise return false
        return d.serial ? selectedPoints.some((p) => p.serial === d.serial) : false;
      });
    }

    // Function to update selection and find points within it
    const updateSelection = (mouseX, mouseY) => {
      // Set the selection point
      setSelection({ x: mouseX, y: mouseY });

      // Calculate the bounds of the selection area
      const selectionMinX = mouseX - cellSize * 1.5;
      const selectionMaxX = mouseX + cellSize * 1.5;
      const selectionMinY = mouseY - cellSize * 1.5;
      const selectionMaxY = mouseY + cellSize * 1.5;

      if (showJitter) {
        // For jittered visualization, check which points have jittered positions in the selection area
        const pointsInSelection = pixelData.filter((point) => {
          const jitteredPos = newJitteredPositions[point.serial];

          // If we have a jittered position for this point
          if (jitteredPos) {
            return (
              jitteredPos.x >= selectionMinX &&
              jitteredPos.x <= selectionMaxX &&
              jitteredPos.y >= selectionMinY &&
              jitteredPos.y <= selectionMaxY
            );
          }

          // Fallback to original position if no jittered position
          const pointX = xScale(xAxisMetric === "age" ? point.age : point.distanceTraveled);
          const pointY = yScale(point.emissions);

          return (
            pointX >= selectionMinX && pointX <= selectionMaxX && pointY >= selectionMinY && pointY <= selectionMaxY
          );
        });

        setSelectedPoints(pointsInSelection);
      } else {
        // Original selection logic for non-jittered visualization
        const pointsInSelection = pixelData.filter((d) => {
          const pointX = xScale(xAxisMetric === "age" ? d.age : d.distanceTraveled);
          const pointY = yScale(d.emissions);

          return (
            pointX >= selectionMinX && pointX <= selectionMaxX && pointY >= selectionMinY && pointY <= selectionMaxY
          );
        });

        setSelectedPoints(pointsInSelection);
      }
    };

    // Add interaction area for mouse/touch events
    const interactionArea = svg
      .append("rect")
      .attr("class", "interaction-area")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", actualGridWidth)
      .attr("height", actualGridHeight)
      .attr("fill", "transparent")
      .style("cursor", "pointer");

    // Add mouse/touch event handlers
    interactionArea
      .on("mousedown", function (event) {
        const [mouseX, mouseY] = d3.pointer(event);
        setIsDragging(true);
        updateSelection(mouseX, mouseY);
      })
      .on("touchstart", function (event) {
        event.preventDefault();
        const touch = event.touches[0];
        const [touchX, touchY] = d3.pointer(touch);
        setIsDragging(true);
        updateSelection(touchX, touchY);
      })
      .on("mousemove", function (event) {
        if (!isDragging) return;
        const [mouseX, mouseY] = d3.pointer(event);
        updateSelection(mouseX, mouseY);
      })
      .on("touchmove", function (event) {
        if (!isDragging) return;
        event.preventDefault();
        const touch = event.touches[0];
        const [touchX, touchY] = d3.pointer(touch);
        updateSelection(touchX, touchY);
      })
      .on("mouseup", function () {
        setIsDragging(false);
      })
      .on("touchend", function () {
        setIsDragging(false);
      })
      .on("mouseleave", function () {
        setIsDragging(false);
      });

    // Add event listeners to document to handle cases where mouse up occurs outside the SVG
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchend", handleMouseUp);

    // Cleanup event listeners when component unmounts
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, [xAxisMetric, selection, selectedPoints, isDragging, pixelData, showJitter]);

  const handleToggleXAxis = () => {
    setXAxisMetric((prev) => (prev === "age" ? "distance" : "age"));
    // Clear selection when changing axis
    setSelection(null);
    setSelectedPoints([]);
  };

  const handleToggleJitter = () => {
    setShowJitter((prev) => !prev);
  };

  return (
    <div className={styles.container}>
      <svg ref={svgRef} className={styles.svg}></svg>
      <div className={styles.buttonContainer}>
        <Button onClick={handleToggleXAxis}>X axis: {xAxisMetric === "age" ? "[Age]" : "[Distance]"}</Button>
        <Button onClick={handleToggleJitter}>{showJitter ? "Hide" : "Show"} Jitter</Button>
      </div>

      {selectedPoints.length > 0 && (
        <div className={styles.selectedInfo}>
          <h3>Selected Pixels</h3>
          <ul className={styles.selectedList}>
            {selectedPoints.map((point, index) => (
              <li key={index} className={styles.selectedItem}>
                Serial: {point.serial}, Age: {point.age}y, Emissions: {point.emissions.toFixed(2)} kg CO2e, Distance:{" "}
                {point.distanceTraveled.toFixed(0)} km, Generation: {point.generation}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Carbon;
