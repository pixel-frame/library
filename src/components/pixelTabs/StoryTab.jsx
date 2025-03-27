import { useState, useMemo, useEffect, useRef } from "react";
import styles from "./StoryTab.module.css";
import LogCardContainer from "./LogCardContainer";
import CarbonLine from "./CarbonLine";

const StoryTab = ({ pixel }) => {
  const [timelinePosition, setTimelinePosition] = useState(0.5); // Start in the middle
  const [currentData, setCurrentData] = useState({
    emission: null,
    travel: null,
    date: new Date(),
    emissionChange: "0.000",
  });
  const [currentEventIndex, setCurrentEventIndex] = useState(0); // Default to first event
  const timelineRef = useRef(null);
  const isNavigatingRef = useRef(false);
  const containerRef = useRef(null);

  // Add date range calculations
  const dateRange = useMemo(() => {
    if (!pixel?.timeline || pixel.timeline.length === 0) {
      return {
        start: new Date(),
        end: new Date(),
      };
    }

    const dates = pixel.timeline.map((event) => new Date(event.date));
    const start = new Date(Math.min(...dates));
    const end = new Date(Math.max(...dates));

    // Add 3 months padding to end date for better visualization
    end.setMonth(end.getMonth() + 3);

    return { start, end };
  }, [pixel]);

  // Transform timeline data into required formats
  const timelineEvents = useMemo(() => {
    if (!pixel?.timeline) return [];

    return pixel.timeline.map((event) => ({
      date: new Date(event.date).toISOString().slice(0, 7), // Format: YYYY-MM
      type: event.name.toLowerCase().includes("test")
        ? "test"
        : event.name.toLowerCase().includes("transport")
        ? "travel"
        : event.name.toLowerCase().includes("exhibition")
        ? "exhibition"
        : "fabrication",
      title: event.name,
      details: event.description,
      id: event.step,
    }));
  }, [pixel]);

  const emissionsData = useMemo(() => {
    if (!pixel?.timeline) return [];

    return pixel.timeline.map((event) => ({
      timestamp: new Date(event.date).toISOString().slice(0, 10), // Format: YYYY-MM-DD
      value: event.emissions.running_total,
      event: event.name,
    }));
  }, [pixel]);

  const travelData = useMemo(() => {
    if (!pixel?.timeline) return [];

    return pixel.timeline.map((event) => ({
      timestamp: new Date(event.date).toISOString().slice(0, 7),
      from: event.transport?.type === "N/A" ? event.location?.name || "Unknown" : "",
      to: event.location?.name || "Unknown",
      distance: event.transport?.distance?.toString() || "0",
      mode: (event.transport?.type || "unknown").toLowerCase(),
    }));
  }, [pixel]);

  const calculateAge = (date) => {
    const diff = date - dateRange.start;
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    return `${years}y, ${months}m`;
  };

  // Update navigation logic to use dynamic date range
  const navigateToEvent = (direction) => {
    isNavigatingRef.current = true;

    let newIndex;
    if (direction === "next") {
      newIndex = Math.min(currentEventIndex + 1, timelineEvents.length - 1);
    } else if (direction === "prev") {
      newIndex = Math.max(currentEventIndex - 1, 0);
    } else if (typeof direction === "number") {
      newIndex = Math.max(0, Math.min(direction, timelineEvents.length - 1));
    } else {
      newIndex = currentEventIndex;
    }

    setCurrentEventIndex(newIndex);

    const eventDate = new Date(timelineEvents[newIndex].date);
    const newPosition = (eventDate - dateRange.start) / (dateRange.end - dateRange.start);

    setTimelinePosition(newPosition);

    // Explicitly scroll the timeline to the new position
    if (timelineRef.current) {
      timelineRef.current.scrollToPosition(newPosition);
    }

    // Find the emission data point closest to this event
    const closestEmission = emissionsData.reduce((prev, curr) => {
      const prevDiff = Math.abs(new Date(prev.timestamp) - eventDate);
      const currDiff = Math.abs(new Date(curr.timestamp) - eventDate);
      return currDiff < prevDiff ? curr : prev;
    });

    // Find the travel data point closest to this event
    const closestTravel = travelData.reduce((prev, curr) => {
      const prevDiff = Math.abs(new Date(prev.timestamp) - eventDate);
      const currDiff = Math.abs(new Date(curr.timestamp) - eventDate);
      return currDiff < prevDiff ? curr : prev;
    });

    // Calculate emission change
    const prevEmissionIndex = emissionsData.findIndex((e) => e.timestamp === closestEmission.timestamp) - 1;
    const emissionChange =
      prevEmissionIndex >= 0 ? (closestEmission.value - emissionsData[prevEmissionIndex].value).toFixed(3) : "0.000";

    // Update current data directly
    setCurrentData({
      emission: closestEmission,
      travel: closestTravel,
      date: eventDate,
      emissionChange,
    });

    // Allow timeline updates again after a short delay
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 500);
  };

  // Initialize with the first event when data is loaded
  useEffect(() => {
    if (timelineEvents.length > 0 && emissionsData.length > 0 && !isNavigatingRef.current) {
      navigateToEvent(0);
    }
  }, [timelineEvents.length, emissionsData.length]);

  // Update useEffect for current data to use dynamic date range
  useEffect(() => {
    if (isNavigatingRef.current) return;

    const currentDate = new Date(
      dateRange.start.getTime() + (dateRange.end.getTime() - dateRange.start.getTime()) * timelinePosition
    );

    // Find nearest emission data point
    const emission = emissionsData.reduce((prev, curr) => {
      const prevDiff = Math.abs(new Date(prev.timestamp) - currentDate);
      const currDiff = Math.abs(new Date(curr.timestamp) - currentDate);
      return currDiff < prevDiff ? curr : prev;
    });

    // Find nearest travel data point
    const travel = travelData.reduce((prev, curr) => {
      const prevDiff = Math.abs(new Date(prev.timestamp) - currentDate);
      const currDiff = Math.abs(new Date(curr.timestamp) - currentDate);
      return currDiff < prevDiff ? curr : prev;
    });

    // Calculate emission change
    const prevEmissionIndex = emissionsData.findIndex((e) => e.timestamp === emission.timestamp) - 1;
    const emissionChange =
      prevEmissionIndex >= 0 ? (emission.value - emissionsData[prevEmissionIndex].value).toFixed(3) : "0.000";

    setCurrentData({
      emission,
      travel,
      date: currentDate,
      emissionChange,
    });
  }, [timelinePosition, emissionsData, travelData, dateRange]);

  const renderEmissionsGraph = () => {
    if (!currentData.emission) return null;

    return (
      <div className={styles.graphContainer} role="region" aria-label="Pixel emissions graph over time">
        <p id="emissions-heading">PIXEL EMISSIONS OVER TIME</p>
        <div className={styles.emissionStats}>
          <div>
            <span>EMISSION CHANGE</span>
            <span className={styles.factoid}>▲ +{currentData.emissionChange} kgCO2</span>
          </div>
          <div>
            <span>TOTAL EMISSIONS</span>
            <span className={styles.factoid}>{currentData.emission.value.toFixed(4)} kgCO2</span>
          </div>
          <div>
            <span>Time</span>
            <span className={styles.factoid}>{calculateAge(currentData.date)}</span>
          </div>
        </div>
        <div className={styles.graph} aria-describedby="emissions-heading">
          <div className={styles.plotArea}>
            <CarbonLine
              emissionsData={emissionsData}
              currentDate={currentData.date}
              dateRange={dateRange}
              currentEventIndex={currentEventIndex}
              isActive={true}
              onEventChange={(index) => {
                if (!isNavigatingRef.current) {
                  navigateToEvent(index);
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.storyTab} ref={containerRef}>
      <div className={styles.emissionsSection}>
        <div className={styles.timeIndicator} style={{ left: `${timelinePosition * 100}%` }} aria-hidden="true" />
        {renderEmissionsGraph()}
      </div>
      <div className={styles.logSection}>
        <LogCardContainer
          timelineEvents={timelineEvents}
          travelData={travelData}
          currentEventIndex={currentEventIndex}
          onNavigate={navigateToEvent}
        />
      </div>
    </div>
  );
};

export default StoryTab;
