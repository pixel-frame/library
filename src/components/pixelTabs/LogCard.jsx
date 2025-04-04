import { useEffect, useState } from "react";
import styles from "./LogCard.module.css";

const LogCard = ({ travel, event, animationDirection, pixelNumber }) => {
  const [animationClass, setAnimationClass] = useState("");
  const { from, to, distance, mode } = travel || {};
  const asterisks = Math.ceil(Number(distance || 0) / 80);
  console.log(event);
  console.log(travel);

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

  // Determine event type based on event name
  const eventType = event?.title?.toLowerCase().includes("fabrication") ? "Fabrication" : "Re-assembly";

  const getEventDescription = () => {
    if (eventType === "Fabrication") {
      return `PIXEL-${pixelNumber} fabricated on ${new Date(event.date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })} at fabrication site in Cambridge, MA.`;
    }
    return `Pixel ${pixelNumber} added to Reconfiguration ${event.title}. Traveled from ${travel.from} to ${travel.to}.`;
  };

  return (
    <div className={`${styles.logCard} ${animationClass}`}>
      <div className={styles.logHeader}>
        <span>
          <span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3.05596 13.784L5.88796 9.17602L0.511963 9.22402V6.77602L5.88796 6.82402L3.05596 2.21602L5.16796 0.968018L7.95196 5.76802L10.64 0.968018L12.8 2.21602L9.96796 6.82402L15.344 6.77602V9.22402L9.96796 9.17602L12.8 13.784L10.64 15.032L7.95196 10.232L5.16796 15.032L3.05596 13.784Z"
                fill="black"
              />
            </svg>
          </span>
          <span className={styles.eventTitle}>{eventType}</span>
        </span>
        <span>
          {event?.date
            ? new Date(event.date).toLocaleString("en-US", { month: "short", year: "numeric" }).toUpperCase()
            : ""}
        </span>
      </div>
      <div className={styles.eventDescription}>{getEventDescription()}</div>

      <div className={styles.metrics}>
        <div>
          <span>DISTANCE TRAVELED</span>
          <span>+{distance || 0} km</span>
        </div>
        <div>
          <span>EMISSIONS</span>
          <span>+{event?.emissionChange || "0.000"} kgCO2</span>
        </div>
      </div>
    </div>
  );
};

export default LogCard;
