import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import styles from "./SparkLine.module.css";

const SparkLine = ({ data, color = "white", height = 24, width = 120 }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || Object.keys(data).length < 2) {
      return;
    }

    // Clear any existing content
    d3.select(svgRef.current).selectAll("*").remove();

    // Helper function to parse various date formats
    const parseDate = (dateStr) => {
      // Handle "January 2022" format
      if (dateStr.includes(" ")) {
        const [month, year] = dateStr.split(" ");
        return new Date(`${month} 1, ${year}`);
      }
      // Handle standard date formats
      return new Date(dateStr);
    };

    // Process data once with more robust date parsing
    const timeData = Object.entries(data)
      .map(([dateStr, value]) => {
        const date = parseDate(dateStr);
        const numValue = typeof value === "string" ? parseFloat(value) : Number(value);
        return isNaN(date.getTime()) ? null : [date, numValue];
      })
      .filter(Boolean)
      .sort(([a], [b]) => a - b);

    if (timeData.length < 2) {
      console.warn("SparkLine: Not enough valid data points", {
        originalData: data,
        processedData: timeData,
        dateStrings: Object.keys(data),
      });
      return;
    }

    const margin = { left: 3, right: 3, top: 2, bottom: 2 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xExtent = d3.extent(timeData, (d) => d[0]);
    const yExtent = d3.extent(timeData, (d) => d[1]);

    const xScale = d3.scaleTime().domain(xExtent).range([0, innerWidth]);

    const yMin = Math.min(0, yExtent[0]);
    const yMax = yExtent[1];
    const yPadding = Math.abs(yMax - yMin) * 0.1;

    const yScale = d3
      .scaleLinear()
      .domain([yMin - yPadding, yMax + yPadding])
      .range([innerHeight, 0]);

    // Create SVG with explicit height and width
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Create container group with margins to prevent cutting off edges
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Create line generator and log the generated path
    const line = d3
      .line()
      .x((d) => {
        const scaledX = xScale(d[0]);
        return scaledX;
      })
      .y((d) => {
        const scaledY = yScale(d[1]);
        return scaledY;
      })
      .curve(d3.curveStepAfter);

    // Log the generated path data
    const pathData = line(timeData);

    // Draw the line
    const path = g
      .append("path")
      .datum(timeData)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1)
      .attr("d", line);

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
