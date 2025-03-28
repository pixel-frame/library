import React, { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Parse URL parameters
  const urlParams = new URLSearchParams(location.search);
  const assemblyId = urlParams.get("assembly");

  // Fetch assemblies data when component mounts
  useEffect(() => {
    const fetchAssemblies = async () => {
      try {
        const response = await fetch("/data/bank/assembly/assemblies.json");
        const data = await response.json();
        if (data && data.reconfigurations) {
          setAssemblies(data.reconfigurations);

          // If there's an assembly ID in the URL, find and focus that assembly
          if (assemblyId) {
            const foundAssembly = data.reconfigurations.find((assembly) => assembly.serial === assemblyId);
            if (foundAssembly) {
              setFocusedAssembly(foundAssembly);
              setHighlightedAssembly(foundAssembly);
              setIsSheetOpen(true);
            }
          }
        } else {
          console.error("Unexpected data structure:", data);
        }
      } catch (error) {
        console.error("Error loading assemblies data:", error);
      }
    };

    fetchAssemblies();
  }, [assemblyId]);

  const handleScroll = useCallback((event) => {
    const scrollTop = event.target.scrollTop;
    setIsListExpanded(scrollTop > 10);
  }, []);

  const handleHighlight = useCallback((assembly) => {
    setHighlightedAssembly(assembly);
  }, []);

  const handleExpand = useCallback(
    (assembly) => {
      setFocusedAssembly(assembly);
      setIsSheetOpen(true);
      setIsListExpanded(false);

      // Update URL with assembly ID
      if (assembly && assembly.serial) {
        navigate(`?assembly=${assembly.serial}`, { replace: false });
      }
    },
    [navigate]
  );

  const handleBack = useCallback(() => {
    setFocusedAssembly(null);
    setIsSheetOpen(false);

    // Remove assembly ID from URL
    navigate("", { replace: false });
  }, [navigate]);

  return (
    <div className={styles.container}>
      <PageHeader title="Explore Assemblies" />

      <div className={styles.content}>
        <div className={`${styles.globeContainer} ${isListExpanded ? styles.collapsed : ""}`}>
          <InteractiveGlobe highlightedAssembly={highlightedAssembly} focusedAssembly={highlightedAssembly} />
        </div>
        <div className={`${styles.sideContainer} ${isListExpanded ? styles.expanded : ""}`}>
          <SelectedAssemblies
            assemblies={assemblies}
            onScroll={handleScroll}
            onHighlight={handleHighlight}
            onExpand={handleExpand}
            urlAssemblyId={assemblyId}
          />
        </div>
      </div>

      {focusedAssembly && (
        <Card isOpen={isSheetOpen} onClose={handleBack}>
          <AssemblyDetail
            assemblyId={focusedAssembly.serial}
            assembly={focusedAssembly}
            fullData={{ reconfigurations: assemblies }}
            onBack={handleBack}
          />
        </Card>
      )}
    </div>
  );
};

export default Explore;
