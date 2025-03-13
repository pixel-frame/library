import { useState, useRef, useEffect } from "react";
import styles from "./Timeline.module.css";

const Timeline = ({ onPositionChange, currentPosition, timelineEvents = [] }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const timelineRef = useRef(null);
  const startDate = new Date("2022-07");
  const endDate = new Date("2026-01");
  const dateRange = endDate - startDate;

  const updatePosition = (position) => {
    const clampedPosition = Math.max(0, Math.min(1, position));
    const currentTime = new Date(startDate.getTime() + dateRange * clampedPosition);

    setCurrentDate(
      currentTime.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    );

    onPositionChange?.(clampedPosition);
  };

  const handleScroll = (e) => {
    if (!timelineRef.current) return;

    const scrollWidth = timelineRef.current.scrollWidth - timelineRef.current.clientWidth;
    const position = Math.min(e.target.scrollLeft / scrollWidth, 1);
    updatePosition(position);
  };

  useEffect(() => {
    if (currentPosition !== undefined && timelineRef.current) {
      const scrollWidth = timelineRef.current.scrollWidth - timelineRef.current.clientWidth;
      timelineRef.current.scrollLeft = currentPosition * scrollWidth;
      updatePosition(currentPosition);
    }
  }, [currentPosition]);

  const getEventIcon = (type) => {
    switch (type) {
      case "fabrication":
        return "🏗️";
      case "test":
        return "🔬";
      case "travel":
        return "🚚";
      case "exhibition":
        return "🏛️";
      case "milestone":
        return "🎯";
      default:
        return "•";
    }
  };

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.currentDate}>{currentDate}</div>
      <div
        ref={timelineRef}
        className={styles.timelineScroll}
        onScroll={handleScroll}
        role="slider"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={currentPosition * 100}
        tabIndex="0"
      >
        <div className={styles.timeline}>
          <div className={styles.timelineLine}>
            {/* Add markers for each month */}
            {Array.from({ length: 42 }, (_, i) => {
              const markerDate = new Date(startDate);
              markerDate.setMonth(markerDate.getMonth() + i);
              const position = ((markerDate - startDate) / dateRange) * 100;

              // Check if this date has an event
              const hasEvent = timelineEvents.some((event) => {
                const eventDate = new Date(event.date);
                return (
                  eventDate.getMonth() === markerDate.getMonth() && eventDate.getFullYear() === markerDate.getFullYear()
                );
              });

              return (
                <div
                  key={i}
                  className={`${styles.timelineMarker} ${hasEvent ? styles.eventMarker : ""}`}
                  style={{
                    left: `${position}%`,
                    height: hasEvent ? "12px" : "6px",
                  }}
                >
                  {hasEvent && <span className={styles.eventStar}>*</span>}
                </div>
              );
            })}

            {/* Current position indicator */}
            <div className={styles.timelineCursor} style={{ left: `${currentPosition * 100}%` }} />
          </div>

          <div className={styles.yearLabels}>
            <span>2022</span>
            <span>2023</span>
            <span>2024</span>
            <span>2025</span>
          </div>
        </div>

        <div className={styles.scrollPadding}></div>
      </div>
    </div>
  );
};

export default Timeline;
