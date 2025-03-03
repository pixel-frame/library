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
        // Hardcoded assembly data instead of importing from JSON
        const hardcodedAssemblies = [
          {
            id: "beam-assembly-2022",
            name: "BEAM ASSEMBLY",
            description: "2022 - Cambridge, MA",
            thumbnail: "1_Gen 1 Prototype Beam.glb",
          },
          {
            id: "column-assembly-2022",
            name: "COLUMN ASSEMBLY",
            description: "2022 - Cambridge, MA",
            thumbnail: "2_6_Gen 1 Prototype Column.glb",
          },
          {
            id: "shear-test-2022",
            name: "SHEAR TEST",
            description: "2022 - Cambridge, MA",
            thumbnail: null,
          },
          {
            id: "beam-assembly-2023",
            name: "BEAM ASSEMBLY",
            description: "2023 - Washington DC",
            thumbnail: "4_7_Gen 2 Prototype Beam_Showcase.glb",
          },
          {
            id: "showcase-column-2023-1",
            name: "SHOWCASE COLUMN",
            description: "2023 - Washington DC",
            thumbnail: "5_Gen 2 Prototype Column_showcase.glb",
          },
          {
            id: "showcase-column-2023-2",
            name: "SHOWCASE COLUMN",
            description: "2023 - Washington DC",
            thumbnail: null,
          },
          {
            id: "exhibition-beam-2024",
            name: "EXHIBITION BEAM",
            description: "2024 - Cambridge, MA",
            thumbnail: null,
          },
          {
            id: "exhibition-column-2025",
            name: "EXHIBITION COLUMN",
            thumbnail: "10_Gen 1 Prototype Column_Biennale.glb",
            description: "2025 - Cambridge, MA",
          },
          {
            id: "biennale-beam-2025",
            name: "BIENNALE BEAM",
            description: "2025 - Venice, IT",
            thumbnail: "9_Gen 2 Prototype Beam_Biennale.glb",
          },
        ];

        setAssemblies(hardcodedAssemblies);
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
                <p>{assembly.description}</p>
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
