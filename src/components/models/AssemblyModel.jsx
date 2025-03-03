import React from "react";
import "./AssemblyModel.css";

const AssemblyModel = ({ modelPath, isPreview = false }) => {
  //   const encodedPath = encodeURIComponent(modelPath);

  return (
    <div className={`model-viewer ${isPreview ? "preview-mode" : ""}`}>
      <model-viewer
        // src={`/data/models/assemblies/${encodedPath}`}
        src={"/data/models/assemblies/1_Gen 1 Prototype Beam.glb"}
        alt="3D assembly model"
        shadow-intensity="0"
        tone-mapping="neutral"
        camera-orbit="0deg 0deg 6m"
        exposure="1"
        environment-intensity="1"
        auto-rotate={isPreview}
        camera-controls={!isPreview}
        interaction-prompt="none"
        touch-action="none"
        pointer-events="none"
        disable-zoom
        disable-pan
        disable-tap
        style={{
          width: "100%",
          height: isPreview ? "40vh" : "80vh",
          maxWidth: "100%",
          position: "relative",
          zIndex: 1,
          pointerEvents: isPreview ? "none" : "auto",
        }}
      />
    </div>
  );
};

export default AssemblyModel;
