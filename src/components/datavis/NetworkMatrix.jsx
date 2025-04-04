import React from "react";
import styles from "./NetworkMatrix.module.css";

const NetworkMatrix = ({ network = [], selectedIndex = null }) => {
  const squares = Array.from({ length: 138 }, (_, i) => i + 1);

  const getSquareColor = (index) => {
    if (selectedIndex === index) return styles.greenSquare;
    if (network.includes(index)) return styles.blueSquare;
    return "";
  };

  const isActive = (index) => {
    return network.includes(index) || selectedIndex === index;
  };

  return (
    <div className={styles.networkMatrix}>
      {squares.map((index) => (
        <div
          key={index}
          className={`${styles.matrixItem} ${isActive(index) ? styles.active : ""} ${getSquareColor(index)}`}
          aria-label={`Square ${index}`}
        >
          <span className={styles.label}>{index}</span>
        </div>
      ))}
    </div>
  );
};

export default NetworkMatrix;
