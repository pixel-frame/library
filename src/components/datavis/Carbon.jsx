import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import styles from "./Carbon.module.css";
import Button from "../../widgets/Button";
import SparkLine from "./SparkLine";

const Carbon = ({ highlightedPoint }) => {
  const svgRef = useRef(null);
  const [xAxisMetric, setXAxisMetric] = useState("age"); // Default to age
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
    const containerWidth = svgRef.current.parentElement.clientWidth;
    const margin = { top: 0, right: 15, bottom: 4, left: 15 };
    const width = containerWidth - margin.left - margin.right;
    // Adjust height calculation for mobile
    const height = Math.min(window.innerHeight * 0.5, width * 1.2);

    // Grid configuration

    const gridCellsX = 20;
    const gridCellsY = 18; // Double the number of cells on y-axis (was 15)

    // Calculate cell size to ensure squares (use the smaller dimension)
    const cellSize = Math.min(width / gridCellsX, height / gridCellsY);

    // Recalculate actual grid width and height based on cell size
    const actualGridWidth = cellSize * gridCellsX;
    const actualGridHeight = cellSize * gridCellsY;

    // Find max values for scales
    const maxAge = Math.max(...pixelData.map((d) => d.age), 4);
    const maxEmissions = Math.max(...pixelData.map((d) => d.emissions), 6);
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
      .attr(
        "viewBox",
        `0 0 ${actualGridWidth + margin.left + margin.right} ${actualGridHeight + margin.top + margin.bottom}`
      )
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("background-color", "var(--accent-light)")
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
    // Draw grid
    const gridLines = svg.append("g").attr("class", "grid-lines");

    // Add resize handler

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
      .attr("stroke", "#e6e6e6")
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
      .attr("stroke", "#e6e6e6")
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
        const circleSize = cellSize * 0.6;

        // Draw the first point as a circle with highlight check
        const primaryPoint = points[0];
        const isPrimaryHighlighted = highlightedPoint && primaryPoint.serial === highlightedPoint.serial;

        svg
          .append("circle")
          .attr("class", "data-point primary")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", circleSize / 2)
          .attr("fill", isPrimaryHighlighted ? "blue" : "black")
          .attr("stroke", isPrimaryHighlighted ? "blue" : "transparent")
          .attr("stroke-width", isPrimaryHighlighted ? 2 : 1)
          .attr("data-count", points.length)
          .attr("data-serial", primaryPoint.serial);

        // Store the primary point position
        newJitteredPositions[primaryPoint.serial] = { x, y, isCircle: true };

        // If there are additional points, draw them as squares
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
              const pointIndex = i + 1;
              const point = points[pointIndex];
              const isHighlighted = highlightedPoint && point.serial === highlightedPoint.serial;

              const cellCenterX = cell.gridX * cellSize + cellSize / 2;
              const cellCenterY = cell.gridY * cellSize + cellSize / 2;

              // Add white square background
              svg
                .append("rect")
                .attr("class", "data-point-background")
                .attr("x", cellCenterX - cellSize * 0.5)
                .attr("y", cellCenterY - cellSize * 0.5)
                .attr("width", cellSize * 1)
                .attr("height", cellSize * 1)
                .attr("fill", isHighlighted ? "black" : "transparent")
                .attr("data-serial", point.serial);

              svg
                .append("text")
                .attr("class", "data-point secondary")
                .attr("x", cellCenterX)
                .attr("y", cellCenterY)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .attr("font-size", `${cellSize * 0.55}px`)
                .attr("fill", isHighlighted ? "white" : "black")
                .attr("data-serial", point.serial)
                .text(point.pixel_number);

              // Store the text position
              newJitteredPositions[point.serial] = {
                x: cellCenterX,
                y: cellCenterY,
                isCircle: false,
                isText: true,
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
        .attr("fill", (d) => (highlightedPoint && d.serial === highlightedPoint.serial ? "var(--accent)" : "black"))
        .attr("stroke", (d) => (highlightedPoint && d.serial === highlightedPoint.serial ? "black" : "transparent"))
        .attr("stroke-width", (d) => (highlightedPoint && d.serial === highlightedPoint.serial ? 2 : 1))
        .attr("data-serial", (d) => d.serial);

      // Clear jittered positions when not using jitter
      setJitteredPositions({});
    }

    // Add X axis with fewer ticks
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(4)
      .tickFormat((d) => (d === 0 ? "" : xAxisMetric === "age" ? `${d}y` : `${d}`))
      .tickSize(0);

    svg
      .append("g")
      .attr("transform", `translate(0, ${actualGridHeight})`)
      .call(xAxis)
      .call((g) => g.select(".domain").remove());

    // Add X axis label
    svg
      .append("text")
      .attr("x", actualGridWidth)
      .attr("y", actualGridHeight + 40)
      .attr("text-anchor", "end")
      .attr("font-size", "0.6em")
      .text(xAxisMetric === "age" ? "Age (years)" : "Distance Traveled (km)");

    // Add Y axis with fewer ticks
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(4)
      .tickFormat((d) => (d === 0 ? "" : d))
      .tickSize(0);

    svg
      .append("g")
      .call(yAxis)
      .call((g) => g.select(".domain").remove());

    // Add Y axis label
    svg
      .append("text")
      .attr("y", actualGridHeight + 40)
      .attr("x", 0)
      .attr("text-anchor", "start")
      .attr("font-size", "0.6em")
      .text("Carbon Emissions (kg CO2e)");

    // Update highlighted point styling
    svg.selectAll(".data-point").classed(styles.highlightedPoint, function (d) {
      if (!d || !highlightedPoint) return false;

      // Match by serial number
      const pointSerial = d.serial || d.pixel_number;
      const highlightSerial = highlightedPoint.serial || highlightedPoint.pixel_number;

      return pointSerial === highlightSerial;
    });

    // Helper function to get correct coordinates from event
    const getEventCoordinates = (event) => {
      const svgElement = svgRef.current;
      const bbox = svgElement.getBoundingClientRect();
      const point = svgElement.createSVGPoint();

      point.x = event.clientX;
      point.y = event.clientY;

      // Transform point to SVG coordinate system
      const ctm = svgElement.getScreenCTM();
      if (ctm) {
        const transformed = point.matrixTransform(ctm.inverse());
        return [transformed.x - margin.left, transformed.y - margin.top];
      }
      return [0, 0];
    };

    // Update interaction area event handlers
    const interactionArea = svg
      .append("rect")
      .attr("class", "interaction-area")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", actualGridWidth)
      .attr("height", actualGridHeight)
      .attr("fill", "transparent");

    // Remove all event handlers and cleanup
    return () => {};
  }, [xAxisMetric, pixelData, showJitter, highlightedPoint]);

  const handleToggleXAxis = () => {
    setXAxisMetric((prev) => (prev === "age" ? "distance" : "age"));
  };

  const handleToggleJitter = () => {
    setShowJitter((prev) => !prev);
  };

  return (
    <div className={styles.container}>
      <svg ref={svgRef} className={styles.svg}></svg>
      <div className={styles.buttonContainer}>
        {/* <Button onClick={handleToggleXAxis}>X axis: {xAxisMetric === "age" ? "[Age]" : "[Distance]"}</Button>
        <Button onClick={handleToggleJitter}>{showJitter ? "Hide" : "Show"} Jitter</Button> */}
      </div>
    </div>
  );
};

export default Carbon;
