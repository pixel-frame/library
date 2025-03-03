import React from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import AssemblyModel from "../components/models/AssemblyModel";
import "./AssemblyDetail.css";

const AssemblyDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const assembly = location.state?.assembly;

  if (!assembly) return <div className="error-message">Assembly not found</div>;

  return (
    <div className="assembly-detail-page">
      <Link to="/assemblies" className="back-button" aria-label="Back to assemblies list" tabIndex="0">
        ← Back to Assemblies
      </Link>

      <h1>{assembly.name}</h1>

      <div className="assembly-content">
        <div className="assembly-model-container">
          <AssemblyModel modelPath={assembly.thumbnail} />
        </div>

        <div className="assembly-info-container">
          <div className="assembly-description">
            <h2>Description</h2>
            <p>{assembly.description}</p>
            <p>{assembly.thumbnail}</p>
            <p>
              <strong>Year:</strong> {assembly.year}
              <br />
              <strong>Location:</strong> {assembly.location}
            </p>
          </div>

          {assembly.specifications && (
            <div className="assembly-specifications">
              <h2>Specifications</h2>
              <ul>
                {Object.entries(assembly.specifications).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssemblyDetail;
