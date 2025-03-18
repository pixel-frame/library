import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import * as d3 from "d3";
import styles from "./Timeline.module.css";

const Timeline = forwardRef(({ onPositionChange, currentPosition, timelineEvents = [], onEventClick }, ref) => {
  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const timelineRef = useRef(null);

  // Define the date range for the timeline
  const startDate = new Date("2022-07-01");
  const endDate = new Date("2026-01-01");
  const totalMonths = 42; // 3.5 years

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    scrollToPosition: (position) => {
      if (!scrollContainerRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const contentWidth = totalMonths * 30; // 30px per month
      const timelineWidth = contentWidth + containerWidth;
      const maxScroll = timelineWidth - containerWidth;
      const scrollPosition = position * maxScroll;

      scrollContainerRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    },
  }));

  useEffect(() => {
    if (!containerRef.current || !scrollContainerRef.current) return;

    // Get container dimensions
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = 120;

    // Calculate timeline width - add padding equal to half container width on each side
    // This allows the first and last dates to be centered
    const contentWidth = totalMonths * 30; // 30px per month
    const timelineWidth = contentWidth + containerWidth;

    // Create SVG element
    const svg = d3.select(timelineRef.current).attr("width", timelineWidth).attr("height", containerHeight);

    // Clear any existing SVG content
    svg.selectAll("*").remove();

    // Create a time scale with padding on both sides
    const timeScale = d3
      .scaleTime()
      .domain([startDate, endDate])
      .range([containerWidth / 2, timelineWidth - containerWidth / 2]);

    // Define tick heights
    const monthTickHeight = 10; // Half the size of quarter ticks
    const quarterTickHeight = 12;
    const yearTickHeight = monthTickHeight * 3;
    const timelineY = 30; // Position of the horizontal line (top of the timeline)

    // Create horizontal timeline line - limit to the actual timeline range
    svg
      .append("line")
      .attr("x1", timeScale(startDate))
      .attr("x2", timeScale(endDate))
      .attr("y1", timelineY)
      .attr("y2", timelineY)
      .attr("stroke", "var(--text-primary)")
      .attr("stroke-width", 1);

    // Add month ticks (smaller)
    const months = d3.timeMonth.range(startDate, endDate);
    svg
      .selectAll(".month-tick")
      .data(months)
      .enter()
      .append("line")
      .attr("class", styles.monthTick)
      .attr("x1", (d) => timeScale(d))
      .attr("x2", (d) => timeScale(d))
      .attr("y1", timelineY)
      .attr("y2", timelineY + monthTickHeight)
      .attr("stroke", "var(--text-primary)")
      .attr("stroke-width", 1);

    // Add quarter ticks (medium)
    const quarters = d3.timeMonth.range(startDate, endDate, 3);
    svg
      .selectAll(".quarter-tick")
      .data(quarters)
      .enter()
      .append("line")
      .attr("class", styles.quarterTick)
      .attr("x1", (d) => timeScale(d))
      .attr("x2", (d) => timeScale(d))
      .attr("y1", timelineY)
      .attr("y2", timelineY + quarterTickHeight)
      .attr("stroke", "var(--text-primary)")
      .attr("stroke-width", 1);

    // Add year ticks (taller)
    const years = d3.timeYear.range(startDate, endDate);
    svg
      .selectAll(".year-tick")
      .data(years)
      .enter()
      .append("line")
      .attr("class", styles.yearMarker)
      .attr("x1", (d) => timeScale(d))
      .attr("x2", (d) => timeScale(d))
      .attr("y1", timelineY)
      .attr("y2", timelineY + yearTickHeight)
      .attr("stroke", "var(--text-primary)")
      .attr("stroke-width", 1.5);

    // Add year labels
    svg
      .selectAll(".year-label")
      .data(years)
      .enter()
      .append("text")
      .attr("class", styles.yearLabel)
      .attr("x", (d) => timeScale(d))
      .attr("y", timelineY + yearTickHeight + 15)
      .attr("text-anchor", "middle")
      .text((d) => d.getFullYear());

    // Add event markers with click handlers
    if (timelineEvents.length > 0) {
      const eventMarkers = svg
        .selectAll(".event-marker")
        .data(timelineEvents)
        .enter()
        .append("g")
        .attr("class", styles.eventMarker)
        .attr("transform", (d) => `translate(${timeScale(new Date(d.date))}, ${timelineY - 20})`)
        .style("cursor", "pointer");

      // Add the star symbol
      eventMarkers
        .append("text")
        .attr("class", (d) => `${styles.eventStar} ${styles[d.type] || ""}`)
        .attr("text-anchor", "middle")
        .text("*");

      // Add invisible click area (larger than the star)
      eventMarkers
        .append("rect")
        .attr("x", -15)
        .attr("y", -15)
        .attr("width", 30)
        .attr("height", 30)
        .attr("fill", "transparent")
        .on("click", (event, d) => {
          const index = timelineEvents.findIndex((e) => e.id === d.id);
          if (index !== -1 && onEventClick) {
            onEventClick(index);
          }
        });
    }

    // Add center indicator and date display
    const centerIndicator = d3.select(containerRef.current).append("div").attr("class", styles.centerIndicator);

    const dateDisplay = d3.select(containerRef.current).append("div").attr("class", styles.currentDateDisplay);

    // Handle scroll events
    function handleScroll() {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const centerX = scrollLeft + containerWidth / 2;

      // Calculate the date at the center position
      const dateAtCenter = timeScale.invert(centerX);

      // Format and display the date
      const formattedDate = dateAtCenter.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });

      dateDisplay.text(formattedDate);

      // Calculate position as percentage (0-1) for external components
      const maxScroll = timelineWidth - containerWidth;
      const position = maxScroll > 0 ? scrollLeft / maxScroll : 0;
      onPositionChange?.(position);
    }

    // Attach scroll event listener
    scrollContainerRef.current.addEventListener("scroll", handleScroll);

    // Set initial scroll position based on currentPosition
    if (currentPosition !== undefined) {
      const maxScroll = timelineWidth - containerWidth;
      const scrollPosition = currentPosition * maxScroll;
      scrollContainerRef.current.scrollLeft = scrollPosition;
    } else {
      // Default to showing July 2022 at the center
      const initialDate = startDate;
      const initialX = timeScale(initialDate);
      const initialScrollPosition = initialX - containerWidth / 2;
      scrollContainerRef.current.scrollLeft = Math.max(0, initialScrollPosition);
    }

    // Initial update
    handleScroll();

    // Cleanup
    return () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.removeEventListener("scroll", handleScroll);
      }
      if (centerIndicator) centerIndicator.remove();
      if (dateDisplay) dateDisplay.remove();
    };
  }, [timelineEvents, onPositionChange, currentPosition, totalMonths, onEventClick]);

  return (
    <div className={styles.timelineWrapper}>
      <div className={styles.timelineContainer}>
        <div className={styles.scrollContainer} ref={containerRef}>
          <div className={styles.timelineScroll} ref={scrollContainerRef}>
            <svg ref={timelineRef} className={styles.timelineSvg}></svg>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Timeline;
