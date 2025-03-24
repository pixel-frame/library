import React from "react";
import Carbon from "../components/datavis/Carbon";
import PageHeader from "../components/common/PageHeader";
import styles from "./Emissions.module.css";

const Emissions = () => {
  return (
    <div className={styles.container}>
      <PageHeader title="Carbon Emissions" />

      <div className={styles.visualizationContainer}>
        <Carbon />
      </div>
    </div>
  );
};

export default Emissions;
