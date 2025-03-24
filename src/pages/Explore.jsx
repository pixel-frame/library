import React from "react";
import InteractiveGlobe from "../components/globe/InteractiveGlobe";
import Assemblies from "../components/listing/Assemblies";
import PageHeader from "../components/common/PageHeader";
import styles from "./Explore.module.css";

const Explore = () => {
  return (
    <div className={styles.explorePage}>
      <PageHeader title="Explore Assemblies" />

      <div className={styles.mainContent}>
        <section className={styles.globeSection}>
          <InteractiveGlobe />
        </section>

        <section className={styles.assembliesSection}>
          <Assemblies />
        </section>
      </div>
    </div>
  );
};

export default Explore;
