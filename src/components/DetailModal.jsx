import { useCallback, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import "./DetailModal.css";

function DetailModal({ pixel, onClose, structuralConnections }) {
  const dispatch = useDispatch();
  const [timelinePosition, setTimelinePosition] = useState(0); // 0-1 position in timeline
  const [isModelExpanded, setIsModelExpanded] = useState(false);

  // More irregular but still increasing data
  const distanceData = [2, 3, 8, 9, 15, 16, 22, 23, 28, 30];
  const carbonData = [1, 1.2, 3, 3.2, 5, 5.5, 8, 8.2, 9.5, 10];

  // Mock timeline data - in real app this would come from props/API
  const timelineEvents = [
    { date: "2024-01", type: "location", from: "Boston", to: "Venice", id: 1 },
    { date: "2024-02", type: "metric", name: "CO2", value: "+2.5 tons", id: 2 },
    { date: "2024-03", type: "location", from: "Venice", to: "New York", id: 3 },
    { date: "2024-04", type: "metric", name: "Energy", value: "+15%", id: 4 },
    { date: "2024-05", type: "location", from: "New York", to: "London", id: 5 },
  ];

  // Update health status to use technical terms
  const healthStatus = "nominal"; // could be "nominal", "degraded", or "critical"

  const getHealthColor = (status) => {
    switch (status) {
      case "nominal":
        return "#4CAF50"; // Green
      case "degraded":
        return "#FFC107"; // Yellow
      case "critical":
        return "#F44336"; // Red
      default:
        return "#4CAF50";
    }
  };

  const handleTimelineScroll = (e) => {
    const scrollWidth = e.target.scrollWidth - e.target.clientWidth;
    const position = Math.min(e.target.scrollLeft / scrollWidth, 1);
    setTimelinePosition(position);
  };

  const generateSparkline = (data, height) => {
    const max = Math.max(...data);
    const min = 0;
    const range = max - min;
    const width = 300;
    const segmentWidth = width / (data.length - 1);

    // Calculate the split point for current vs future data
    const splitIndex = Math.floor(timelinePosition * (data.length - 1));

    let currentPath = "";
    let futurePath = "";

    data.forEach((value, index) => {
      const x = index * segmentWidth;
      const y = height - ((value - min) / range) * height;

      if (index === 0) {
        currentPath += `M ${x},${y}`;
      } else {
        const prevX = (index - 1) * segmentWidth;
        const prevY = height - ((data[index - 1] - min) / range) * height;

        const pathSegment = ` L ${prevX},${y} L ${x},${y}`;
        if (index <= splitIndex) {
          currentPath += pathSegment;
        } else {
          if (futurePath === "") {
            // Start future path where current path ends
            futurePath = `M ${prevX},${prevY}`;
          }
          futurePath += pathSegment;
        }
      }
    });

    return { currentPath, futurePath };
  };

  const handleModalClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handlePixelClick = (pixelId) => {
    // TODO: Implement navigation to clicked pixel
    console.log(`Navigate to pixel ${pixelId}`);
  };

  // Generate mini connection visualization
  const generateConnectionVisualization = () => {
    const width = 300;
    const height = 53; // Increased by 1.33x from 40
    const centerX = width / 2;
    const centerY = height / 2;
    const pixelSize = 16; // Increased by 1.33x from 12
    const spacing = 19; // Increased by 1.33x from 14

    return (
      <svg width={width} height={height} className="connection-svg">
        {/* Center pixel */}
        <rect
          x={centerX - pixelSize / 2}
          y={centerY - pixelSize / 2}
          width={pixelSize}
          height={pixelSize}
          className="connection-current"
        />

        {/* Beam connections */}
        {structuralConnections.beams.map((_, index) => (
          <rect
            key={`beam-${index}`}
            x={centerX + (index + 1) * spacing - pixelSize / 2}
            y={centerY - pixelSize / 2}
            width={pixelSize}
            height={pixelSize}
            className="connection-beam"
          />
        ))}

        {/* Column connections */}
        {structuralConnections.columns.map((_, index) => (
          <rect
            key={`column-${index}`}
            x={centerX - pixelSize / 2}
            y={centerY - (index + 1) * spacing - pixelSize / 2}
            width={pixelSize}
            height={pixelSize}
            className="connection-column"
          />
        ))}

        {/* Connection lines */}
        <g className="connection-lines">
          {structuralConnections.beams.map((_, index) => (
            <line
              key={`beam-line-${index}`}
              x1={centerX}
              y1={centerY}
              x2={centerX + (index + 1) * spacing}
              y2={centerY}
              className="connection-line"
            />
          ))}
          {structuralConnections.columns.map((_, index) => (
            <line
              key={`column-line-${index}`}
              x1={centerX}
              y1={centerY}
              x2={centerX}
              y2={centerY - (index + 1) * spacing}
              className="connection-line"
            />
          ))}
        </g>
      </svg>
    );
  };

  return (
    <div className="detail-modal" onClick={handleModalClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>PIXEL {pixel.id}</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className={`modal-model ${isModelExpanded ? "expanded" : ""}`}>
          <div className="dot-grid"></div>
          <button className="model-expand-button" onClick={() => setIsModelExpanded(!isModelExpanded)}>
            {isModelExpanded ? "[-]" : "[+]"}
          </button>
          <model-viewer
            src="/other.glb"
            alt={`Pixel ${pixel.id}`}
            shadow-intensity=".5"
            environment-image="neutral"
            camera-orbit="0deg 0deg 2.5m"
            exposure="1"
            environment-intensity="2"
            auto-rotate
            camera-controls
            style={{
              width: isModelExpanded ? "100vw" : "100%",
              height: isModelExpanded ? "80vh" : "200px",
              maxWidth: "100%",
              position: "relative",
              zIndex: 1,
            }}
          />
        </div>

        <div className="spark-metrics">
          <div className="metrics-header">
            <div className="health-indicator">
              <span className="spark-label">Status</span>
              <div className="health-status">
                <div className="health-dot" style={{ backgroundColor: getHealthColor(healthStatus) }} />
                <span className="health-label">{healthStatus}</span>
              </div>
            </div>
          </div>

          <div className="structural-connections">
            <span className="spark-label">Connections</span>
            <div className="connection-details">
              <div className="connection-viz">{generateConnectionVisualization()}</div>
              <div className="connection-list">
                <div className="connection-type">
                  <span>BEAM-02:</span>
                  {structuralConnections.beams.map((id, index) => (
                    <span key={id}>
                      <span className="clickable-pixel" onClick={() => handlePixelClick(id)}>
                        {id}
                      </span>
                      {index < structuralConnections.beams.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="spark-row compact">
            <span className="spark-label">Distance</span>
            <div className="sparkline">
              <svg width="300" height="30" className="spark-svg">
                {/* Current data path */}
                <path d={generateSparkline(distanceData, 25).currentPath} className="current-path" />
                {/* Future data path */}
                <path d={generateSparkline(distanceData, 25).futurePath} className="future-path" />
                {/* Position indicator */}
                <circle
                  cx={timelinePosition * 300}
                  cy={
                    25 -
                    (distanceData[Math.floor(timelinePosition * (distanceData.length - 1))] /
                      Math.max(...distanceData)) *
                      25
                  }
                  r="3"
                  className="position-indicator"
                />
              </svg>
              <span className="spark-value">30,240 km</span>
            </div>
          </div>

          <div className="spark-row compact">
            <span className="spark-label">Carbon</span>
            <div className="sparkline">
              <svg width="300" height="30" className="spark-svg">
                <path d={generateSparkline(carbonData, 25).currentPath} className="current-path" />
                <path d={generateSparkline(carbonData, 25).futurePath} className="future-path" />
                <circle
                  cx={timelinePosition * 300}
                  cy={
                    25 -
                    (carbonData[Math.floor(timelinePosition * (carbonData.length - 1))] / Math.max(...carbonData)) * 25
                  }
                  r="3"
                  className="position-indicator"
                />
              </svg>
              <span className="spark-value">10.0 tons</span>
            </div>
          </div>
        </div>

        <div className="timeline-container">
          <div className="timeline-scroll" onScroll={handleTimelineScroll}>
            {timelineEvents.map((event) => (
              <div key={event.id} className={`timeline-event ${event.type}`}>
                <div className="event-date">{event.date}</div>
                {event.type === "location" ? (
                  <div className="event-content">
                    <span className="event-title">Relocated</span>
                    <div className="event-details">
                      {event.from} → {event.to}
                    </div>
                  </div>
                ) : (
                  <div className="event-content">
                    <span className="event-title">{event.name}</span>
                    <div className="event-details">{event.value}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="scroll-indicator">. . . .</div>
        </div>
      </div>
    </div>
  );
}

export default DetailModal;
