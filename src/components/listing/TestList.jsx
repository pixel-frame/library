import React from "react";
import WheelList from "./WheelList";
import styles from "./WheelList.module.css";

const TestList = () => {
  const generateRandomDate = (_relative, absolute) => {
    // Generate random day names
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const randomDay = dayNames[Math.floor(Math.random() * dayNames.length)];

    // Generate random day number (1-30)
    const dayNumber = Math.floor(Math.random() * 30) + 1;

    // Generate random month abbreviations
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const randomMonth = monthNames[Math.floor(Math.random() * monthNames.length)];

    return `${randomDay} ${dayNumber} ${randomMonth}`;
  };

  const generatePixelText = (i) => `Pixel ${String(i).padStart(3, "0")} Available`;

  return (
    <div className={styles.wheelContainer}>
      <div className={styles.smallWheelWrapper}>
        <WheelList loop length={140} width={200} perspective="left" setValue={(i) => generatePixelText(i + 1)} />
      </div>
    </div>
  );
};

export default TestList;
