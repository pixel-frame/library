import React from "react";
import styles from "./NetworkMatrix.module.css";

const NetworkMatrix = ({ network = [], selectedIndex = null }) => {
  // Create an array of 138 elements (1-138)
  console.log(network);
  const squares = Array.from({ length: 138 }, (_, i) => i + 1);

  const getSquareColor = (index) => {
    if (selectedIndex === index) return styles.greenSquare;
    if (network.includes(index)) return styles.blueSquare;
    return index >= 70 ? styles.graySquare : styles.blackSquare;
  };

  const shouldShowLabel = (index) => {
    return network.includes(index) || selectedIndex === index;
  };

  return (
    <div className={styles.networkMatrix}>
      {squares.map((index) => (
        <div key={index} className={`${styles.square} ${getSquareColor(index)}`} aria-label={`Square ${index}`}>
          {shouldShowLabel(index) && <span className={styles.label}>{index}</span>}
        </div>
      ))}
    </div>
  );
};

export default NetworkMatrix;
