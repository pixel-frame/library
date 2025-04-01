import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import AssemblyModel from "../components/models/AssemblyModel";
import ModelPreview from "../components/models/ModelPreview";
import DetailGrid from "../components/grids/DetailGrid";
import styles from "./AssemblyDetail.module.css";
import ExpandButton from "../components/buttons/ExpandButton";
import CloseButton from "../components/buttons/CloseButton";
import NetworkMatrix from "../components/datavis/NetworkMatrix";

const AssemblyDetail = ({ assemblyId, assembly: passedAssembly, fullData: passedFullData, onBack, isActive }) => {
  const { id: urlId } = useParams();
  const effectiveId = assemblyId || urlId;
  const location = useLocation();
  const [assembly, setAssembly] = useState(passedAssembly || null);
  const [loading, setLoading] = useState(!passedAssembly);
  const [error, setError] = useState(null);
  const [modelPath, setModelPath] = useState(null);
  const [fullData, setFullData] = useState(passedFullData || null);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpand = () => {
    setIsExpanded(true);
    document.body.style.overflow = "hidden";
  };

  // Check if we're being rendered as a tab in PixelDetail
  const isInPixelDetailTab = isActive !== undefined;

  const availableModels = ["0001", "0002", "0003", "0004", "0005", "0006", "0007", "0008", "0009", "0010", "0015"];

  const getModelSerial = (assembly) => {
    const modelMappings = {
      "0007": "0004",
    };
    const mappedSerial = modelMappings[assembly.serial] || assembly.serial;
    return availableModels.includes(mappedSerial) ? mappedSerial : null;
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

  const [mediaItems, setMediaItems] = useState([]);
  const [loadedItems, setLoadedItems] = useState([]);

  useEffect(() => {
    const loadMediaItems = () => {
      const items = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        title: `Assembly ${assembly.serial} - Image ${i + 1}`,
        url: `/data/media/${assembly.serial}/${i + 1}.JPG`,
      }));

      setMediaItems(items);
    };

    if (assembly) {
      loadMediaItems();
    }
  }, [assembly]);

  useEffect(() => {
    // If we already have the assembly data passed as props, use it
    if (passedAssembly && passedFullData) {
      setAssembly(passedAssembly);
      setFullData(passedFullData);

      const modelSerial = getModelSerial(passedAssembly);
      setModelPath(modelSerial ? `/data/models/assemblies/${modelSerial}.glb` : null);
      setLoading(false);
      return;
    }

    // Otherwise, if we have location state, use that
    if (location.state?.assembly) {
      setAssembly(location.state.assembly);
      setFullData({ reconfigurations: [location.state.assembly] });

      const modelSerial = getModelSerial(location.state.assembly);
      setModelPath(modelSerial ? `/data/models/assemblies/${modelSerial}.glb` : null);
      setLoading(false);
      return;
    }

    // As a fallback, fetch the data
    const fetchAssemblyDetail = async () => {
      try {
        const response = await fetch("/data/bank/assembly/assemblies.json");
        if (!response.ok) throw new Error("Failed to fetch assemblies");
        const data = await response.json();

        const foundAssembly = data.reconfigurations.find((assembly) => assembly.serial === effectiveId);
        if (!foundAssembly) throw new Error(`Assembly ${effectiveId} not found`);

        console.log("Assembly serial:", foundAssembly.serial);
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

    fetchAssemblyDetail();
  }, [effectiveId, location.state, passedAssembly, passedFullData]);

  if (loading) return <div className="loading-indicator">Loading assembly details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!assembly) return <div className="error-message">Assembly not found</div>;

  return (
    <div className={styles.container}>
      {/* Only show header when not in PixelDetail tab */}
      {!isInPixelDetailTab && (
        <div className={styles.header}>
          <p className={styles["pixel-title"]}> {assembly.name}</p>
        </div>
      )}

      <div className={styles.content}>
        {modelPath && (
          <div className={styles["assembly-model-container"]}>
            <ModelPreview isExpanded={isExpanded} onClose={(expand) => setIsExpanded(expand === true)}>
              {modelPath ? (
                <AssemblyModel
                  isExpanded={isExpanded}
                  isPreview={!isExpanded}
                  isInteractive={isExpanded}
                  modelPath={modelPath}
                  onExpand={!isExpanded ? handleExpand : null}
                />
              ) : (
                <div className={styles["no-model-message"]}>No 3D model available</div>
              )}
            </ModelPreview>
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
                title: "Generation",
                value: assembly.generation_name,
              },
              {
                title: "Scale",
                value: assembly.scale,
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
                value: `${assembly.pixel_weight} kg`,
                info: "Total weight of pixels used in assembly",
              },
              {
                title: "Transport Coefficient",
                value: assembly.transport.coefficient || "N/A",
                info: "Carbon emissions per kg per km transported (kgCO₂e/kg)",
              },
              {
                title: "A1-A3 Emissions",
                value: `${assembly.a1_a3_emissions} kg CO₂e`,
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
                value: `${assembly.total_emissions || "Not calculated"} kg CO₂e`,
                info: "Combined emissions from production and transport",
              },
            ]}
          />
        </div>

        <div className={styles["media-section"]}>
          <h2 className={styles["section-title"]}>Media</h2>
          <div className={styles["media-grid"]}>
            {mediaItems.map((item) => (
              <div
                key={item.id}
                className={styles["media-item"]}
                style={{ display: loadedItems.includes(item.id) ? "block" : "none" }}
              >
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
                <img
                  src={item.url}
                  alt={item.title}
                  className={styles["media-thumbnail"]}
                  loading="lazy"
                  onLoad={() => setLoadedItems((prev) => [...prev, item.id])}
                  onError={(e) => {
                    e.target.closest(".media-item").style.display = "none";
                  }}
                />
              </div>
            ))}
            {loadedItems.length === 0 && <div className={styles["no-media"]}>No images available</div>}
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
            <img
              src={fullscreenImage.url}
              alt={fullscreenImage.title}
              style={{
                maxWidth: "90vw",
                maxHeight: "80vh",
                objectFit: "contain",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AssemblyDetail;
