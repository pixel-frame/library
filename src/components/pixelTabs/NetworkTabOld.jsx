import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import "./NetworkTab.css";

const NetworkTab = ({ pixel, isActive }) => {
  const [allPixels, setAllPixels] = useState([]);
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetch("/data/bank/pixel/pixels.json")
      .then((response) => response.json())
      .then((data) => setAllPixels(data.pixels))
      .catch((error) => console.error("Error fetching pixels data:", error));
  }, []);

  // Add effect to render network when tab becomes active
  useEffect(() => {
    if (isActive && pixel?.timeline && allPixels.length > 0 && svgRef.current && containerRef.current) {
      // Small delay to ensure DOM is ready after tab switch
      setTimeout(() => {
        renderNetwork();
      }, 100);
    }
  }, [isActive, pixel, allPixels]);

  // Original effect for initial render and data changes
  useEffect(() => {
    if (isActive && pixel?.timeline && allPixels.length > 0 && svgRef.current && containerRef.current) {
      requestAnimationFrame(() => {
        renderNetwork();
      });
    }
  }, [pixel, allPixels]);

  // Add window resize listener to ensure diagram stays centered
  useEffect(() => {
    const handleResize = () => {
      if (isActive && pixel?.timeline && allPixels.length > 0 && svgRef.current && containerRef.current) {
        renderNetwork();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isActive, pixel, allPixels]);

  if (!pixel || !pixel.timeline) {
    return <div className="network-tab">No timeline data available.</div>;
  }

  const findRelatedPixels = () => {
    if (!allPixels.length) return [];

    // Remove the slice limit to show all related pixels of the same generation
    return allPixels.filter((p) => p.pixel_number !== pixel.pixel_number && p.generation === pixel.generation);
  };

  const renderNetwork = () => {
    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    // Get container dimensions
    const container = containerRef.current;

    // Set dimensions with better proportions for mobile
    const width = Math.max(container.clientWidth, 300);
    const height = Math.max(width * 1.2, 500);

    // Define grid size - make it consistent
    const gridSize = 20;

    // Calculate grid dimensions
    const gridCols = Math.floor(width / gridSize);
    const gridRows = Math.floor(height / gridSize);

    // Create SVG with proper dimensions
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Add grid background - true grid of lines
    const gridGroup = svg.append("g").attr("class", "grid-background");

    // Add horizontal grid lines
    for (let y = 0; y <= gridRows; y++) {
      gridGroup
        .append("line")
        .attr("x1", 0)
        .attr("y1", y * gridSize)
        .attr("x2", width)
        .attr("y2", y * gridSize)
        .attr("stroke", "#ddd")
        .attr("stroke-width", 0.5);
    }

    // Add vertical grid lines
    for (let x = 0; x <= gridCols; x++) {
      gridGroup
        .append("line")
        .attr("x1", x * gridSize)
        .attr("y1", 0)
        .attr("x2", x * gridSize)
        .attr("y2", height)
        .attr("stroke", "#ddd")
        .attr("stroke-width", 0.5);
    }

    // Add background pattern of slashes
    const patternGroup = svg.append("g").attr("class", "background-pattern");

    // Sort timeline by date
    const sortedTimeline = [...pixel.timeline].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Get related pixels
    const relatedPixels = findRelatedPixels();

    // Calculate center column
    const centerCol = Math.floor(gridCols / 2);

    // Create the main structure
    sortedTimeline.forEach((entry, index) => {
      const rowStart = 5 + index * 10; // Start each assembly group 10 rows apart

      // Add date
      svg
        .append("text")
        .attr("x", 3 * gridSize)
        .attr("y", rowStart * gridSize)
        .attr("text-anchor", "end")
        .attr("font-family", "monospace")
        .attr("font-size", "10px")
        .text(new Date(entry.date).toLocaleDateString());

      // Add horizontal line from date to assembly
      svg
        .append("line")
        .attr("x1", 3 * gridSize)
        .attr("y1", rowStart * gridSize - 5)
        .attr("x2", centerCol * gridSize)
        .attr("y2", rowStart * gridSize - 5)
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "5,5");

      // Add assembly - black square
      svg
        .append("rect")
        .attr("x", centerCol * gridSize - gridSize / 2)
        .attr("y", rowStart * gridSize - gridSize / 2)
        .attr("width", gridSize)
        .attr("height", gridSize)
        .attr("fill", "#000");

      // Add assembly label
      svg
        .append("text")
        .attr("x", centerCol * gridSize)
        .attr("y", (rowStart + 1) * gridSize)
        .attr("text-anchor", "middle")
        .attr("font-family", "monospace")
        .attr("font-size", "10px")
        .attr("fill", "#000")
        .text("Gen " + pixel.generation);

      // Add assembly name
      svg
        .append("text")
        .attr("x", centerCol * gridSize)
        .attr("y", (rowStart + 2) * gridSize)
        .attr("text-anchor", "middle")
        .attr("font-family", "monospace")
        .attr("font-size", "8px")
        .attr("fill", "#000")
        .text(entry.name ? (entry.name.length > 15 ? entry.name.substring(0, 13) + "..." : entry.name) : "Assembly");

      // Add current pixel - white square with circle
      svg
        .append("rect")
        .attr("x", centerCol * gridSize - gridSize / 2)
        .attr("y", (rowStart + 3) * gridSize - gridSize / 2)
        .attr("width", gridSize)
        .attr("height", gridSize)
        .attr("fill", "#fff")
        .attr("stroke", "#000")
        .attr("stroke-width", 1);

      svg
        .append("circle")
        .attr("cx", centerCol * gridSize)
        .attr("cy", (rowStart + 3) * gridSize)
        .attr("r", gridSize / 3)
        .attr("fill", "#000");

      // Add current pixel label
      svg
        .append("text")
        .attr("x", centerCol * gridSize)
        .attr("y", (rowStart + 4) * gridSize)
        .attr("text-anchor", "middle")
        .attr("font-family", "monospace")
        .attr("font-size", "8px")
        .text(`PIXEL-${pixel.serial}`);

      // Connect assembly to current pixel
      svg
        .append("line")
        .attr("x1", centerCol * gridSize)
        .attr("y1", rowStart * gridSize + gridSize / 2)
        .attr("x2", centerCol * gridSize)
        .attr("y2", (rowStart + 3) * gridSize - gridSize / 2)
        .attr("stroke", "#000")
        .attr("stroke-width", 1);

      // Add related pixels
      const maxRelatedToShow = Math.min(relatedPixels.length, 5);
      const relatedStartCol = centerCol - Math.floor(maxRelatedToShow / 2);

      relatedPixels.slice(0, maxRelatedToShow).forEach((relatedPixel, i) => {
        const relatedCol = relatedStartCol + i;
        const relatedRow = rowStart + 6;

        // Add related pixel - white square with X
        svg
          .append("rect")
          .attr("x", relatedCol * gridSize - gridSize / 2)
          .attr("y", relatedRow * gridSize - gridSize / 2)
          .attr("width", gridSize)
          .attr("height", gridSize)
          .attr("fill", "#fff")
          .attr("stroke", "#000")
          .attr("stroke-width", 1);

        // Add X
        svg
          .append("line")
          .attr("x1", relatedCol * gridSize - gridSize / 3)
          .attr("y1", relatedRow * gridSize - gridSize / 3)
          .attr("x2", relatedCol * gridSize + gridSize / 3)
          .attr("y2", relatedRow * gridSize + gridSize / 3)
          .attr("stroke", "#000")
          .attr("stroke-width", 1);

        svg
          .append("line")
          .attr("x1", relatedCol * gridSize - gridSize / 3)
          .attr("y1", relatedRow * gridSize + gridSize / 3)
          .attr("x2", relatedCol * gridSize + gridSize / 3)
          .attr("y2", relatedRow * gridSize - gridSize / 3)
          .attr("stroke", "#000")
          .attr("stroke-width", 1);

        // Add related pixel label
        svg
          .append("text")
          .attr("x", relatedCol * gridSize)
          .attr("y", (relatedRow + 1) * gridSize)
          .attr("text-anchor", "middle")
          .attr("font-family", "monospace")
          .attr("font-size", "8px")
          .text(`PIXEL-${relatedPixel.serial}`);

        // Connect current pixel to related pixel
        svg
          .append("line")
          .attr("x1", centerCol * gridSize)
          .attr("y1", (rowStart + 3) * gridSize + gridSize / 2)
          .attr("x2", relatedCol * gridSize)
          .attr("y2", relatedRow * gridSize - gridSize / 2)
          .attr("stroke", "#000")
          .attr("stroke-width", 0.5);

        // Connect related pixels across assemblies
        if (index > 0) {
          svg
            .append("line")
            .attr("x1", relatedCol * gridSize)
            .attr("y1", relatedRow * gridSize)
            .attr("x2", relatedCol * gridSize)
            .attr("y2", (5 + (index - 1) * 10 + 6) * gridSize)
            .attr("stroke", "#000")
            .attr("stroke-width", 0.5)
            .attr("stroke-dasharray", "3,3");
        }
      });

      // Connect current pixels across assemblies
      if (index > 0) {
        svg
          .append("line")
          .attr("x1", centerCol * gridSize)
          .attr("y1", (rowStart + 3) * gridSize)
          .attr("x2", (gridCols - 3) * gridSize)
          .attr("y2", (rowStart + 3) * gridSize)
          .attr("stroke", "#000")
          .attr("stroke-width", 0.5)
          .attr("stroke-dasharray", "5,5");

        svg
          .append("line")
          .attr("x1", (gridCols - 3) * gridSize)
          .attr("y1", (rowStart + 3) * gridSize)
          .attr("x2", (gridCols - 3) * gridSize)
          .attr("y2", (5 + (index - 1) * 10 + 3) * gridSize)
          .attr("stroke", "#000")
          .attr("stroke-width", 0.5)
          .attr("stroke-dasharray", "5,5");

        svg
          .append("line")
          .attr("x1", (gridCols - 3) * gridSize)
          .attr("y1", (5 + (index - 1) * 10 + 3) * gridSize)
          .attr("x2", centerCol * gridSize)
          .attr("y2", (5 + (index - 1) * 10 + 3) * gridSize)
          .attr("stroke", "#000")
          .attr("stroke-width", 0.5)
          .attr("stroke-dasharray", "5,5");
      }
    });

    // Add legend
    const legendRow = gridRows - 4;

    svg
      .append("text")
      .attr("x", 2 * gridSize)
      .attr("y", legendRow * gridSize)
      .attr("font-family", "monospace")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .text("LEGEND:");

    // Assembly legend
    svg
      .append("rect")
      .attr("x", 2 * gridSize - gridSize / 2)
      .attr("y", (legendRow + 1) * gridSize - gridSize / 2)
      .attr("width", gridSize)
      .attr("height", gridSize)
      .attr("fill", "#000");

    svg
      .append("text")
      .attr("x", 3 * gridSize)
      .attr("y", (legendRow + 1) * gridSize + 5)
      .attr("font-family", "monospace")
      .attr("font-size", "10px")
      .text("ASSEMBLY");

    // Current pixel legend
    svg
      .append("rect")
      .attr("x", 2 * gridSize - gridSize / 2)
      .attr("y", (legendRow + 2) * gridSize - gridSize / 2)
      .attr("width", gridSize)
      .attr("height", gridSize)
      .attr("fill", "#fff")
      .attr("stroke", "#000")
      .attr("stroke-width", 1);

    svg
      .append("circle")
      .attr("cx", 2 * gridSize)
      .attr("cy", (legendRow + 2) * gridSize)
      .attr("r", gridSize / 3)
      .attr("fill", "#000");

    svg
      .append("text")
      .attr("x", 3 * gridSize)
      .attr("y", (legendRow + 2) * gridSize + 5)
      .attr("font-family", "monospace")
      .attr("font-size", "10px")
      .text("CURRENT PIXEL");

    // Related pixel legend
    svg
      .append("rect")
      .attr("x", 2 * gridSize - gridSize / 2)
      .attr("y", (legendRow + 3) * gridSize - gridSize / 2)
      .attr("width", gridSize)
      .attr("height", gridSize)
      .attr("fill", "#fff")
      .attr("stroke", "#000")
      .attr("stroke-width", 1);

    svg
      .append("line")
      .attr("x1", 2 * gridSize - gridSize / 3)
      .attr("y1", (legendRow + 3) * gridSize - gridSize / 3)
      .attr("x2", 2 * gridSize + gridSize / 3)
      .attr("y2", (legendRow + 3) * gridSize + gridSize / 3)
      .attr("stroke", "#000")
      .attr("stroke-width", 1);

    svg
      .append("line")
      .attr("x1", 2 * gridSize - gridSize / 3)
      .attr("y1", (legendRow + 3) * gridSize + gridSize / 3)
      .attr("x2", 2 * gridSize + gridSize / 3)
      .attr("y2", (legendRow + 3) * gridSize - gridSize / 3)
      .attr("stroke", "#000")
      .attr("stroke-width", 1);

    svg
      .append("text")
      .attr("x", 3 * gridSize)
      .attr("y", (legendRow + 3) * gridSize + 5)
      .attr("font-family", "monospace")
      .attr("font-size", "10px")
      .text("RELATED PIXEL");
  };

  return (
    <div className="network-tab">
      <div className="d3-tree-container" ref={containerRef}>
        <svg ref={svgRef} className="d3-tree"></svg>
      </div>

      <pre className="json-data">{JSON.stringify(pixel, null, 2)}</pre>
    </div>
  );
};

export default NetworkTab;
