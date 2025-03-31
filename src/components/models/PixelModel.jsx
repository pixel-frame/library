import React from "react";
import styles from "./PixelModel.module.css";

const PixelModel = ({ modelPath, isPreview = false, isInteractive = false, onExpand = null }) => {
  const [useFallback, setUseFallback] = React.useState(false);
  const [modelError, setModelError] = React.useState(false);
  const modelViewerRef = React.useRef(null);

  // Event listeners after the component mounts
  React.useEffect(() => {
    const modelViewer = modelViewerRef.current;
    if (!modelViewer) return;
    
    // Timeout to check if model loads
    const timeoutId = setTimeout(() => {
      if (!useFallback && !modelViewer.loaded) {
        console.log(`Model load timeout: Pixel ${modelPath}.glb - switching to fallback`);
        setUseFallback(true);
      }
    }, 500); // timeout dur
    
    const handleLoadEvent = () => {
      console.log(`Model loaded successfully: ${useFallback ? 'fallback' : `Pixel ${modelPath}.glb`}`);
    };
    
    modelViewer.addEventListener('load', handleLoadEvent);
    
    return () => {
      clearTimeout(timeoutId);
      modelViewer.removeEventListener('load', handleLoadEvent);
    };
  }, [modelPath, useFallback]);
  
  const handleModelError = () => {
    if (!useFallback) {
      console.log(`Error loading primary model: Pixel ${modelPath}.glb - switching to fallback`);
      setUseFallback(true);
    }
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

  // Select the appropriate model source
  const modelSrc = useFallback 
    ? `/data/models/pixels/gen1_Pixel.glb` 
    : `/data/models/pixels/Pixel ${modelPath}.glb`;

  return (
    <div className={`${styles.modelViewer} ${isPreview ? styles.previewMode : ""}`}>
      <model-viewer
        ref={modelViewerRef}
        src={modelSrc}
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
