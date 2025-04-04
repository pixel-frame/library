import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import styles from "./CarbonLine.module.css";
import { safeParseDate, getTickCount, createTimeScale } from "../../utils/dateUtils";

const CarbonLine = ({ emissionsData, minValue, maxValue, dateRange, onEventChange, currentEventIndex, isActive }) => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [timeIndicatorPosition, setTimeIndicatorPosition] = useState(null);
  const initialRenderRef = useRef(true);
  const userInteractingRef = useRef(false);
  const lastInteractionTimeRef = useRef(0);
  const [forceRender, setForceRender] = useState(0);
  const resizeObserverRef = useRef(null);

  // Handle resize and initial sizing with ResizeObserver for more reliable dimension detection
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (!containerRef.current) return;

      const { width } = containerRef.current.getBoundingClientRect();
      const height = containerRef.current.getBoundingClientRect().height;

      // Only update if dimensions actually changed or are zero
      if (dimensions.width !== width || dimensions.height !== height || width === 0 || height === 0) {
        setDimensions({ width, height });
      }
    };

    // Initial update
    updateDimensions();

    // Set up ResizeObserver for more reliable dimension detection
    resizeObserverRef.current = new ResizeObserver(updateDimensions);
    resizeObserverRef.current.observe(containerRef.current);

    // Also keep the window resize listener as a fallback
    window.addEventListener("resize", updateDimensions);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // Improved tab activation handling

  // Set initial position on first render
  useEffect(() => {
    if (initialRenderRef.current && emissionsData?.length && dimensions.width) {
      initialRenderRef.current = false;

      // Position the indicator at the first event (index 0)
      if (emissionsData[0] && svgRef.current) {
        const margin = { top: 60, right: 4, bottom: 60, left: 4 };
        const innerWidth = dimensions.width - margin.left - margin.right;

        // Use the helper function to create xScale with safe date parsing
        const xScale = createTimeScale(dateRange?.start, dateRange?.end, innerWidth, d3);

        // Calculate position for the first event
        const firstEventDate = safeParseDate(emissionsData[0].timestamp);
        const xPos = xScale(firstEventDate);

        // Set the indicator position
        setTimeIndicatorPosition(xPos + margin.left);
      }
    }
  }, [emissionsData, dimensions, dateRange]);

  // Update indicator position when currentEventIndex changes (from LogCardContainer)
  useEffect(() => {
    if (!svgRef.current || !emissionsData?.length || dimensions.width === 0 || currentEventIndex === undefined) return;

    // Don't update during initial render as we handle that separately
    if (initialRenderRef.current) return;

    // Don't update if user is actively interacting with the chart
    // or if it's been less than 500ms since the last user interaction
    const now = Date.now();
    if (userInteractingRef.current || now - lastInteractionTimeRef.current < 500) {
      return;
    }

    const margin = { top: 60, right: 4, bottom: 60, left: 4 };
    const innerWidth = dimensions.width - margin.left - margin.right;

    // Use the helper function to create xScale with safe date parsing
    const xScale = createTimeScale(dateRange?.start, dateRange?.end, innerWidth, d3);

    // Get the date for the current event index
    if (emissionsData[currentEventIndex]) {
      const eventDate = safeParseDate(emissionsData[currentEventIndex].timestamp);
      const xPos = xScale(eventDate);

      // Update the indicator position
      setTimeIndicatorPosition(xPos + margin.left);
    }
  }, [currentEventIndex, emissionsData, dimensions, dateRange]);

  const handleChartInteraction = (event) => {
    if (!svgRef.current || !emissionsData?.length) return;

    // Mark that user is interacting with the chart
    userInteractingRef.current = true;
    lastInteractionTimeRef.current = Date.now();

    // Schedule to reset the interaction flag after a short delay
    setTimeout(() => {
      userInteractingRef.current = false;
    }, 100);

    const svg = d3.select(svgRef.current);
    const margin = { top: 60, right: 4, bottom: 60, left: 4 };
    const innerWidth = dimensions.width - margin.left - margin.right;

    const svgBounds = svgRef.current.getBoundingClientRect();
    const clientX = event.type.includes("touch") ? event.touches[0].clientX : event.clientX;
    const x = clientX - svgBounds.left - margin.left;

    const constrainedX = Math.max(0, Math.min(x, innerWidth));
    setTimeIndicatorPosition(constrainedX + margin.left);

    // Use the helper function to create xScale with safe date parsing
    const xScale = createTimeScale(dateRange?.start, dateRange?.end, innerWidth, d3);

    const cursorDate = xScale.invert(constrainedX);

    // Sort data points by timestamp using safeParseDate for consistent behavior across browsers
    const sortedPoints = [...emissionsData].sort((a, b) => safeParseDate(a.timestamp) - safeParseDate(b.timestamp));

    // Find all points that are before or at the cursor position using safeParseDate
    const pointsBeforeCursor = sortedPoints.filter((point) => safeParseDate(point.timestamp) <= cursorDate);

    // If no points are before the cursor, select the first point
    if (pointsBeforeCursor.length === 0) {
      const firstPointIndex = emissionsData.findIndex((point) => point.timestamp === sortedPoints[0].timestamp);
      if (onEventChange && firstPointIndex !== -1) {
        onEventChange(firstPointIndex);
      }
      return;
    }

    // Select the last point that the cursor has passed
    const lastPassedPoint = pointsBeforeCursor[pointsBeforeCursor.length - 1];
    const lastPassedPointIndex = emissionsData.findIndex((point) => point.timestamp === lastPassedPoint.timestamp);

    if (onEventChange && lastPassedPointIndex !== -1) {
      onEventChange(lastPassedPointIndex);
    }
  };

  useEffect(() => {
    if (!svgRef.current || !emissionsData?.length) return;

    // Don't try to render if dimensions are invalid
    if (dimensions.width <= 0 || dimensions.height <= 0) {
      // Schedule a re-check of dimensions
      const timer = setTimeout(() => {
        if (containerRef.current) {
          const { width } = containerRef.current.getBoundingClientRect();
          const height = containerRef.current.getBoundingClientRect().height;
          if (width > 0 && height > 0) {
            setDimensions({ width, height });
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Get the actual current date from the browser
    const today = new Date();

    // Reduce horizontal margins to 4px, but increase left margin for y-axis
    const margin = { top: 50, right: 4, bottom: 45, left: 40 }; // Increased left margin from 4 to 40
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Use dateRange instead of hard-coded dates
    const startDate = safeParseDate(dateRange?.start);

    // Ensure the end date is at least 3 months after today to position today closer to the end
    const minEndDate = new Date(today);

    // Add padding to dates for better visualization
    const paddedStartDate = new Date(startDate);
    paddedStartDate.setMonth(paddedStartDate.getMonth() - 2);

    const paddedEndDate = new Date(minEndDate);
    paddedEndDate.setMonth(paddedEndDate.getMonth() + 1);

    // Use the helper function to create xScale with safe date parsing
    const xScale = createTimeScale(dateRange?.start, dateRange?.end, innerWidth, d3);

    // Adjust y-scale domain padding
    const yMin = 0;
    const yMax = Math.max(...emissionsData.map((d) => d.value));
    const topPadding = yMax * 0.1; // Increased top padding to 20% to prevent cutoff

    const yScale = d3
      .scaleLinear()
      .domain([yMin, yMax + topPadding])
      .range([innerHeight, 0])
      .nice(); // Added .nice() to round to nice numbers

    // IMPORTANT FIX: Make sure we're using safeParseDate consistently in the line generator
    const line = d3
      .line()
      .x((d) => xScale(safeParseDate(d.timestamp)))
      .y((d) => yScale(d.value))
      .curve(d3.curveStepAfter);

    // Add grid lines
    const xGrid = d3.axisBottom(xScale).tickSize(-innerHeight).tickFormat("").ticks(6);
    const yGrid = d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat("").ticks(5);

    g.append("g").attr("class", styles.grid).attr("transform", `translate(0,${innerHeight})`).call(xGrid);
    g.append("g").attr("class", styles.grid).call(yGrid);

    // Add gray vertical line for current date (positioned behind other elements)
    const currentDateX = xScale(today);

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

    // Find the last data point before today
    // IMPORTANT FIX: Use safeParseDate for consistent date comparison
    const pastData = emissionsData.filter((d) => safeParseDate(d.timestamp) <= today);
    const lastPoint = pastData.length > 0 ? pastData[pastData.length - 1] : null;

    // Check if the last data point is before today
    if (lastPoint && safeParseDate(lastPoint.timestamp) < today) {
      // Create a horizontal line from the last point to today
      const extendedData = [
        lastPoint,
        { ...lastPoint, timestamp: today.toISOString() }, // Create a new point at today with the same value
      ];

      // Draw the horizontal extension line
      if (timeIndicatorPosition !== null) {
        const cursorDate = xScale.invert(timeIndicatorPosition - margin.left);

        // If cursor is before the last point, the extension is entirely in the future (dashed)
        if (cursorDate <= safeParseDate(lastPoint.timestamp)) {
          g.append("path").datum(extendedData).attr("class", styles.futurePath).attr("d", line);
        }
        // If cursor is after today, the extension is entirely in the past (solid)
        else if (cursorDate >= today) {
          g.append("path").datum(extendedData).attr("class", styles.pastPath).attr("d", line);
        }
        // If cursor is between the last point and today, split the extension
        else {
          // Create the split point at cursor position
          const splitPoint = {
            ...lastPoint,
            timestamp: cursorDate.toISOString(),
          };

          // Draw solid line from last point to cursor
          g.append("path").datum([lastPoint, splitPoint]).attr("class", styles.pastPath).attr("d", line);

          // Draw dashed line from cursor to today
          g.append("path")
            .datum([splitPoint, { ...lastPoint, timestamp: today.toISOString() }])
            .attr("class", styles.futurePath)
            .attr("d", line);
        }
      } else {
        // No cursor position, draw the extension as solid (past)
        g.append("path").datum(extendedData).attr("class", styles.pastPath).attr("d", line);
      }
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
      const pointsUpToCursor = emissionsData.filter((d) => safeParseDate(d.timestamp) <= cursorDate);
      const latestValue = pointsUpToCursor.length > 0 ? pointsUpToCursor[pointsUpToCursor.length - 1].value : 0;

      // Determine if the cursor date is in the future
      const isFuture = cursorDate > today;

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
      const beforeCursor = emissionsData.filter((d) => safeParseDate(d.timestamp) <= cursorDate);
      const afterCursor = emissionsData.filter((d) => safeParseDate(d.timestamp) >= cursorDate);

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

      // Add vertical line from 0 to first point if there are points before cursor
      if (beforeCursor.length > 0) {
        const firstPoint = beforeCursor[0];

        // Create a zero-point at the same x-coordinate
        const zeroPoint = {
          timestamp: firstPoint.timestamp,
          value: 0,
        };

        // Draw vertical line from x-axis to first point
        g.append("path")
          .datum([zeroPoint, firstPoint])
          .attr("class", styles.pastPath)
          .attr(
            "d",
            d3
              .line()
              .x((d) => xScale(safeParseDate(d.timestamp)))
              .y((d) => yScale(d.value))
              .curve(d3.curveLinear)
          ); // Use linear curve for vertical line
      }

      // Draw solid line before cursor
      if (beforeCursor.length) {
        g.append("path").datum(beforeCursor).attr("class", styles.pastPath).attr("d", line);
      }

      // Draw dashed line after cursor
      if (afterCursor.length) {
        // Add vertical line from 0 to first point after cursor if needed
        if (afterCursor.length > 0 && beforeCursor.length === 0) {
          const firstPoint = afterCursor[0];

          // Create a zero-point at the same x-coordinate
          const zeroPoint = {
            timestamp: firstPoint.timestamp,
            value: 0,
          };

          // Draw vertical line from x-axis to first point
          g.append("path")
            .datum([zeroPoint, firstPoint])
            .attr("class", styles.futurePath)
            .attr(
              "d",
              d3
                .line()
                .x((d) => xScale(safeParseDate(d.timestamp)))
                .y((d) => yScale(d.value))
                .curve(d3.curveLinear)
            ); // Use linear curve for vertical line
        }

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
    }

    // Update point groups with adjusted positioning
    const pointGroups = g
      .selectAll(".point")
      .data(emissionsData)
      .enter()
      .append("g")
      .attr("class", styles.emissionPoint)
      .attr("transform", (d) => `translate(${xScale(safeParseDate(d.timestamp))},${yScale(d.value)})`);

    pointGroups.each(function (d) {
      const isPast = safeParseDate(d.timestamp) <= today;

      // Add small square at the exact data point
      d3.select(this)
        .append("rect")
        .attr("x", -4)
        .attr("y", -4)
        .attr("width", 8)
        .attr("height", 8)
        .attr("fill", isPast ? "var(--text-primary)" : "var(--accent)");

      // Determine event type based on step name

      let eventType = null;
      if (d.name) {
        if (d.name.includes("Fabrication")) {
          eventType = "Fabrication";
        } else {
          eventType = "Re-assembly";
        }
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

    // Update y-axis with more prominent styling
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => (d === 0 ? "" : d.toFixed(2))) // Hide zero but keep other values
      .tickSize(-6);

    g.append("g")
      .attr("class", styles.yAxis)
      .call(yAxis)
      .call((g) => {
        g.select(".domain").remove();
        g.selectAll(".tick text").attr("x", -8).style("text-anchor", "end");
      });

    // Add y-axis label
    g.append("text")
      .attr("x", -30) // Position at left edge
      .attr("y", -30) // Position above chart
      .attr("fill", "var(--text-primary)")
      .attr("font-size", "12px")
      .style("text-anchor", "start")
      .text("CARBON (kgCO₂)");

    // After drawing the lines, add the points and event markers
    // Keep track of used positions by x-coordinate range to prevent overlap
    const usedPositionsByXRange = {};
    const xRangeWidth = 0; // Consider markers within 50px of each other as potentially overlapping

    emissionsData.forEach((d) => {
      const x = xScale(safeParseDate(d.timestamp));
      const y = yScale(d.value);

      // Only add event markers if there's an event
      if (d.event) {
        // Determine event type based on event name
        let eventType = d.event.includes("Initial Fabrication") ? "Fabrication" : "Re-assembly";

        // Calculate label width based on text length
        const labelWidth = eventType.length * 8 + 16;

        // Event box with asterisk
        const eventBoxSize = 24;

        // Calculate the x-range bucket this marker belongs to
        const xRangeBucket = Math.floor(x / xRangeWidth) * xRangeWidth;

        // Initialize the array for this x-range if it doesn't exist
        if (!usedPositionsByXRange[xRangeBucket]) {
          usedPositionsByXRange[xRangeBucket] = [];
        }

        let eventBoxY;
        if (usedPositionsByXRange[xRangeBucket].length === 0) {
          eventBoxY = y + 30;
        } else {
          eventBoxY = y - 30;
        }

        // Check for horizontal bounds - ensure label doesn't go off right edge
        const rightEdge = x + eventBoxSize + labelWidth;
        const chartWidth = dimensions.width - margin.right - margin.left;

        // If label would go off right edge, place it to the left of the point instead
        const labelDirection = rightEdge > chartWidth ? -1 : 1;

        // Record this position as used
        usedPositionsByXRange[xRangeBucket].push(eventBoxY);

        // Determine if this event is before or after the cursor
        let isBeforeCursor = true;
        if (timeIndicatorPosition !== null) {
          const cursorDate = xScale.invert(timeIndicatorPosition - margin.left);
          isBeforeCursor = safeParseDate(d.timestamp) <= cursorDate;
        }

        // Draw the event box with different styling based on cursor position
        g.append("rect")
          .attr("x", x - eventBoxSize / 2)
          .attr("y", eventBoxY - eventBoxSize / 2)
          .attr("width", eventBoxSize)
          .attr("height", eventBoxSize)
          .attr("fill", isBeforeCursor ? "black" : "var(--accent)"); // Gray for future events

        g.append("path")
          .attr(
            "d",
            "M3.05596 13.784L5.88796 9.17602L0.511963 9.22402V6.77602L5.88796 6.82402L3.05596 2.21602L5.16796 0.968018L7.95196 5.76802L10.64 0.968018L12.8 2.21602L9.96796 6.82402L15.344 6.77602V9.22402L9.96796 9.17602L12.8 13.784L10.64 15.032L7.95196 10.232L5.16796 15.032L3.05596 13.784Z"
          )
          .attr("transform", `translate(${x - 8},${eventBoxY - 8}) scale(1)`) // Center and scale the icon
          .attr("fill", isBeforeCursor ? "white" : "black");

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
          //   .attr("stroke", isBeforeCursor ? "black" : "var(--accent)") // No black border for future events
          //GARRETT - ADD BACK IN IF WANTED
          .attr("stroke-width", 1);

        g.append("text")
          .attr("x", labelDirection > 0 ? labelX + labelWidth / 2 : labelX + labelWidth / 2)
          .attr("y", eventBoxY)
          .attr("text-anchor", "middle") // Center text in the label box
          .attr("dominant-baseline", "middle")
          .attr("font-size", "14px")
          .attr("fill", "black")
          .text(eventType);
      }
    });
  }, [emissionsData, dimensions, minValue, maxValue, timeIndicatorPosition, dateRange, forceRender]);

  // Add effect to highlight the current event point
  useEffect(() => {
    if (!svgRef.current || !emissionsData?.length || currentEventIndex === undefined) return;

    // This effect can be used to highlight the current event point if needed
    // For now, we'll just ensure the component re-renders when currentEventIndex changes
  }, [currentEventIndex, emissionsData]);

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onMouseMove={handleChartInteraction}
      onTouchMove={handleChartInteraction}
    >
      <svg
        ref={svgRef}
        width={dimensions.width || "100%"}
        height={dimensions.height || "100%"}
        className={styles.svg}
        preserveAspectRatio="xMidYMid meet"
      />
    </div>
  );
};

export default CarbonLine;
