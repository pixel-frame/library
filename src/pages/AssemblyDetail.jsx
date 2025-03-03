import React from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import AssemblyModel from "../components/models/AssemblyModel";
import ModelPreview from "../components/models/ModelPreview";
import DetailGrid from "../components/grids/DetailGrid";
import "./AssemblyDetail.css";

const AssemblyDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const assembly = location.state?.assembly;
  console.log(assembly);
  if (!assembly) return <div className="error-message">Assembly not found</div>;

  return (
    <div className="assembly-detail-page">
      <Link to="/assemblies" className="back-button" aria-label="Back to assemblies list" tabIndex="0">
        ← Back to Assemblies
      </Link>

      <h1>{assembly.name}</h1>

      <div className="assembly-content">
        <div className="assembly-model-container">
          <ModelPreview>
            <AssemblyModel modelPath={assembly.thumbnail} />
          </ModelPreview>
        </div>

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
