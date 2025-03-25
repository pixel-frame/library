import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import AssemblyModel from "../components/models/AssemblyModel";
import ModelPreview from "../components/models/ModelPreview";
import DetailGrid from "../components/grids/DetailGrid";
import styles from "./AssemblyDetail.module.css";
import ExpandButton from "../components/buttons/ExpandButton";
import CloseButton from "../components/buttons/CloseButton";
import NetworkMatrix from "../components/datavis/NetworkMatrix";
const AssemblyDetail = ({ assemblyId }) => {
  const { id: urlId } = useParams();
  const effectiveId = assemblyId || urlId;
  const location = useLocation();
  const [assembly, setAssembly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modelPath, setModelPath] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [fullData, setFullData] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const availableModels = ["0001", "0002", "0003", "0004", "0005", "0009", "0010"];

  const getModelSerial = (assembly) => {
    const modelMappings = {
      "0007": "0004",
    };
    const mappedSerial = modelMappings[assembly.serial] || assembly.serial;
    return availableModels.includes(mappedSerial) ? mappedSerial : null;
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleNavigateBack = () => {
    window.history.back();
  };

  const handleOpenFullscreen = (item) => {
    setFullscreenImage(item);
  };

  const handleCloseFullscreen = () => {
    setFullscreenImage(null);
  };

  const handleKeyDown = (e, action) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  useEffect(() => {
    const fetchAssemblyDetail = async () => {
      try {
        const response = await fetch("/data/bank/assembly/assemblies.json");
        if (!response.ok) throw new Error("Failed to fetch assemblies");
        const data = await response.json();

        const foundAssembly = data.reconfigurations.find((assembly) => assembly.serial === effectiveId);
        if (!foundAssembly) throw new Error(`Assembly ${effectiveId} not found`);

        setFullData(data);
        setAssembly(foundAssembly);

        const modelSerial = getModelSerial(foundAssembly);
        setModelPath(modelSerial ? `/data/models/assemblies/${modelSerial}.glb` : null);
        setLoading(false);
      } catch (err) {
        console.error("Error in fetchAssemblyDetail:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (location.state?.assembly) {
      setAssembly(location.state.assembly);
      setFullData({ reconfigurations: [location.state.assembly] });

      const modelSerial = getModelSerial(location.state.assembly);
      setModelPath(modelSerial ? `/data/models/assemblies/${modelSerial}.glb` : null);
      setLoading(false);
    } else {
      fetchAssemblyDetail();
    }
  }, [effectiveId, location.state]);

  if (loading) return <div className="loading-indicator">Loading assembly details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!assembly) return <div className="error-message">Assembly not found</div>;

  // Mock media items - replace with actual data when available
  const mediaItems = [
    { id: 1, title: "Assembly view 1" },
    { id: 2, title: "Assembly view 2" },
    { id: 3, title: "Assembly view 3" },
    { id: 4, title: "Assembly view 4" },
    { id: 5, title: "Assembly view 5" },
  ];

  return (
    <div className="assembly-detail-page">
      <div className={styles.backButtonContainer}>
        <CloseButton onClick={handleNavigateBack} ariaLabel="Back to assemblies list" />
      </div>

      <div className="assembly-content">
        {modelPath && (
          <div className={styles["assembly-model-container"]}>
            <ModelPreview isExpanded={isExpanded} onClose={() => setIsExpanded(false)}>
              {modelPath ? (
                <AssemblyModel modelPath={modelPath} />
              ) : (
                <div className={styles["no-model-message"]}>No 3D model available for this assembly</div>
              )}
            </ModelPreview>
            <div className={styles["pixel-header"]}>
              <p className={styles["pixel-title"]}>Assembly {assembly.serial}</p>
              <div className={styles["pixel-actions"]}>
                <ExpandButton onClick={handleExpand} />
              </div>
            </div>
          </div>
        )}

        <div className="assembly-info-container">
          <NetworkMatrix network={assembly.network} />
          <DetailGrid
            items={[
              {
                title: "Description",
                value: assembly.description || "No description available",
                fullWidth: true,
              },
              {
                title: "Date",
                value: new Date(assembly.date).toLocaleDateString(),
              },
              {
                title: "Location",
                value: assembly.location.name,
              },
              {
                title: "Coordinates",
                value: `${assembly.location.coordinates.latitude}, ${assembly.location.coordinates.longitude}`,
              },
              {
                title: "Pixel Weight",
                value: `${assembly.pixelWeight} kg`,
                info: "Total weight of pixels used in assembly",
              },
              {
                title: "Coefficient",
                value: assembly.coefficient,
                info: "Structural performance coefficient",
              },
              {
                title: "A1-A3 Emissions",
                value: `${assembly.a1A3Emissions} kg CO₂e`,
                info: "Production phase emissions",
              },
              {
                title: "Transport",
                value: `${assembly.transport.distance} km via ${assembly.transport.type || "N/A"}`,
              },
              {
                title: "Transport Emissions",
                value: `${assembly.transport.emissions} kg CO₂e`,
              },
              {
                title: "Total Emissions",
                value: `${assembly.totalEmissions || "Not calculated"} kg CO₂e`,
                info: "Combined emissions from production and transport",
              },
            ]}
          />
        </div>

        <div className={styles["media-section"]}>
          <h2 className={styles["section-title"]}>Media</h2>
          <div className={styles["media-grid"]}>
            {mediaItems.map((item) => (
              <div key={item.id} className={styles["media-item"]}>
                <div
                  className={styles["expand-icon"]}
                  onClick={() => handleOpenFullscreen(item)}
                  onKeyDown={(e) => handleKeyDown(e, () => handleOpenFullscreen(item))}
                  tabIndex="0"
                  role="button"
                  aria-label={`Expand ${item.title}`}
                >
                  ↗
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: "#666",
                  }}
                >
                  {item.title}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles["media-section"]}>
          <h2 className={styles["section-title"]}>JSON Data</h2>
          <div className={styles["json-display"]}>
            <pre>{JSON.stringify(fullData, null, 2)}</pre>
          </div>
        </div>
      </div>

      {fullscreenImage && (
        <div className={styles["fullscreen-overlay"]} onClick={handleCloseFullscreen}>
          <button
            className={styles["close-fullscreen"]}
            onClick={handleCloseFullscreen}
            aria-label="Close fullscreen view"
          >
            ✕
          </button>
          <div className={styles["fullscreen-image"]} onClick={(e) => e.stopPropagation()}>
            <h2>{fullscreenImage.title}</h2>
            <div
              style={{
                width: "80vw",
                height: "60vh",
                border: "2px solid white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "24px",
              }}
            >
              {fullscreenImage.title} - Fullscreen View
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssemblyDetail;
