import { useState, useEffect } from "react";
import styles from "./RollingText.module.css";

export function RollingText({ text, speed = 300 }) {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    const intervalTime = speed;

    const interval = setInterval(() => {
      setDisplayText((prevText) => {
        const shiftedText = prevText.slice(1) + prevText[0];
        return shiftedText;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [speed]);

  return (
    <div className={styles.rollingTextContainer}>
      <div className={styles.rollingText}>
        <span className="font-mono">{displayText}</span>
      </div>
    </div>
  );
}
