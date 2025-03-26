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

  return (
    <div className={styles.wheelContainer}>
      <div className={styles.wheelWrapper}>
        <WheelList loop length={24} width={140} perspective="right" setValue={generateRandomDate} />
      </div>
      <div className={styles.smallWheelWrapper}>
        <WheelList loop length={24} width={23} />
      </div>
      <div className={styles.smallWheelWrapper}>
        <WheelList loop length={60} width={23} perspective="left" />
      </div>
    </div>
  );
};

export default TestList;
