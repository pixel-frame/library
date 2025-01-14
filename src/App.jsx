import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [isInteractive, setIsInteractive] = useState(false);
  useEffect(() => {
    // Dynamically import model-viewer when component mounts
    import("@google/model-viewer");
  }, []);

  const handleInteract = () => {
    setIsInteractive(!isInteractive);
  };

  return (
    <div className="app">
      <h1>PIXELFRAME</h1>{" "}
      <button className="interact-button" onClick={handleInteract}>
        {isInteractive ? "2D VIEW" : "INTERACT"}
      </button>
      <model-viewer
        src="/pixel.gltf"
        alt="A 3D pixel model"
        shadow-intensity="1"
        environment-image="neutral"
        style={{ width: "96.5vw", height: "85vh" }}
        camera-orbit={isInteractive ? "45deg 55deg 2.5m" : "0deg 0deg 2.5m"}
        // Simple lighting setup
        exposure="2"
        environment-intensity="2"
        auto-rotate={isInteractive}
        camera-controls={isInteractive}
        ar
        ar-modes="webxr scene-viewer quick-look"
      >
        <button className="annotation" slot="hotspot-1" data-position="0.15 0.25 0.15" data-normal="0 1 0">
          PXF-001-023
        </button>
      </model-viewer>
      <h2>MATERIAL PASTS | MATERIAL FUTURES</h2>
    </div>
  );
}

export default App;
