import { useState, useMemo, useEffect, useRef } from "react";
import styles from "./StoryTab.module.css";
import Timeline from "./Timeline";
import LogCardContainer from "./LogCardContainer";
import StoryTabLayout from "./StoryTabLayout";

const StoryTab = ({ pixel }) => {
  const [timelinePosition, setTimelinePosition] = useState(0.5); // Start in the middle
  const [currentData, setCurrentData] = useState({
    emission: null,
    travel: null,
    date: new Date(),
    emissionChange: "0.000",
  });
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const timelineRef = useRef(null);
  const isUpdatingFromTimelineRef = useRef(false);
  const isNavigatingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Timeline events - these will be scrollable cards
  const timelineEvents = useMemo(
    () => [
      {
        date: "2022-07",
        type: "fabrication",
        title: "Initial Fabrication",
        details: "First prototype generation",
        id: 1,
      },
      { date: "2022-07", type: "test", title: "Load Test", details: "Minor cracking and spalling", id: 2 },
      { date: "2023-04", type: "travel", title: "Transport to DC", details: "700 km via truck", id: 3 },
      { date: "2023-04", type: "exhibition", title: "DC Exhibition", details: "2 month showcase", id: 4 },
      { date: "2024-04", type: "travel", title: "Return to Cambridge", details: "700 km via truck", id: 5 },
      { date: "2024-04", type: "test", title: "Shear Test", details: "Coefficient analysis", id: 6 },
      { date: "2024-08", type: "travel", title: "Transport to Venice", details: "6377 km via plane", id: 7 },
      { date: "2024-12", type: "travel", title: "Milan Exhibition Prep", details: "267 km via truck", id: 8 },
      { date: "2025-03", type: "exhibition", title: "Venice Biennale", details: "8 month exhibition", id: 9 },
      { date: "2025-11", type: "travel", title: "Exhibition Close", details: "Return shipment", id: 10 },
    ],
    []
  );

  const emissionsData = useMemo(
    () => [
      { timestamp: "2022-07", value: 2.2952, event: "Initial Fabrication" },
      { timestamp: "2023-04", value: 2.48848, event: "DC Exhibition" },
      { timestamp: "2024-04", value: 2.48848, event: "Shear Testing" },
      { timestamp: "2024-08", value: 3.12, event: "Venice Transport" },
      { timestamp: "2025-03", value: 3.78, event: "Biennale Opening" },
      { timestamp: "2025-11", value: 4.25, event: "Exhibition Close" },
    ],
    []
  );

  const travelData = useMemo(
    () => [
      {
        timestamp: "2022-07",
        from: "Cambridge, MA",
        to: "Cambridge, MA",
        distance: "0",
        mode: "local",
      },
      {
        timestamp: "2023-04",
        from: "Cambridge, MA",
        to: "Washington DC",
        distance: "700",
        mode: "truck",
      },
      {
        timestamp: "2024-04",
        from: "Washington DC",
        to: "Cambridge, MA",
        distance: "700",
        mode: "truck",
      },
      {
        timestamp: "2024-08",
        from: "Cambridge, MA",
        to: "Venice, IT",
        distance: "6377.57",
        mode: "plane",
      },
      {
        timestamp: "2024-12",
        from: "Venice, IT",
        to: "Milan, IT",
        distance: "267.4",
        mode: "truck",
      },
      {
        timestamp: "2025-03",
        from: "Milan, IT",
        to: "Venice, IT",
        distance: "267.4",
        mode: "truck",
      },
    ],
    []
  );

  const calculateAge = (date) => {
    const start = new Date("2022-07");
    const diff = date - start;
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    return `${years}y, ${months}m`;
  };

  const handleTimelineScroll = (e) => {
    if (!timelineRef.current) return;

    const scrollWidth = timelineRef.current.scrollWidth - timelineRef.current.clientWidth;
    const position = Math.min(e.target.scrollLeft / scrollWidth, 1);
    setTimelinePosition(position);
  };

  const handleTimelinePositionChange = (position) => {
    if (isNavigatingRef.current) return;
    isUpdatingFromTimelineRef.current = true;
    setTimelinePosition(position);
    isUpdatingFromTimelineRef.current = false;
  };

  // Calculate min and max values from emissions data with proper padding
  const minValue = useMemo(() => {
    const min = Math.min(...emissionsData.map((d) => d.value));
    // Round down to nearest 0.5 and subtract 0.5 for padding
    return Math.floor(min * 2) / 2 + 0.5;
  }, [emissionsData]);

  const maxValue = useMemo(() => {
    const max = Math.max(...emissionsData.map((d) => d.value));
    // Round up to nearest 0.5 and add 0.5 for padding
    return Math.ceil(max * 2) / 2 - 0.5;
  }, [emissionsData]);

  // Generate y-axis labels with fixed step size
  const yAxisLabels = useMemo(() => {
    const labels = [];
    const step = 0.5; // Fixed step of 0.5 units
    const count = Math.ceil((maxValue - minValue) / step) + 1;

    for (let i = 0; i < count; i++) {
      const value = maxValue - step * i;
      if (value >= minValue) {
        labels.push(value.toFixed(1));
      }
    }

    return labels;
  }, [minValue, maxValue]);

  // Navigate to a specific event
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

    // Update timeline position based on the event date
    const eventDate = new Date(timelineEvents[newIndex].date);
    const startDate = new Date("2022-07");
    const endDate = new Date("2026-01");
    const newPosition = (eventDate - startDate) / (endDate - startDate);

    // Update timeline position
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

  // Update generateEmissionsPaths to use calculated bounds
  const generateEmissionsPaths = () => {
    const minDate = new Date("2022-07");
    const maxDate = new Date("2026-01");
    const dateRange = maxDate - minDate;

    const valueRange = maxValue - minValue;
    const height = 200;
    const width = 1000;

    // Find the cutoff point based on current timeline position
    const currentDate = new Date(minDate.getTime() + (maxDate.getTime() - minDate.getTime()) * timelinePosition);

    // Generate past path (solid)
    let pastPath = "";
    let futurePathStart = "";
    let isPastPathComplete = false;

    // Find the last point that's in the past
    let lastPastIndex = 0;
    for (let i = 0; i < emissionsData.length; i++) {
      if (new Date(emissionsData[i].timestamp) > currentDate) {
        lastPastIndex = Math.max(0, i - 1);
        break;
      }
      if (i === emissionsData.length - 1) {
        lastPastIndex = i;
      }
    }

    // Generate both paths
    emissionsData.forEach((point, i) => {
      const x = ((new Date(point.timestamp) - minDate) / dateRange) * width;
      const y = height - ((point.value - minValue) / valueRange) * height;

      if (i === 0) {
        pastPath += `M ${x} ${y}`;
      } else {
        // If this point is past the cutoff and we haven't completed the past path
        if (new Date(point.timestamp) > currentDate && !isPastPathComplete) {
          // Calculate the interpolation point at exactly currentDate
          const prevPoint = emissionsData[i - 1];
          const prevDate = new Date(prevPoint.timestamp);
          const prevX = ((prevDate - minDate) / dateRange) * width;
          const prevY = height - ((prevPoint.value - minValue) / valueRange) * height;

          // Linear interpolation between prev point and current point
          const totalDateDiff = new Date(point.timestamp) - prevDate;
          const currentDateDiff = currentDate - prevDate;
          const ratio = currentDateDiff / totalDateDiff;

          const interpX = prevX + (x - prevX) * ratio;
          const interpY = prevY + (y - prevY) * ratio;

          // Complete the past path to the interpolation point
          pastPath += ` L ${interpX} ${interpY}`;

          // Start the future path from the interpolation point
          futurePathStart = `M ${interpX} ${interpY} L ${x} ${y}`;
          isPastPathComplete = true;
        } else if (isPastPathComplete) {
          // Continue the future path
          futurePathStart += ` L ${x} ${y}`;
        } else {
          // Continue the past path
          pastPath += ` L ${x} ${y}`;
        }
      }
    });

    return { pastPath, futurePath: futurePathStart };
  };

  // Calculate the current position on the emissions graph
  const getCurrentEmissionPoint = () => {
    if (!currentData.emission) return { x: 0, y: 0 };

    const minDate = new Date("2022-07");
    const maxDate = new Date("2026-01");
    const dateRange = maxDate - minDate;

    const valueRange = maxValue - minValue;
    const height = 200;
    const width = 1000;

    const x = ((new Date(currentData.emission.timestamp) - minDate) / dateRange) * width;
    const y = height - ((currentData.emission.value - minValue) / valueRange) * height;

    return { x, y };
  };

  // Update current data whenever timeline position changes
  useEffect(() => {
    if (isNavigatingRef.current) return;

    // Calculate current date based on position (2022-07 to 2026-01)
    const startDate = new Date("2022-07");
    const endDate = new Date("2026-01");
    const currentDate = new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) * timelinePosition);

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
  }, [timelinePosition, emissionsData, travelData]);

  // Find the current event index based on the current date
  useEffect(() => {
    if (!currentData.date || isNavigatingRef.current) return;

    const currentDate = currentData.date;
    let nearestIndex = 0;
    let smallestDiff = Infinity;

    timelineEvents.forEach((event, index) => {
      const eventDate = new Date(event.date);
      const diff = Math.abs(eventDate - currentDate);

      if (diff < smallestDiff) {
        smallestDiff = diff;
        nearestIndex = index;
      }
    });

    // Only update if the event index is changing
    if (nearestIndex !== currentEventIndex) {
      setCurrentEventIndex(nearestIndex);
    }
  }, [currentData.date, timelineEvents, currentEventIndex]);

  // Generate x-axis labels for the emissions graph
  const generateTimeLabels = () => {
    const startDate = new Date("2022-07");
    const endDate = new Date("2026-01");
    const labels = [];

    let previousYear = null;

    // Create labels for each year
    for (let year = 2022; year <= 2026; year++) {
      // For 2022, start from July
      const startMonth = year === 2022 ? 6 : 0;
      // For 2026, only include January
      const endMonth = year === 2026 ? 0 : 11;

      for (let month = startMonth; month <= endMonth; month += 3) {
        const date = new Date(year, month);
        if (date >= startDate && date <= endDate) {
          const position = ((date - startDate) / (endDate - startDate)) * 100;

          // Only include year in label if it's a new year
          const showYear = previousYear !== year;
          previousYear = year;

          labels.push({
            date,
            position,
            label: showYear ? date.toLocaleDateString("en-US", { year: "numeric" }) : "",
          });
        }
      }
    }

    return labels;
  };

  // Update the renderEmissionsGraph function to use the separate paths
  const renderEmissionsGraph = () => {
    if (!currentData.emission) return null;

    const currentPoint = getCurrentEmissionPoint();
    const { pastPath, futurePath } = generateEmissionsPaths();
    const timeLabels = generateTimeLabels();

    return (
      <div className={styles.graphContainer} role="region" aria-label="Pixel emissions graph over time">
        <p id="emissions-heading">PIXEL EMISSIONS OVER TIME</p>
        <div className={styles.graph} aria-describedby="emissions-heading">
          <div className={styles.yAxis} aria-hidden="true">
            {yAxisLabels.map((label, index) => (
              <div key={index}>{label}</div>
            ))}
          </div>
          <div className={styles.plotArea}>
            <svg
              width="100%"
              height="200"
              viewBox="0 0 1000 200"
              preserveAspectRatio="xMidYMid meet"
              aria-label={`Emissions graph showing ${currentData.emission.value.toFixed(
                2
              )} kg CO2 at age ${calculateAge(currentData.date)}`}
              role="img"
            >
              <desc>Line graph showing carbon emissions over time</desc>

              {/* Grid Pattern Definition */}
              <defs>
                <pattern id="emissionsGrid" width={1000 / 6} height={200 / 6} patternUnits="userSpaceOnUse">
                  <path
                    d={`M ${1000 / 6} 0 L 0 0 0 ${200 / 6}`}
                    fill="none"
                    stroke="var(--border-color)"
                    strokeWidth="1"
                    strokeOpacity="0.3"
                  />
                </pattern>
              </defs>

              {/* Grid Background */}
              <rect width="1000" height="200" fill="url(#emissionsGrid)" stroke="none" />

              {/* Past data path (solid) */}
              <path
                d={pastPath}
                stroke="var(--text-primary)"
                fill="none"
                strokeWidth="4"
                aria-hidden="true"
                className={styles.pastPath}
              />

              {/* Future data path (dotted) */}
              <path
                d={futurePath}
                stroke="var(--text-primary)"
                fill="none"
                strokeWidth="1"
                strokeDasharray="8,8"
                aria-hidden="true"
                className={styles.futurePath}
              />

              {/* Points at each emission data point */}
              {emissionsData.map((point, i) => {
                const minDate = new Date("2022-07");
                const maxDate = new Date("2026-01");
                const dateRange = maxDate - minDate;

                const valueRange = maxValue - minValue;
                const x = ((new Date(point.timestamp) - minDate) / dateRange) * 1000;
                const y = 200 - ((point.value - minValue) / valueRange) * 200;

                const isPastPoint = new Date(point.timestamp) <= new Date(currentData.date);

                // Find the corresponding event index for this emission point
                const correspondingEventIndex = timelineEvents.findIndex((event) => event.date === point.timestamp);

                const handlePointClick = () => {
                  if (correspondingEventIndex >= 0) {
                    navigateToEvent(correspondingEventIndex);
                  }
                };

                return (
                  <g
                    key={i}
                    onClick={handlePointClick}
                    onKeyDown={(e) => e.key === "Enter" && handlePointClick()}
                    tabIndex="0"
                    role="button"
                    aria-label={`Navigate to ${point.event} with emissions of ${point.value.toFixed(2)} kgCO2`}
                    className={styles.emissionPoint}
                  >
                    <rect
                      x={x - 24}
                      y={y - 24}
                      width={48}
                      height={48}
                      className={styles.plotPointBackground}
                      fill={isPastPoint ? "var(--text-primary)" : "var(--accent)"}
                    />
                    <text
                      x={x}
                      y={y}
                      className={styles.plotPoint}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="48"
                      fill={isPastPoint ? "var(--bg-primary)" : "var(--text-primary)"}
                    >
                      *
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* X-Axis Time Labels */}
            <div className={styles.xAxis} aria-hidden="true">
              {timeLabels.map((item, index) => (
                <span key={index} style={{ left: `${item.position}%` }}>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
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
      </div>
    );
  };

  const handleMouseDown = (e) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    updateTimelineFromMousePosition(e);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    updateTimelineFromMousePosition(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateTimelineFromMousePosition = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    handleTimelinePositionChange(position);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Add touch event handlers for mobile
  const handleTouchStart = (e) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    updateTimelineFromTouchPosition(e);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    updateTimelineFromTouchPosition(e);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const updateTimelineFromTouchPosition = (e) => {
    if (!containerRef.current || !e.touches[0]) return;
    const rect = containerRef.current.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));
    handleTimelinePositionChange(position);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    } else {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging]);

  return (
    <div className={styles.storyTab} ref={containerRef} onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}>
      <div className={styles.timeIndicator} style={{ left: `${timelinePosition * 100}%` }} aria-hidden="true" />
      <StoryTabLayout
        emissionsGraph={renderEmissionsGraph()}
        logContainer={
          <LogCardContainer
            timelineEvents={timelineEvents}
            travelData={travelData}
            currentEventIndex={currentEventIndex}
            onNavigate={navigateToEvent}
          />
        }
        timeline={
          <Timeline
            ref={timelineRef}
            onPositionChange={handleTimelinePositionChange}
            currentPosition={timelinePosition}
            timelineEvents={timelineEvents}
            onEventClick={(index) => navigateToEvent(index)}
          />
        }
      />
    </div>
  );
};

export default StoryTab;
