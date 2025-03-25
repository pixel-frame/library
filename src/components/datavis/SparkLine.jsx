import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import styles from "./SparkLine.module.css";

const SparkLine = ({ data }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || Object.keys(data).length === 0) return;

    // Clear any existing content
    d3.select(svgRef.current).selectAll("*").remove();

    // Convert data to array of [date, value] pairs
    const timeData = Object.entries(data).map(([dateStr, value]) => [new Date(dateStr), value]);

    // Sort by date
    timeData.sort((a, b) => a[0] - b[0]);

    // Set up dimensions
    const height = 20;
    const width = 60;
    const margin = { left: 2, right: 2, top: 2, bottom: 2 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(timeData, (d) => d[0]))
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(timeData, (d) => d[1])])
      .range([innerHeight, 0]);

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width + 1} ${height + 1}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Create container group with margins
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Create line generator
    const line = d3
      .line()
      .x((d) => xScale(d[0]))
      .y((d) => yScale(d[1]));

    // Draw the line
    g.append("path")
      .datum(timeData)
      .attr("fill", "none")
      .attr("stroke", "var(--text-primary)")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add dots for data points
    g.selectAll("circle")
      .data(timeData)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d[0]))
      .attr("cy", (d) => yScale(d[1]))
      .attr("r", 3)
      .attr("fill", "var(--text-primary)");
  }, [data]);

  return <svg ref={svgRef} className={styles.sparkline} />;
};

export default SparkLine;
