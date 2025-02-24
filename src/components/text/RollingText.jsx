import { useState, useEffect } from "react";
import "./RollingText.css";

export function RollingText({ text }) {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    const intervalTime = 300;

    const interval = setInterval(() => {
      setDisplayText((prevText) => {
        const shiftedText = prevText.slice(1) + prevText[0];
        return shiftedText;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="srolling-text-container">
      <div className="srolling-text">
        <span>{displayText}</span>
      </div>
    </div>
  );
}
