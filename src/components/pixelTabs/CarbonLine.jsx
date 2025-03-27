import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import styles from "./CarbonLine.module.css";

const CarbonLine = ({ emissionsData, currentDate, minValue, maxValue, dateRange }) => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [timeIndicatorPosition, setTimeIndicatorPosition] = useState(null);

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

  // Add a new useEffect that responds to visibility changes
  useEffect(() => {
    // This will trigger a re-calculation of dimensions when the component becomes visible
    const updateDimensions = () => {
      if (!containerRef.current) return;

      const { width } = containerRef.current.getBoundingClientRect();
      const height = containerRef.current.getBoundingClientRect().height;

      setDimensions({ width, height });
    };

    // Use MutationObserver to detect when the component becomes visible
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "aria-hidden") {
          const isHidden = containerRef.current.closest('[aria-hidden="true"]');
          if (!isHidden) {
            // Component is now visible, update dimensions
            updateDimensions();
          }
        }
      });
    });

    // Start observing the container and its ancestors for aria-hidden changes
    let element = containerRef.current;
    while (element) {
      observer.observe(element, { attributes: true });
      element = element.parentElement;
    }

    return () => {
      observer.disconnect();
    };
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
  };

  useEffect(() => {
    if (!svgRef.current || !emissionsData?.length || !dimensions.width) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Reduce horizontal margins to 4px
    const margin = { top: 60, right: 4, bottom: 60, left: 4 };
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
      .curve(d3.curveStepAfter);

    // Add grid lines
    const xGrid = d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat("").ticks(6);
    const yGrid = d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat("").ticks(5);

    g.append("g").attr("class", styles.grid).attr("transform", `translate(0,${innerHeight})`).call(xGrid);
    g.append("g").attr("class", styles.grid).call(yGrid);

    // Add gray vertical line for current date (positioned behind other elements)
    if (currentDate) {
      const currentDateX = xScale(new Date(currentDate));
      g.append("line")
        .attr("class", styles.currentDateLine)
        .attr("x1", currentDateX)
        .attr("x2", currentDateX)
        .attr("y1", 0)
        .attr("y2", innerHeight)
        .attr("stroke", "#888888")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "5,3")
        .attr("opacity", 0.7);
    }

    // Add emissions info text container at the top
    const emissionsInfoGroup = svg
      .append("g")
      .attr("class", styles.emissionsInfo)
      .attr("transform", `translate(${margin.left}, 20)`); // Position at the top

    // Add background for emissions text
    emissionsInfoGroup.append("rect").attr("width", innerWidth).attr("height", 30).attr("fill", "transparent");

    // Add initial emissions text
    const emissionsText = emissionsInfoGroup
      .append("text")
      .attr("class", styles.emissionsText)
      .attr("x", 0)
      .attr("y", 15)
      .attr("fill", "var(--text-primary)")
      .attr("font-size", "12px");

    if (timeIndicatorPosition !== null) {
      const cursorDate = xScale.invert(timeIndicatorPosition - margin.left);

      // Calculate emissions up to the cursor position
      const pointsUpToCursor = emissionsData.filter((d) => new Date(d.timestamp) <= cursorDate);
      const latestValue = pointsUpToCursor.length > 0 ? pointsUpToCursor[pointsUpToCursor.length - 1].value : 0;

      // Determine if the cursor date is in the future
      const isFuture = currentDate && cursorDate > new Date(currentDate);

      // Update emissions text
      const textContent = `${latestValue.toFixed(2)} kgCO₂e${isFuture ? " (planned)" : ""}`;
      emissionsText.text(textContent);

      // Estimate text width (approximately 7px per character)
      const estimatedTextWidth = textContent.length * 7;

      // Calculate position for the text - follow the cursor x position
      // Constrain to chart boundaries, ensuring text doesn't go off the right edge
      const textX = Math.max(0, Math.min(timeIndicatorPosition - margin.left, innerWidth - estimatedTextWidth));

      // Update position of the text to follow cursor
      emissionsInfoGroup.attr("transform", `translate(${margin.left + textX}, 20)`);

      // Find the segments ensuring we include the connecting points
      const beforeCursor = emissionsData.filter((d) => new Date(d.timestamp) <= cursorDate);
      const afterCursor = emissionsData.filter((d) => new Date(d.timestamp) >= cursorDate);

      // If we have a point exactly at the cursor, it will be in both arrays
      // If not, we need to add an interpolated point to both arrays
      if (
        beforeCursor.length &&
        afterCursor.length &&
        beforeCursor[beforeCursor.length - 1]?.timestamp !== afterCursor[0]?.timestamp
      ) {
        // Find the surrounding points for interpolation
        const prevPoint = beforeCursor[beforeCursor.length - 1];
        const nextPoint = afterCursor[0];

        if (prevPoint && nextPoint) {
          const prevDate = new Date(prevPoint.timestamp);
          const nextDate = new Date(nextPoint.timestamp);

          // Calculate interpolated value using step-after behavior
          // In step-after, the y-value stays at the previous point's value until the next point
          const interpolatedValue = prevPoint.value;

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
      // Default text when no cursor position
      emissionsText.text("");

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

      // Add small square at the exact data point
      d3.select(this)
        .append("rect")
        .attr("x", -4)
        .attr("y", -4)
        .attr("width", 8)
        .attr("height", 8)
        .attr("fill", isPast ? "var(--text-primary)" : "var(--accent)");

      // Determine event type based on step name
      console.log("efknek");
      console.log(d.name);
      console.log(d);
      let eventType = null;
      if (d.name) {
        if (d.name.includes("Fabrication")) {
          eventType = "Fabrication";
        } else {
          eventType = "Re-assembly";
        }
      }

      // Only add event boxes and labels if we have an event type
      if (eventType) {
        // Add asterisk box above the point
        const eventBoxSize = 24; // Smaller event box
        const eventBoxY = -40; // Position above the point

        d3.select(this)
          .append("rect")
          .attr("x", -eventBoxSize / 2)
          .attr("y", eventBoxY - eventBoxSize / 2)
          .attr("width", eventBoxSize)
          .attr("height", eventBoxSize)
          .attr("fill", isPast ? "black" : "var(--bg-secondary)");

        // Add asterisk inside the box
        d3.select(this)
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("x", 0)
          .attr("y", eventBoxY)
          .attr("font-size", `${eventBoxSize * 0.7}px`)
          .attr("fill", isPast ? "white" : "black")
          .text("*");

        // Add event type text to the right of the box
        d3.select(this)
          .append("rect")
          .attr("x", eventBoxSize / 2 + 4)
          .attr("y", eventBoxY - 12)
          .attr("width", eventType.length * 8 + 16) // Adjust width based on text length
          .attr("height", 24)
          .attr("fill", "white")
          .attr("stroke", isPast ? "black" : "var(--text-secondary)")
          .attr("stroke-width", 1);

        d3.select(this)
          .append("text")
          .attr("x", eventBoxSize / 2 + 12)
          .attr("y", eventBoxY)
          .attr("text-anchor", "start")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "12px")
          .attr("fill", "black")
          .text(eventType);
      }
    });

    // Define xAxis before using it
    const xAxis = d3
      .axisBottom(xScale)
      .tickSize(10)
      .tickFormat((d, i) => {
        if (d.getMonth() === 0) {
          return d3.timeFormat("%Y")(d);
        }
        return "";
      });

    // Add the x-axis with styled background
    const xAxisGroup = g.append("g").attr("class", styles.xAxis).attr("transform", `translate(0,${innerHeight})`);

    // Add background rectangle for x-axis
    xAxisGroup
      .append("rect")
      .attr("x", -margin.left) // Extend to the left edge
      .attr("y", 0)
      .attr("width", dimensions.width) // Full width of the SVG
      .attr("height", 30) // Height for the axis area
      .attr("fill", "var(--text-primary)");

    // Call the axis with light-colored ticks and text
    xAxisGroup.call(xAxis).call((g) => {
      g.select(".domain").attr("stroke", "var(--bg-primary)").attr("stroke-width", 2);
      g.selectAll(".tick line").attr("stroke", "var(--bg-primary)");
      g.selectAll(".tick text").attr("fill", "var(--bg-primary)");
    });

    // Add ticker triangle BELOW the x-axis as a separate element
    if (timeIndicatorPosition !== null) {
      const triangleSize = 10;
      const triangleHeight = 15;

      // Create a separate group for the triangle below the x-axis
      svg
        .append("g")
        .attr("transform", `translate(0,${margin.top + innerHeight + 30})`) // Position below the x-axis
        .append("path")
        .attr("class", styles.tickerTriangle)
        .attr(
          "d",
          `M${timeIndicatorPosition - triangleSize},${triangleHeight} 
           L${timeIndicatorPosition + triangleSize},${triangleHeight} 
           L${timeIndicatorPosition},0 Z`
        )
        .attr("fill", "var(--text-primary)");
    }

    // Add quarter indicators with light color
    const years = d3.timeYear.range(paddedStartDate, paddedEndDate);
    years.forEach((year) => {
      // For each year, add quarter indicators
      [3, 6, 9].forEach((month) => {
        const quarterDate = new Date(year.getFullYear(), month, 1);
        if (quarterDate >= paddedStartDate && quarterDate <= paddedEndDate) {
          const quarterX = xScale(quarterDate);
          xAxisGroup
            .append("line")
            .attr("x1", quarterX)
            .attr("x2", quarterX)
            .attr("y1", 0)
            .attr("y2", 5) // Smaller tick for quarters
            .attr("stroke", "var(--bg-primary)")
            .attr("stroke-width", 1);
        }
      });
    });

    // Update y-axis with more prominent styling
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => d.toFixed(2))
      .tickSize(6); // Smaller tick size to fit in narrow margin

    g.append("g")
      .attr("class", styles.yAxis)
      .call(yAxis)
      .call((g) => {
        // Remove the axis line since it would overlap with the chart edge
        g.select(".domain").remove();
        // Adjust tick position to be visible
        g.selectAll(".tick text").attr("x", 4).style("text-anchor", "start");
      });

    // After drawing the lines, add the points and event markers
    // Keep track of used vertical positions to prevent overlap
    const usedPositions = [];
    const minSpacing = 50; // Minimum vertical spacing between event labels

    emissionsData.forEach((d) => {
      const x = xScale(new Date(d.timestamp));
      const y = yScale(d.value);
      const isPast = new Date(d.timestamp) <= currentDate;

      // Add small square at the exact data point
      g.append("rect")
        .attr("x", x - 4)
        .attr("y", y - 4)
        .attr("width", 8)
        .attr("height", 8)
        .attr("fill", isPast ? "black" : "var(--accent)");

      // Only add event markers if there's an event
      if (d.event) {
        // Determine event type based on event name
        let eventType = d.event.includes("Initial Fabrication") ? "Fabrication" : "Re-assembly";

        // Calculate label width based on text length
        const labelWidth = eventType.length * 8 + 16;

        // Event box with asterisk
        const eventBoxSize = 24;
        let eventBoxY = y - 40; // Initial position

        // Check for horizontal bounds - ensure label doesn't go off right edge
        const rightEdge = x + eventBoxSize + labelWidth;
        const chartWidth = dimensions.width - margin.right - margin.left;

        // If label would go off right edge, place it to the left of the point instead
        const labelDirection = rightEdge > chartWidth ? -1 : 1;

        // Adjust vertical position to avoid overlaps
        let positionFound = false;
        while (!positionFound) {
          // Check if this position overlaps with any used positions
          const overlap = usedPositions.some((pos) => Math.abs(pos - eventBoxY) < minSpacing);

          if (!overlap) {
            positionFound = true;
            usedPositions.push(eventBoxY);
          } else {
            // Try a position higher up
            eventBoxY -= 20;

            // If we're getting too high, reset and try below the point
            if (eventBoxY < 0) {
              eventBoxY = y + 40;
            }
          }
        }

        // Draw the event box
        g.append("rect")
          .attr("x", x - eventBoxSize / 2)
          .attr("y", eventBoxY - eventBoxSize / 2)
          .attr("width", eventBoxSize)
          .attr("height", eventBoxSize)
          .attr("fill", "black");

        g.append("text")
          .attr("x", x)
          .attr("y", eventBoxY)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "18px")
          .attr("fill", "white")
          .text("*");

        // Event label - position flush with event box
        const labelX =
          labelDirection > 0
            ? x + eventBoxSize / 2 // Flush with right side of event box
            : x - eventBoxSize / 2 - labelWidth; // Flush with left side of event box

        g.append("rect")
          .attr("x", labelX)
          .attr("y", eventBoxY - 12) // Vertically center with event box
          .attr("width", labelWidth)
          .attr("height", 24)
          .attr("fill", "white")
          .attr("stroke", "black")
          .attr("stroke-width", 1);

        g.append("text")
          .attr("x", labelDirection > 0 ? labelX + labelWidth / 2 : labelX + labelWidth / 2)
          .attr("y", eventBoxY)
          .attr("text-anchor", "middle") // Center text in the label box
          .attr("dominant-baseline", "middle")
          .attr("font-size", "12px")
          .attr("fill", "black")
          .text(eventType);
      }
    });
  }, [emissionsData, currentDate, dimensions, minValue, maxValue, timeIndicatorPosition, dateRange]);

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onMouseMove={handleChartInteraction}
      onTouchMove={handleChartInteraction}
      onMouseLeave={() => {
        setTimeIndicatorPosition(null);
      }}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className={styles.svg}
        preserveAspectRatio="xMidYMid meet"
      />
    </div>
  );
};

export default CarbonLine;
