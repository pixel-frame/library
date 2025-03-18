import { useEffect, useState } from "react";
import styles from "./LogCard.module.css";

const LogCard = ({ travel, event, animationDirection }) => {
  const [animationClass, setAnimationClass] = useState("");
  const { from, to, distance, mode } = travel || {};
  const asterisks = Math.ceil(Number(distance || 0) / 80);

  useEffect(() => {
    if (animationDirection) {
      // Set exit animation based on direction
      setAnimationClass(animationDirection === "next" ? styles.exitLeft : styles.exitRight);

      // After a brief delay, switch to entrance animation
      const timer = setTimeout(() => {
        setAnimationClass(animationDirection === "next" ? styles.enterFromRight : styles.enterFromLeft);
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setAnimationClass("");
    }
  }, [travel, animationDirection]);

  return (
    <div className={`${styles.logCard} ${animationClass}`}>
      <div className={styles.logHeader}>
        <p>LOG</p>
        <span className={styles.eventTitle}>{event?.title || ""}</span>
      </div>
      <div className={styles.travelPath}>
        <div>{from || ""}</div>
        <div className={styles.pathLine}>{"*".repeat(Math.min(asterisks || 0, 20))}</div>
        <div>{to || ""}</div>
        <div className={styles.scale}>* = 80 km</div>
      </div>
      <div className={styles.travelDetails}>
        PIXEL-060 travels {distance || 0} km via {mode || "local"}
        from {from || ""} to {to || ""}
      </div>
    </div>
  );
};

export default LogCard;
