import React from "react";
import styles from "./PixelModel.module.css";

const PixelModel = ({ modelPath, isPreview = false, isInteractive = false, onExpand = null }) => {
  const [modelError, setModelError] = React.useState(false);

  const handleModelError = () => {
    setModelError(true);
  };

  const handleExpand = (e) => {
    e.stopPropagation();
    if (onExpand) onExpand();
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
        shadow-intensity=".1"
        environment-image="neutral"
        camera-orbit="45deg 55deg 2.5m"
        exposure="1.1"
        poster-image={`data/previews/pixels/model-poster-${modelPath}.png`}
        environment-intensity="1"
        auto-rotate={isPreview}
        camera-controls={isInteractive}
        interaction-prompt="none"
        touch-action="none"
        disable-zoom={!isInteractive}
        disable-tap={!isInteractive}
        disable-pan={!isInteractive}
        disable-rotate={!isInteractive}
        ar={!isPreview && isInteractive}
        ar-modes={!isPreview && isInteractive ? "webxr scene-viewer quick-look" : "none"}
        ar-scale="fixed"
        loading="eager"
        reveal="auto"
        onError={handleModelError}
        style={{
          width: "100%",
          height: isPreview ? "40vh" : "80vh",
          maxWidth: "100%",
          position: "relative",
          zIndex: 1,
          pointerEvents: isInteractive ? "auto" : "none",
        }}
      />

      {isPreview && onExpand && (
        <button className={styles.expandButton} onClick={handleExpand} aria-label="Expand model view" tabIndex="0">
          [+]
        </button>
      )}
    </div>
  );
};

export default PixelModel;
