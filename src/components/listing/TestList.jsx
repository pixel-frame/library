import React, { useEffect, useRef } from "react";
import WheelList from "./WheelList";
import styles from "./WheelList.module.css";

const TestList = ({ onSelectionChange, selectedIndex = -1 }) => {
  // Add a ref to track if the selection change is coming from the wheel itself
  const isWheelChangingRef = useRef(false);
  // Add a ref to track the previous selected index
  const prevSelectedIndexRef = useRef(selectedIndex);

  // Effect to handle external selection changes (from canvas)
  useEffect(() => {
    // Only update if the selection changed and it wasn't initiated by the wheel
    if (selectedIndex !== prevSelectedIndexRef.current && !isWheelChangingRef.current) {
      console.log("TestList - External selection change detected:", selectedIndex);
      prevSelectedIndexRef.current = selectedIndex;
      // No need to do anything else - the controlledIndex prop will update the wheel
    }

    // Reset the wheel changing flag
    isWheelChangingRef.current = false;
  }, [selectedIndex]);

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
    console.log("TestList.jsx - handleIndexChange called with raw index:", index);

    // Set the flag to indicate this change came from the wheel
    isWheelChangingRef.current = true;

    // If index is 0, it's our "ALL" option, so we pass -1 to signify "no selection"
    const actualIndex = index === 0 ? -1 : index - 1;

    console.log("TestList.jsx - Adjusted index to:", actualIndex);

    // Update the previous index ref
    prevSelectedIndexRef.current = actualIndex;

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

  // Convert selectedIndex to WheelList index (add 1, and handle -1 as 0)
  const wheelIndex = selectedIndex === -1 ? 0 : selectedIndex + 1;

  console.log("TestList rendering with wheelIndex:", wheelIndex);

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
          initialIndex={wheelIndex} // Set initial index based on selectedIndex
          controlledIndex={wheelIndex} // Add controlled index to keep wheel in sync
        />
      </div>
    </div>
  );
};

export default TestList;
