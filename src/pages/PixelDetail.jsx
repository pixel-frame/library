import React from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import DetailGrid from "../components/grids/DetailGrid";
import "./PixelDetail.css";

const PixelDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const pixel = location.state?.pixel;

  if (!pixel) return <div className="error-message">Pixel not found</div>;

  return (
    <div className="pixel-detail-page">
      <Link to="/pixels" className="back-button" aria-label="Back to pixels list" tabIndex="0">
        ← Back to Pixels
      </Link>

      <h1>Pixel {pixel.number}</h1>

      <div className="pixel-content">
        <div className="pixel-info-container">
          <DetailGrid
            items={[
              {
                title: "Generation",
                value: `${pixel.generation} - ${pixel.generation_description}`,
              },
              {
                title: "Status",
                value: pixel.state_description || "Active",
              },
              {
                title: "Manufacture Date",
                value: pixel.date_of_manufacture,
              },
              {
                title: "Concrete Strength",
                value: `${pixel.fc} MPa`,
                info: "Concrete compressive strength",
              },
              {
                title: "Weight",
                value: `${pixel.weight} kg`,
              },
              {
                title: "Fiber Type",
                value: `${pixel.fiber.type} (${pixel.fiber.dosage})`,
              },
              {
                title: "Reconfigurations",
                value: pixel.number_of_reconfigurations,
                info: "Number of times reconfigured",
              },
              {
                title: "Concrete Mix",
                value: pixel.concrete_mix || "Not specified",
              },
            ]}
          />
        </div>

        {pixel.notes && (
          <div className="notes-section">
            <h2>Notes</h2>
            <p>{pixel.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PixelDetail;
