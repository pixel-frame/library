import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import AssemblyModel from "../components/models/AssemblyModel";
import ModelPreview from "../components/models/ModelPreview";
import DetailGrid from "../components/grids/DetailGrid";
import styles from "./AssemblyDetail.module.css";
import ExpandButton from "../components/buttons/ExpandButton";
import CloseButton from "../components/buttons/CloseButton";

const AssemblyDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [assembly, setAssembly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modelPath, setModelPath] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const availableModels = ["0001", "0002", "0004", "0005", "0009", "0010"];

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

  useEffect(() => {
    const fetchAssemblyDetail = async () => {
      try {
        const response = await fetch("/data/bank/assembly/assemblies.json");
        if (!response.ok) throw new Error("Failed to fetch assemblies");
        const data = await response.json();

        const foundAssembly = data.reconfigurations.find((assembly) => assembly.serial === id);
        if (!foundAssembly) throw new Error("Assembly not found");

        console.log("Found assembly:", foundAssembly);
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
      console.log("Using assembly from location state:", location.state.assembly);
      setAssembly(location.state.assembly);
      const modelSerial = getModelSerial(location.state.assembly);
      setModelPath(modelSerial ? `/data/models/assemblies/${modelSerial}.glb` : null);
      setLoading(false);
    } else {
      console.log("Fetching assembly detail for id:", id);
      fetchAssemblyDetail();
    }
  }, [id, location.state]);

  if (loading) return <div className="loading-indicator">Loading assembly details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!assembly) return <div className="error-message">Assembly not found</div>;

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
                {modelPath && (
                  <button
                    className={styles["ar-button"]}
                    onClick={() => console.log("AR view")}
                    aria-label="View in AR"
                  >
                    <span className={styles["ar-icon"]}>[ AR ]</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="assembly-info-container">
          <DetailGrid
            items={[
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
      </div>
    </div>
  );
};

export default AssemblyDetail;
