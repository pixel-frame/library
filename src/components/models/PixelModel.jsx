import React from "react";
import styles from "./PixelModel.module.css";

const PixelModel = ({ modelPath, isPreview = false }) => {
  return (
    <div className={`${styles.modelViewer} ${isPreview ? styles.previewMode : ""}`}>
      <model-viewer
        src="/other.glb"
        alt="3D pixel model"
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

export default PixelModel;
