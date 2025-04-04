import React, { useState, useMemo } from "react";
import DetailGrid from "../grids/DetailGrid";
import ModelPreview from "../models/ModelPreview";
import PixelModel from "../models/PixelModel";
import ExpandButton from "../buttons/ExpandButton";
import ARButton from "../buttons/ARButton";
import Globe from "../globe/Globe";
import SparkLine from "../datavis/SparkLine";
import styles from "./InfoTab.module.css";

const InfoTab = ({ pixel }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpand = () => {
    setIsExpanded(true);
    document.body.style.overflow = "hidden";
  };

  // Transform timeline data into emissions over time format
  const emissionsOverTime = useMemo(() => {
    if (!pixel.timeline || pixel.timeline.length < 2) return null;

    return pixel.timeline.reduce((acc, step) => {
      if (step.date && step.emissions?.running_total) {
        acc[step.date] = step.emissions.running_total;
      }
      return acc;
    }, {});
  }, [pixel.timeline]);

  return (
    <div className={styles["pixel-info-container"]}>
      <div className={styles["pixel-model-container"]}>
        <ModelPreview isExpanded={isExpanded} onClose={(expand) => setIsExpanded(expand === true)}>
          <PixelModel
            modelPath={pixel.pixel_number}
            isPreview={!isExpanded}
            isInteractive={isExpanded}
            onExpand={!isExpanded ? handleExpand : null}
          />
        </ModelPreview>
      </div>

      <div className={styles["spacing-container"]}>
        <DetailGrid
          items={[
            {
              title: "Status",
              value: pixel.state_description || "Active",
            },
            {
              title: "Generation",
              value: `${pixel.generation}`,
              info: `${pixel.generation_description}`,
            },

            {
              title: "Manufactured",
              value: pixel.date_of_manufacture,
            },
            {
              title: "Location",
              value: (
                <>
                  <div>Cambridge, MA</div>
                  {/* <div className={styles.globeContainer}>
                  <Globe latitude={42.3666} longitude={-71.1057} />
                </div> */}
                </>
              ),
              isGlobe: false,
            },
            {
              title: "f'c",
              value: `${pixel.fc} MPa`,
              info: "Concrete compressive strength",
            },
            {
              title: "Weight",
              value: `${pixel.weight} kg`,
            },
            {
              title: "A1-A3",
              value: "N/AkgCO2",
              info: "Emissions from production",
            },
            {
              title: "A4-A5",
              value: "N/AkgCO2",
              info: "Emissions from transportation",
            },
            {
              title: "Embodied Carbon",
              isSparkline: true,
              sparklineData: emissionsOverTime,
            },
            {
              title: "Fiber Type",
              value: `${pixel.fiber.type} (${pixel.fiber.dosage})`,
            },
            {
              title: "Reconfigs",
              value: pixel.number_of_reconfigurations,
              info: "Number of times reconfigured",
            },
            {
              title: "Concrete Mix",
              value: ("Rapidset high s..." || "Not specified").replace(/concrete mix/gi, "").trim(),
              info: "Rapidset high strength concrete mix",
            },
            ...(pixel.notes
              ? [
                  {
                    title: "Notes",
                    value: pixel.notes,
                    fullSpan: true,
                  },
                ]
              : []),
          ]}
        />
      </div>
    </div>
  );
};

export default InfoTab;
