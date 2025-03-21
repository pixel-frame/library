import React from "react";
import styles from "./PixelModel.module.css";

const PixelModel = ({ modelPath, isPreview = false }) => {
  const [modelError, setModelError] = React.useState(false);
  console.log("fuzz");
  console.log(modelPath);
  const handleModelError = () => {
    setModelError(true);
  };

  if (modelError) {
    return (
      <div className={`${styles.modelViewer} ${isPreview ? styles.previewMode : ""}`}>
        <div className={styles.errorMessage}>Model not available</div>
      </div>
    );
  }

  return (
    <div className={`${styles.modelViewer} ${isPreview ? styles.previewMode : ""}`}>
      <model-viewer
        src={`/data/models/pixels/Pixel ${modelPath}.glb`}
        alt="3D pixel model"
        shadow-intensity="0"
        tone-mapping="aces"
        camera-orbit="45deg 60deg 6m"
        exposure="1.1"
        environment-intensity="1"
        auto-rotate={isPreview}
        camera-controls={!isPreview}
        interaction-prompt="none"
        touch-action="none"
        pointer-events="none"
        disable-zoom
        disable-pan
        disable-tap
        onError={handleModelError}
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
