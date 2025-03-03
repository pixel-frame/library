import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import DetailGrid from "../components/grids/DetailGrid";
import "./PixelDetail.css";

const PixelDetail = () => {
  const { id } = useParams();
  const [pixel, setPixel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPixelDetail = async () => {
      try {
        const paddedId = id.toString().padStart(2, "0");
        const response = await fetch(`/data/detail/pixel/pixel_${paddedId}.json`);
        if (!response.ok) throw new Error("Pixel not found");
        const data = await response.json();
        setPixel(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPixelDetail();
  }, [id]);

  if (loading) return <div className="loading-indicator">Loading pixel details...</div>;
  if (error) return <div className="error-message">{error}</div>;
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

        <div className="other-data">
          <h2>Available Data</h2>
          <pre>{JSON.stringify(pixel, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default PixelDetail;
