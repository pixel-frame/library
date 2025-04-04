import { useRef, useEffect } from "react";
import styles from "./LogCardContainer.module.css";
import LogCard from "./LogCard";

const LogCardContainer = ({ timelineEvents, travelData, currentEventIndex, onNavigate, pixelNumber }) => {
  const containerRef = useRef(null);

  // Scroll to the current card when the index changes
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const cards = container.querySelectorAll(`.${styles.logCardItem}`);

      if (cards[currentEventIndex]) {
        cards[currentEventIndex].scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentEventIndex]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft" && currentEventIndex > 0) {
      onNavigate("prev");
    } else if (e.key === "ArrowRight" && currentEventIndex < timelineEvents.length - 1) {
      onNavigate("next");
    }
  };

  const isPrevDisabled = currentEventIndex <= 0;
  const isNextDisabled = currentEventIndex >= timelineEvents.length - 1;

  return (
    <div className={styles.logCardContainerWrapper}>
      <div
        className={`${styles.navButton} ${styles.leftNavButton} ${isPrevDisabled ? styles.disabledButton : ""}`}
        onClick={() => !isPrevDisabled && onNavigate("prev")}
        aria-label="Previous event"
        disabled={isPrevDisabled}
      >
        ←
      </div>

      <div
        className={styles.logCardScroller}
        ref={containerRef}
        onKeyDown={handleKeyDown}
        tabIndex="0"
        aria-label="Event carousel"
      >
        <div className={styles.logCardTrack}>
          {timelineEvents.map((event, index) => {
            // Find the travel data that corresponds to this event
            const eventDate = new Date(event.date);
            const eventTravel =
              travelData.find((t) => t.timestamp === event.date) ||
              travelData.reduce((prev, curr) => {
                const prevDiff = Math.abs(new Date(prev.timestamp) - eventDate);
                const currDiff = Math.abs(new Date(curr.timestamp) - eventDate);
                return currDiff < prevDiff ? curr : prev;
              });

            return (
              <div
                key={event.id}
                className={`${styles.logCardItem} ${index === currentEventIndex ? styles.activeCard : ""}`}
                onClick={() => onNavigate(index)}
              >
                <LogCard travel={eventTravel} event={event} pixelNumber={pixelNumber} />
              </div>
            );
          })}
        </div>
      </div>

      <div
        className={`${styles.navButton} ${styles.rightNavButton} ${isNextDisabled ? styles.disabledButton : ""}`}
        onClick={() => !isNextDisabled && onNavigate("next")}
        aria-label="Next event"
        disabled={isNextDisabled}
      >
        →
      </div>
    </div>
  );
};

export default LogCardContainer;
