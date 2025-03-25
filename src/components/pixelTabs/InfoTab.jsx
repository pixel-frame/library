import React, { useState } from "react";
import DetailGrid from "../grids/DetailGrid";
import ModelPreview from "../models/ModelPreview";
import PixelModel from "../models/PixelModel";
import ExpandButton from "../buttons/ExpandButton";
import ARButton from "../buttons/ARButton";
import Globe from "../globe/Globe";
import styles from "./InfoTab.module.css";

const InfoTab = ({ pixel }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const modelViewerRef = useRef(null);

  const handleExpand = () => {
    setIsExpanded(true);
    document.body.style.overflow = "hidden";
  };

  const handleARActivation = () => {
    if (modelViewerRef.current) {
      modelViewerRef.current.activateAR();
    }
  };

  return (
    <div className="pixel-info-container">
      <ModelPreview isExpanded={isExpanded} onClose={() => setIsExpanded(false)}>
        <PixelModel modelPath={pixel.pixel_number} />
      </ModelPreview>
      <div className={styles["pixel-header"]}>
        <p className={styles["pixel-title"]}>PIXEL {pixel.pixel_number}</p>
        <div className={styles["pixel-actions"]}>
          <ExpandButton onClick={handleExpand} />
          <ARButton onClick={handleARActivation} />
        </div>
      </div>

      <DetailGrid
        items={[
          {
            title: "Generation",
            value: `${pixel.generation} - ${pixel.generation_description}`,
          },
          {
            title: "Status",
            value: pixel.state_description || "Active",
          },
          {
            title: "Manufacture Date",
            value: pixel.date_of_manufacture,
          },
          {
            title: "Location",
            value: (
              <>
                <div>Cambridge, MA</div>
                <div className={styles.globeContainer}>
                  <Globe latitude={42.3666} longitude={-71.1057} />
                </div>
              </>
            ),
            isGlobe: true,
          },
          {
            title: "Concrete Strength",
            value: `${pixel.fc} MPa`,
            info: "Concrete compressive strength",
          },
          {
            title: "Weight",
            value: `${pixel.weight} kg`,
          },
          {
            title: "Fiber Type",
            value: `${pixel.fiber.type} (${pixel.fiber.dosage})`,
          },
          {
            title: "Reconfigurations",
            value: pixel.number_of_reconfigurations,
            info: "Number of times reconfigured",
          },
          {
            title: "Concrete Mix",
            value: pixel.concrete_mix || "Not specified",
          },
        ]}
      />
    </div>
  );
};

export default InfoTab;
