import React, { useState, useCallback, useEffect } from "react";
import InteractiveGlobe from "../components/globe/InteractiveGlobe";
import SelectedAssemblies from "../components/listing/SelectedAssemblies";
import PageHeader from "../components/common/PageHeader";
import styles from "./Explore.module.css";

const Explore = () => {
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [highlightedAssembly, setHighlightedAssembly] = useState(null);
  const [assemblies, setAssemblies] = useState([]);

  // Fetch assemblies data when component mounts
  useEffect(() => {
    const fetchAssemblies = async () => {
      try {
        const response = await fetch("/data/bank/assembly/assemblies.json");
        const data = await response.json();
        if (data && data.reconfigurations) {
          setAssemblies(data.reconfigurations);
        } else {
          console.error("Unexpected data structure:", data);
        }
      } catch (error) {
        console.error("Error loading assemblies data:", error);
      }
    };

    fetchAssemblies();
  }, []);

  const handleScroll = useCallback((event) => {
    const scrollTop = event.target.scrollTop;
    setIsListExpanded(scrollTop > 10);
  }, []);

  return (
    <div className={styles.container}>
      <PageHeader title="Explore Assemblies" />

      <div className={styles.content}>
        <div className={`${styles.globeContainer} ${isListExpanded ? styles.collapsed : ""}`}>
          <InteractiveGlobe highlightedAssembly={highlightedAssembly} />
        </div>
        <div className={`${styles.assembliesContainer} ${isListExpanded ? styles.expanded : ""}`}>
          <SelectedAssemblies assemblies={assemblies} onScroll={handleScroll} onHighlight={setHighlightedAssembly} />
        </div>
      </div>
    </div>
  );
};

export default Explore;
