import React, { useState, useCallback, useEffect } from "react";
import InteractiveGlobe from "../components/globe/InteractiveGlobe";
import SelectedAssemblies from "../components/listing/SelectedAssemblies";
import AssemblyDetail from "./AssemblyDetail";
import PageHeader from "../components/common/PageHeader";
import styles from "./Explore.module.css";
import Card from "../components/buttons/Card";
const Explore = () => {
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [highlightedAssembly, setHighlightedAssembly] = useState(null);
  const [focusedAssembly, setFocusedAssembly] = useState(null);
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

  const handleExpand = useCallback((assembly) => {
    setFocusedAssembly(assembly);
    setIsListExpanded(false);
  }, []);

  const handleBack = useCallback(() => {
    setFocusedAssembly(null);
  }, []);

  return (
    <div className={styles.container}>
      <PageHeader title="Explore Assemblies" />

      <div className={styles.content}>
        <div className={`${styles.globeContainer} ${isListExpanded ? styles.collapsed : ""}`}>
          <InteractiveGlobe highlightedAssembly={highlightedAssembly} focusedAssembly={highlightedAssembly} />
        </div>
        <div className={`${styles.sideContainer} ${isListExpanded ? styles.expanded : ""}`}>
          {!focusedAssembly ? (
            <SelectedAssemblies
              assemblies={assemblies}
              onScroll={handleScroll}
              onHighlight={setHighlightedAssembly}
              onExpand={() => {}}
            />
          ) : (
            <Card>
              <AssemblyDetail assemblyId={focusedAssembly.serial} onBack={handleBack} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore;
