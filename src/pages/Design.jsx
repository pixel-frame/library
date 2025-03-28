import "@google/model-viewer";
import { useState, useRef } from "react";
import styles from "./Design.module.css";

const Design = () => {
  const modelViewerRef = useRef(null);
  const [placedModels, setPlacedModels] = useState([]);

  const models = [
    "/data/models/pixels/Pixel 1.glb",
    "/data/models/pixels/Pixel 3.glb",
    "/data/models/pixels/Pixel 9.glb",
  ];

  const handleAddModel = async (modelUrl) => {
    const modelViewer = modelViewerRef.current;
    if (!modelViewer) return;

    try {
      if (!modelViewer.isPresenting) {
        // First model - start AR session
        modelViewer.src = modelUrl;
        setPlacedModels([modelUrl]);
        await modelViewer.activateAR();
      } else {
        // Add new model to the scene
        const newModels = [...placedModels, modelUrl];
        setPlacedModels(newModels);

        // Update the scene with all models
        const scene = modelViewer.scene;

        // Clear existing models
        while (scene.children.length > 0) {
          scene.remove(scene.children[0]);
        }

        // Add all models with offsets
        for (let i = 0; i < newModels.length; i++) {
          const model = await modelViewer.createModel(newModels[i]);
          if (model) {
            model.position.set(i * 1, 0, i * 1);
            scene.add(model);
          }
        }
      }
    } catch (error) {
      console.error("Error adding model:", error);
    }
  };

  return (
    <div className={styles.container}>
      <model-viewer
        ref={modelViewerRef}
        ios-src={models[0]}
        src={models[0]}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        environment-image="neutral"
        shadow-intensity="1"
        ar-placement="floor"
        ar-scale="fixed"
        className={styles.modelViewer}
      >
        <button slot="ar-button" className={styles.arButton}>
          View in AR
        </button>
      </model-viewer>

      <div className={styles.modelControls}>
        {models.map((model, index) => (
          <button key={index} className={styles.modelButton} onClick={() => handleAddModel(model)}>
            Add Model {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Design;
