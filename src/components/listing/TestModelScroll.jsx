import React from "react";
import WheelList from "./WheelList";
import styles from "./WheelList.module.css";

const TestModelScroll = () => {
  const generatePosterPath = (i) => ({
    left: (
      <img
        src={`/data/previews/pixels/model-poster-${i}`}
        alt={`Model ${i}`}
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />
    ),
    right: "",
  });

  return (
    <div className={styles.wheelContainer}>
      <div className={styles.smallWheelWrapper}>
        <WheelList loop length={140} width="100%" perspective="left" setValue={(i) => generatePosterPath(i + 1)} />
      </div>
    </div>
  );
};

export default TestModelScroll;
