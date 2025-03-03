import React, { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import "./AssemblyModel.css";

const AssemblyModel = ({ modelPath }) => {
  const encodedPath = encodeURIComponent(modelPath);
  console.log(encodedPath);

  return (
    <div className="model-viewer">
      <model-viewer
        src={`/data/models/assemblies/${encodedPath}`}
        alt="3D assembly model"
        shadow-intensity="0"
        tone-mapping="neutral"
        camera-orbit="0deg 0deg 2.5m"
        exposure="1"
        environment-intensity="1"
        auto-rotate
        camera-controls
        onError={(error) => console.error("Error loading model:", error)}
        style={{
          width: "100%",
          height: "80vh",
          maxWidth: "100%",
          position: "relative",
          zIndex: 1,
        }}
      />
    </div>
  );
};

export default AssemblyModel;
