import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Pixels.css";

const Pixels = () => {
  const [pixels, setPixels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPixels = async () => {
      try {
        const response = await fetch("/data/bank/pixel/master.json");
        const data = await response.json();

        const mappedPixels = data.pixels.map((pixel) => ({
          id: `pixel-${pixel.pixel_number}`,
          number: pixel.pixel_number,
          generation: pixel.generation,
          generation_description: pixel.generation_description,
          state: pixel.state,
          state_description: pixel.state_description,
          fc: pixel.fc,
          weight: pixel.weight,
          carbon_emissions_a1_a3: pixel.carbon_emissions_a1_a3,
          concrete_mix: pixel.concrete_mix,
          fiber: pixel.fiber,
          date_of_manufacture: pixel.date_of_manufacture,
          number_of_reconfigurations: pixel.number_of_reconfigurations,
          reconfigurations: pixel.reconfigurations,
          gif: pixel.gif,
          notes: pixel.notes,
        }));

        setPixels(mappedPixels);
        setLoading(false);
      } catch (err) {
        setError("Failed to load pixels data");
        setLoading(false);
      }
    };

    fetchPixels();
  }, []);

  if (loading) return <div className="loading-indicator">Loading pixels...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="pixels-container">
      <h2 className="pixels-title">Pixels</h2>
      <div className="pixels-grid">
        {pixels.length > 0 ? (
          pixels.map((pixel) => (
            <Link
              to={`/pixel/${pixel.id}`}
              state={{ pixel }}
              key={pixel.id}
              className="pixel-card"
              aria-label={`View details of Pixel ${pixel.number}`}
              tabIndex="0"
            >
              <div className="pixel-info">
                <h3>Pixel {pixel.number}</h3>
              </div>
            </Link>
          ))
        ) : (
          <div className="no-pixels">No pixels found</div>
        )}
      </div>
    </div>
  );
};

export default Pixels;
