import { useState, useRef, useEffect } from "react";
import styles from "./Timeline.module.css";

const Timeline = ({ onPositionChange, currentPosition, timelineEvents = [] }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const timelineRef = useRef(null);
  const startDate = new Date("2022-07");
  const endDate = new Date("2026-01");
  const dateRange = endDate - startDate;

  const updatePosition = (scrollLeft, scrollWidth) => {
    if (!timelineRef.current) return;

    const position = Math.max(0, Math.min(1, scrollLeft / scrollWidth));
    const currentTime = new Date(startDate.getTime() + dateRange * position);

    setCurrentDate(
      currentTime.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    );

    onPositionChange?.(position);
  };

  const handleScroll = (e) => {
    if (!timelineRef.current) return;
    const scrollWidth = timelineRef.current.scrollWidth - timelineRef.current.clientWidth;
    updatePosition(e.target.scrollLeft, scrollWidth);
  };

  // Initialize timeline to start position
  useEffect(() => {
    if (timelineRef.current) {
      // Set initial scroll position to align start date with center
      const centerOffset = timelineRef.current.clientWidth / 2;
      timelineRef.current.scrollLeft = 0;
      updatePosition(0, timelineRef.current.scrollWidth - timelineRef.current.clientWidth);
    }
  }, []);

  // Handle touch events
  const handleTouchStart = (e) => {
    setIsDragging(true);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !timelineRef.current) return;
    e.preventDefault(); // Prevent page scroll while dragging timeline
  };

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

  const handleArrowClick = (direction) => {
    if (!timelineRef.current) return;
    const scrollWidth = timelineRef.current.scrollWidth - timelineRef.current.clientWidth;
    const currentScroll = timelineRef.current.scrollLeft;
    const step = scrollWidth * 0.1; // 10% increment

    const newScroll =
      direction === "left" ? Math.max(0, currentScroll - step) : Math.min(scrollWidth, currentScroll + step);

    timelineRef.current.scrollTo({
      left: newScroll,
      behavior: "smooth",
    });
  };

  return (
    <div className={styles.timelineWrapper}>
      <div className={styles.currentDate}>{currentDate}</div>
      <div className={styles.timelineContainer}>
        <div className={styles.arrow} onClick={() => handleArrowClick("left")} aria-label="Scroll timeline left">
          ←
        </div>

        <div className={styles.scrollContainer}>
          <div className={styles.centerLineContainer}>
            <div className={styles.centerLine} />
            <div className={styles.centerDot} />
          </div>

          <div
            ref={timelineRef}
            className={styles.timelineScroll}
            onScroll={handleScroll}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            role="slider"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={currentPosition * 100}
            tabIndex="0"
          >
            <div className={styles.timeline}>
              <div className={styles.timelineLine}>
                {/* Timeline markers */}
                {Array.from({ length: 42 }, (_, i) => {
                  const markerDate = new Date(startDate);
                  markerDate.setMonth(markerDate.getMonth() + i);
                  const position = ((markerDate - startDate) / dateRange) * 100;

                  const hasEvent = timelineEvents.some((event) => {
                    const eventDate = new Date(event.date);
                    return (
                      eventDate.getMonth() === markerDate.getMonth() &&
                      eventDate.getFullYear() === markerDate.getFullYear()
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
              </div>

              <div className={styles.yearLabels}>
                <span>2022</span>
                <span>2023</span>
                <span>2024</span>
                <span>2025</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.arrow} onClick={() => handleArrowClick("right")} aria-label="Scroll timeline right">
          →
        </div>
      </div>
    </div>
  );
};

export default Timeline;
