import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import styles from "./CarbonLine.module.css";

// Helper function to safely parse dates (Safari-compatible)
const safeParseDate = (dateString) => {
  if (!dateString) return new Date();

  // Handle ISO strings in a Safari-compatible way
  if (typeof dateString === "string") {
    // Replace any hyphens with slashes for better Safari compatibility
    const safeDateString = dateString.replace(/-/g, "/");

    // For ISO strings with time and timezone info
    if (dateString.includes("T")) {
      return new Date(dateString); // Keep original format for ISO strings with time
    }

    return new Date(safeDateString);
  }

  // If it's already a Date object
  if (dateString instanceof Date) {
    return dateString;
  }

  // Fallback
  return new Date();
};

// Update the createXScale function to use the safe date parsing
const createXScale = (startDate, endDate, width) => {
  // Safely parse dates
  const parsedStartDate = safeParseDate(startDate);
  const parsedEndDate = safeParseDate(endDate);

  // Calculate the time span in years
  const years = (parsedEndDate - parsedStartDate) / (1000 * 60 * 60 * 24 * 365);

  // For longer time spans, adjust padding proportionally
  const paddingMonths = years > 5 ? 6 : 2;

  // Create padded dates
  const paddedStartDate = new Date(parsedStartDate);
  paddedStartDate.setMonth(paddedStartDate.getMonth() - paddingMonths);

  const paddedEndDate = new Date(parsedEndDate);
  paddedEndDate.setMonth(paddedEndDate.getMonth() + paddingMonths);

  return d3.scaleTime().domain([paddedStartDate, paddedEndDate]).range([0, width]);
};

// Update getTickCount to use safe date parsing
const getTickCount = (startDate, endDate) => {
  if (!startDate || !endDate) return 6;

  const start = safeParseDate(startDate);
  const end = safeParseDate(endDate);
  const years = (end - start) / (1000 * 60 * 60 * 24 * 365);

  if (years > 10) return Math.ceil(years / 2); // One tick every 2 years
  if (years > 5) return years + 1; // One tick per year
  if (years > 2) return years * 2; // Two ticks per year
  return years * 4; // Quarterly ticks for shorter spans
};

const CarbonLine = ({
  emissionsData,
  currentDate,
  minValue,
  maxValue,
  dateRange,
  onEventChange,
  currentEventIndex,
  isActive,
}) => {
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
  useEffect(() => {
    if (isActive) {
      // Immediately check dimensions when tab becomes active
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        const height = containerRef.current.getBoundingClientRect().height;

        // Force dimensions update if container has valid size
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }

      // Schedule multiple checks to ensure proper rendering
      const checkTimes = [0, 50, 150, 300, 500];

      const timers = checkTimes.map((delay) =>
        setTimeout(() => {
          if (containerRef.current) {
            const { width } = containerRef.current.getBoundingClientRect();
            const height = containerRef.current.getBoundingClientRect().height;

            if (width > 0 && height > 0) {
              setDimensions({ width, height });
              setForceRender((prev) => prev + 1);
            }
          }
        }, delay)
      );

      return () => timers.forEach((timer) => clearTimeout(timer));
    }
  }, [isActive]);

  // Set initial position on first render
  useEffect(() => {
    if (initialRenderRef.current && emissionsData?.length && dimensions.width) {
      initialRenderRef.current = false;

      // Position the indicator at the first event (index 0)
      if (emissionsData[0] && svgRef.current) {
        const margin = { top: 60, right: 4, bottom: 60, left: 4 };
        const innerWidth = dimensions.width - margin.left - margin.right;

        // Use the helper function to create xScale with safe date parsing
        const xScale = createXScale(dateRange?.start, dateRange?.end, innerWidth);

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
    const xScale = createXScale(dateRange?.start, dateRange?.end, innerWidth);

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
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const svgBounds = svgRef.current.getBoundingClientRect();
    const clientX = event.type.includes("touch") ? event.touches[0].clientX : event.clientX;
    const x = clientX - svgBounds.left - margin.left;

    const constrainedX = Math.max(0, Math.min(x, innerWidth));
    setTimeIndicatorPosition(constrainedX + margin.left);

    // Use the helper function to create xScale with safe date parsing
    const xScale = createXScale(dateRange?.start, dateRange?.end, innerWidth);

    const cursorDate = xScale.invert(constrainedX);

    // Sort data points by timestamp
    const sortedPoints = [...emissionsData].sort((a, b) => safeParseDate(a.timestamp) - safeParseDate(b.timestamp));

    // Find all points that are before or at the cursor position
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

    // Reduce horizontal margins to 4px
    const margin = { top: 60, right: 4, bottom: 45, left: 4 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    // Define pointSize here before using it
    const pointSize = Math.min(Math.max(innerWidth * 0.06, 32), 48); // Minimum 32px, maximum 48px

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Use dateRange instead of hard-coded dates
    const startDate = new Date(dateRange?.start);

    // Ensure the end date is at least 3 months after today to position today closer to the end
    const endDate = new Date(dateRange?.end);
    const minEndDate = new Date(today);

    // Add padding to dates for better visualization
    const paddedStartDate = new Date(startDate);
    paddedStartDate.setMonth(paddedStartDate.getMonth() - 2);

    const paddedEndDate = new Date(minEndDate);
    paddedEndDate.setMonth(paddedEndDate.getMonth() + 1);

    // Use the helper function to create xScale with safe date parsing
    const xScale = createXScale(dateRange?.start, dateRange?.end, innerWidth);

    // Adjust y-scale domain padding to account for point size
    const yMin = 0; // Always start at 0
    const yMax = Math.max(...emissionsData.map((d) => d.value));
    const topPadding = yMax * 0.1; // Reduce top padding to 10%
    const bottomPadding = yMax * 0.05; // Add 5% padding at bottom to ensure 0 is visible

    const yScale = d3
      .scaleLinear()
      .domain([yMin - bottomPadding, yMax + topPadding]) // Add padding to both top and bottom
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
    const pastData = emissionsData.filter((d) => new Date(d.timestamp) <= today);
    const lastPoint = pastData.length > 0 ? pastData[pastData.length - 1] : null;

    // Check if the last data point is before today
    if (lastPoint && new Date(lastPoint.timestamp) < today) {
      // Create a horizontal line from the last point to today
      const extendedData = [
        lastPoint,
        { ...lastPoint, timestamp: today.toISOString() }, // Create a new point at today with the same value
      ];

      // Draw the horizontal extension line
      if (timeIndicatorPosition !== null) {
        const cursorDate = xScale.invert(timeIndicatorPosition - margin.left);

        // If cursor is before the last point, the extension is entirely in the future (dashed)
        if (cursorDate <= new Date(lastPoint.timestamp)) {
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
      const pointsUpToCursor = emissionsData.filter((d) => new Date(d.timestamp) <= cursorDate);
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

      // Add vertical line from 0 to first point if there are points before cursor
      if (beforeCursor.length > 0) {
        const firstPoint = beforeCursor[0];
        const firstX = xScale(new Date(firstPoint.timestamp));

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
              .x((d) => xScale(new Date(d.timestamp)))
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
          const firstX = xScale(new Date(firstPoint.timestamp));

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
                .x((d) => xScale(new Date(d.timestamp)))
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

      // If no cursor position, draw entire line as solid
      if (emissionsData.length > 0) {
        // Add vertical line from 0 to first point
        const firstPoint = emissionsData[0];
        const firstX = xScale(new Date(firstPoint.timestamp));

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
              .x((d) => xScale(new Date(d.timestamp)))
              .y((d) => yScale(d.value))
              .curve(d3.curveLinear)
          ); // Use linear curve for vertical line

        // Draw the main line
        g.append("path").datum(emissionsData).attr("class", styles.pastPath).attr("d", line);
      }
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
      const isPast = new Date(d.timestamp) <= today;

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
    // Keep track of used positions by x-coordinate range to prevent overlap
    const usedPositionsByXRange = {};
    const minSpacing = 20; // Minimum vertical spacing between event labels
    const xRangeWidth = 0; // Consider markers within 50px of each other as potentially overlapping

    emissionsData.forEach((d) => {
      const x = xScale(new Date(d.timestamp));
      const y = yScale(d.value);
      const isPast = new Date(d.timestamp) <= today;

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
          isBeforeCursor = new Date(d.timestamp) <= cursorDate;
        }

        // Draw the event box with different styling based on cursor position
        g.append("rect")
          .attr("x", x - eventBoxSize / 2)
          .attr("y", eventBoxY - eventBoxSize / 2)
          .attr("width", eventBoxSize)
          .attr("height", eventBoxSize)
          .attr("fill", isBeforeCursor ? "black" : "var(--accent)"); // Gray for future events

        g.append("text")
          .attr("x", x)
          .attr("y", eventBoxY)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "18px")
          .attr("fill", isBeforeCursor ? "white" : "black") // White text on black, black text on gray
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
          //   .attr("stroke", isBeforeCursor ? "black" : "var(--accent)") // No black border for future events
          //GARRETT - ADD BACK IN IF WANTED
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
