import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import styles from "./CarbonLine.module.css";

const CarbonLine = ({ emissionsData, currentDate, minValue, maxValue, dateRange }) => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [timeIndicatorPosition, setTimeIndicatorPosition] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);

  // Handle resize and initial sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;

      const { width } = containerRef.current.getBoundingClientRect();
      // Set height to match parent container height instead of calculating based on width
      const height = containerRef.current.getBoundingClientRect().height;

      setDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleChartInteraction = (event) => {
    if (!svgRef.current || !emissionsData?.length) return;

    const svg = d3.select(svgRef.current);
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const svgBounds = svgRef.current.getBoundingClientRect();
    const clientX = event.type.includes("touch") ? event.touches[0].clientX : event.clientX;
    const x = clientX - svgBounds.left - margin.left;

    const constrainedX = Math.max(0, Math.min(x, innerWidth));
    setTimeIndicatorPosition(constrainedX + margin.left);

    // Get the date at cursor position
    const xScale = d3
      .scaleTime()
      .domain([new Date("2022-07"), new Date("2026-01")])
      .range([0, innerWidth]);

    const cursorDate = xScale.invert(constrainedX);

    // Find the nearest data point
    const nearestPoint = emissionsData.reduce((prev, curr) => {
      const prevDiff = Math.abs(new Date(prev.timestamp) - cursorDate);
      const currDiff = Math.abs(new Date(curr.timestamp) - cursorDate);
      return currDiff < prevDiff ? curr : prev;
    });

    setTooltipData({
      x: constrainedX + margin.left,
      y: margin.top,
      point: nearestPoint,
      index: emissionsData.indexOf(nearestPoint) + 1,
    });
  };

  useEffect(() => {
    if (!svgRef.current || !emissionsData?.length || !dimensions.width) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    // Define pointSize here before using it
    const pointSize = Math.min(Math.max(innerWidth * 0.06, 32), 48); // Minimum 32px, maximum 48px

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Use dateRange instead of hard-coded dates
    const startDate = new Date(dateRange?.start || "2022-07");
    const endDate = new Date(dateRange?.end || "2026-01");

    // Add padding to dates for better visualization
    const paddedStartDate = new Date(startDate);
    paddedStartDate.setMonth(paddedStartDate.getMonth() - 2);

    const paddedEndDate = new Date(endDate);
    paddedEndDate.setMonth(paddedEndDate.getMonth() + 1);

    const xScale = d3.scaleTime().domain([paddedStartDate, paddedEndDate]).range([0, innerWidth]);

    // Adjust y-scale domain padding to account for point size
    const yMin = Math.min(...emissionsData.map((d) => d.value));
    const yMax = Math.max(...emissionsData.map((d) => d.value));
    const yPadding = (yMax - yMin) * 0.15; // 15% padding

    const yScale = d3
      .scaleLinear()
      .domain([yMin - yPadding, yMax + yPadding])
      .range([innerHeight, 0]);

    const line = d3
      .line()
      .x((d) => xScale(new Date(d.timestamp)))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add grid lines
    const xGrid = d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat("").ticks(6);
    const yGrid = d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat("").ticks(5);

    g.append("g").attr("class", styles.grid).attr("transform", `translate(0,${innerHeight})`).call(xGrid);
    g.append("g").attr("class", styles.grid).call(yGrid);

    if (timeIndicatorPosition !== null) {
      const cursorDate = xScale.invert(timeIndicatorPosition - margin.left);

      // Find the segments ensuring we include the connecting points
      const beforeCursor = emissionsData.filter((d) => new Date(d.timestamp) <= cursorDate);
      const afterCursor = emissionsData.filter((d) => new Date(d.timestamp) >= cursorDate);

      // If we have a point exactly at the cursor, it will be in both arrays
      // If not, we need to add an interpolated point to both arrays
      if (beforeCursor[beforeCursor.length - 1]?.timestamp !== afterCursor[0]?.timestamp) {
        // Find the surrounding points for interpolation
        const prevPoint = beforeCursor[beforeCursor.length - 1];
        const nextPoint = afterCursor[0];

        if (prevPoint && nextPoint) {
          const prevDate = new Date(prevPoint.timestamp);
          const nextDate = new Date(nextPoint.timestamp);

          // Calculate interpolated value
          const timeDiff = nextDate - prevDate;
          const progress = (cursorDate - prevDate) / timeDiff;
          const interpolatedValue = prevPoint.value + (nextPoint.value - prevPoint.value) * progress;

          const interpolatedPoint = {
            timestamp: cursorDate.toISOString(),
            value: interpolatedValue,
          };

          beforeCursor.push(interpolatedPoint);
          afterCursor.unshift(interpolatedPoint);
        }
      }

      // Draw solid line before cursor
      if (beforeCursor.length) {
        g.append("path").datum(beforeCursor).attr("class", styles.pastPath).attr("d", line);
      }

      // Draw dashed line after cursor
      if (afterCursor.length) {
        g.append("path").datum(afterCursor).attr("class", styles.futurePath).attr("d", line);
      }

      // Add time indicator line
      g.append("line")
        .attr("class", styles.timeIndicator)
        .attr("x1", timeIndicatorPosition - margin.left)
        .attr("x2", timeIndicatorPosition - margin.left)
        .attr("y1", 0)
        .attr("y2", innerHeight);
    } else {
      // If no cursor position, draw entire line as solid
      g.append("path").datum(emissionsData).attr("class", styles.pastPath).attr("d", line);
    }

    // Update point groups with adjusted positioning
    const pointGroups = g
      .selectAll(".point")
      .data(emissionsData)
      .enter()
      .append("g")
      .attr("class", styles.emissionPoint)
      .attr("transform", (d) => `translate(${xScale(new Date(d.timestamp))},${yScale(d.value)})`);

    pointGroups.each(function (d) {
      const isPast = new Date(d.timestamp) <= currentDate;

      d3.select(this)
        .append("rect")
        .attr("x", -pointSize / 2)
        .attr("y", -pointSize / 2)
        .attr("width", pointSize)
        .attr("height", pointSize)
        .attr("fill", isPast ? "var(--text-primary)" : "var(--accent)");

      d3.select(this)
        .append("text")
        .attr("class", styles.plotPoint)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", `${pointSize}px`)
        .attr("fill", isPast ? "var(--bg-primary)" : "var(--text-primary)")
        .text("*");
    });

    // Update x-axis with more prominent styling
    const xAxis = d3.axisBottom(xScale).ticks(6).tickFormat(d3.timeFormat("%Y")).tickSize(10); // Increase tick size

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => d.toFixed(2));

    g.append("g")
      .attr("class", styles.xAxis)
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((g) => g.select(".domain").attr("stroke-width", 2)); // Make axis line thicker

    g.append("g").attr("class", styles.yAxis).call(yAxis);
  }, [emissionsData, currentDate, dimensions, minValue, maxValue, timeIndicatorPosition, dateRange]);

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onMouseMove={handleChartInteraction}
      onTouchMove={handleChartInteraction}
      onMouseLeave={() => {
        setTimeIndicatorPosition(null);
        setTooltipData(null);
      }}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className={styles.svg}
        preserveAspectRatio="xMidYMid meet"
      />
      {tooltipData && (
        <div
          className={styles.tooltip}
          style={{
            left: `${tooltipData.x + 20}px`,
            top: `${tooltipData.y}px`,
            transform: "translateY(-50%)",
            position: "absolute",
          }}
        >
          Lorem ipsum dolor sit amet [{tooltipData.index}]
        </div>
      )}
    </div>
  );
};

export default CarbonLine;
