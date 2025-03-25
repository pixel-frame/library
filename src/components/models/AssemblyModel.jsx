import React, { useState, useEffect } from "react";
import styles from "./AssemblyModel.module.css";

const AssemblyModel = ({ modelPath, isPreview = false }) => {
  const [modelError, setModelError] = useState(false);

  useEffect(() => {
    const checkModelExists = async () => {
      try {
        const response = await fetch(modelPath);
        if (!response.ok) {
          setModelError(true);
        }
      } catch (error) {
        setModelError(true);
      }
    };

    checkModelExists();
  }, [modelPath]);

  if (modelError) {
    return <div className={styles.modelError}>NO MODEL FOUND</div>;
  }

  //   const encodedPath = encodeURIComponent(modelPath);

  return (
    <div className={`${styles.modelViewer} ${isPreview ? styles.previewMode : ""}`}>
      <model-viewer
        src={modelPath}
        alt="3D assembly model"
        shadow-intensity="0"
        tone-mapping="aces"
        camera-orbit="45deg 60deg 6m"
        exposure="1"
        environment-intensity="1"
        auto-rotate={isPreview}
        camera-controls={!isPreview}
        interaction-prompt="none"
        touch-action={isPreview ? "none" : "auto"}
        pointer-events={isPreview ? "none" : "auto"}
        disable-pan
        ar={!isPreview}
        ar-modes={!isPreview ? "webxr scene-viewer quick-look" : "none"}
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
        }}
      />
    </div>
  );
};

export default AssemblyModel;
