import React from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import AssemblyModel from "../components/models/AssemblyModel";
import ModelPreview from "../components/models/ModelPreview";
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
          <div className="assembly-description">
            <h2>Description</h2>
            <p>{assembly.description}</p>

            <div className="assembly-metadata">
              <h2>Details</h2>
              <p>
                <strong>Date:</strong> {new Date(assembly.date).toLocaleDateString()}
                <br />
                <strong>Location:</strong> {assembly.location.name}
                <br />
                <strong>Coordinates:</strong> {assembly.location.coordinates.latitude},{" "}
                {assembly.location.coordinates.longitude}
              </p>
            </div>

            <div className="assembly-technical">
              <h2>Technical Specifications</h2>
              <p>
                <strong>Pixel Weight:</strong> {assembly.pixelWeight} kg
                <br />
                <strong>Coefficient:</strong> {assembly.coefficient}
              </p>
            </div>

            <div className="assembly-emissions">
              <h2>Environmental Impact</h2>
              <p>
                <strong>A1-A3 Emissions:</strong> {assembly.a1A3Emissions} kg CO₂e
                <br />
                <strong>Transport:</strong> {assembly.transport.distance} km via {assembly.transport.type || "N/A"}
                <br />
                <strong>Transport Emissions:</strong> {assembly.transport.emissions} kg CO₂e
                <br />
                <strong>Total Emissions:</strong> {assembly.totalEmissions || "Not calculated"} kg CO₂e
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssemblyDetail;
