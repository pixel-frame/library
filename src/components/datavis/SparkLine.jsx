import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import styles from "./SparkLine.module.css";

const SparkLine = ({ data, color = "white", height = 24, width = 120 }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || Object.keys(data).length === 0) return;

    // Clear any existing content
    d3.select(svgRef.current).selectAll("*").remove();

    // Convert data to array of [date, value] pairs
    const timeData = Object.entries(data).map(([dateStr, value]) => [new Date(dateStr), value]);

    // Sort by date
    timeData.sort((a, b) => a[0] - b[0]);

    // Set up dimensions with padding to prevent cutting off
    const margin = { left: 3, right: 3, top: 2, bottom: 2 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(timeData, (d) => d[0]))
      .range([0, innerWidth]);

    // Calculate the vertical center point
    const dataMin = d3.min(timeData, (d) => d[1]) || 0;
    const dataMax = d3.max(timeData, (d) => d[1]) || 1;
    const dataRange = dataMax - dataMin;

    // Create a centered y-scale with equal padding above and below
    const yPadding = dataRange * 0.2; // 20% padding
    const yMin = Math.max(0, dataMin - yPadding); // Don't go below 0 unless data does
    const yMax = dataMax + yPadding;

    const yScale = d3.scaleLinear().domain([yMin, yMax]).range([innerHeight, 0]);

    // Create SVG with explicit height and width
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Create container group with margins to prevent cutting off edges
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Create line generator with step interpolation for orthogonal lines
    const line = d3
      .line()
      .x((d) => xScale(d[0]))
      .y((d) => yScale(d[1]))
      .curve(d3.curveStepAfter); // Use step interpolation for orthogonal lines

    // Draw the line
    g.append("path").datum(timeData).attr("fill", "none").attr("stroke", color).attr("stroke-width", 1).attr("d", line);

    // Add squares for data points instead of circles
    g.selectAll("rect")
      .data(timeData)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d[0]) - 2.5) // Center the square on the data point
      .attr("y", (d) => yScale(d[1]) - 2.5) // Center the square on the data point
      .attr("width", 5) // 5x5 square
      .attr("height", 5)
      .attr("fill", color);
  }, [data, color, height, width]);

  return <svg ref={svgRef} className={styles.sparkline} />;
};

export default SparkLine;
