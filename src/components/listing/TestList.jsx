import React from "react";
import WheelList from "./WheelList";
import styles from "./WheelList.module.css";

const TestList = ({ onSelectionChange }) => {
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

  const handleIndexChange = (index) => {
    // If index is 0, it's our "ALL" option, so we pass -1 to signify "no selection"
    const actualIndex = index === 0 ? -1 : index - 1;
    
    if (onSelectionChange) {
      onSelectionChange(actualIndex);
    }
  };

  const generatePixelText = (i) => {
    // Special case for the "ALL" option
    if (i === 0) {
      return {
        left: "ALL PIXELS",
        right: "View All",
      };
    }
    
    // For regular pixels, adjust the index (-1) since we added "ALL" at the beginning
    return {
      left: `Pixel ${String(i).padStart(3, "0")}`,
      right: "Available",
    };
  };

  return (
    <div className={styles.wheelContainer}>
      <div className={styles.smallWheelWrapper}>
        <WheelList
          loop
          length={141} // Increased by 1 to accommodate the "ALL" option
          width="100%"
          perspective="left"
          setValue={(i) => generatePixelText(i)} // Modified to use i directly
          onIndexChange={handleIndexChange}
        />
      </div>
    </div>
  );
};

export default TestList;
