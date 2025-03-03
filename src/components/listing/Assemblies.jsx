import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Assemblies.css";

const Assemblies = () => {
  const [assemblies, setAssemblies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssemblies = async () => {
      try {
        const response = await fetch("/data/bank/assembly/carbon_locations.json");
        const data = await response.json();

        const mappedAssemblies = data.reconfigurations.map((config) => ({
          id: `assembly-${config.number}`,
          name: config.name.toUpperCase(),
          description: config.description,
          date: config.date,
          location: config.location,
          pixelWeight: config.pixel_weight,
          coefficient: config.coefficient,
          a1A3Emissions: config.a1_a3_emissions,
          transport: config.transport,
          totalEmissions: config.total_emissions,
          displayDate: `${new Date(config.date).getFullYear()} - ${config.location.name}`,
        }));

        setAssemblies(mappedAssemblies);
        setLoading(false);
      } catch (err) {
        setError("Failed to load assemblies data");
        setLoading(false);
      }
    };

    fetchAssemblies();
  }, []);

  if (loading) return <div className="loading-indicator">Loading assemblies...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="assemblies-container">
      <h2 className="assemblies-title">Assemblies</h2>
      <div className="assemblies-grid">
        {assemblies.length > 0 ? (
          assemblies.map((assembly) => (
            <Link
              to={`/assembly/${assembly.id}`}
              state={{ assembly }}
              key={assembly.id}
              className="assembly-card"
              aria-label={`View details of ${assembly.name}`}
              tabIndex="0"
            >
              <div className="assembly-info">
                <h3>{assembly.name}</h3>
              </div>
            </Link>
          ))
        ) : (
          <div className="no-assemblies">No assemblies found</div>
        )}
      </div>
    </div>
  );
};

export default Assemblies;
