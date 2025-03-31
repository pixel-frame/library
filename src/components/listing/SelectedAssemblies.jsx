import React, { useEffect, useState, useRef } from "react";
import styles from "./SelectedAssemblies.module.css";
import WheelListHandler from "./WheelListHandler";

const SelectedAssemblies = ({ assemblies = [], onScroll, onHighlight, onExpand, urlAssemblyId }) => {
  const [highlightedIndex, setHighlightedIndex] = useState(0); // Default to first item (ALL ASSEMBLIES)
  const scrollRef = useRef(null);
  const lastScrollPosition = useRef(0);

  // Create a modified list with "ALL ASSEMBLIES" as the first option
  const enhancedAssemblies = [
    { name: "ALL ASSEMBLIES", isAllOption: true, location: { name: "Global View" } },
    ...assemblies,
  ];

  // Handle URL assembly ID changes
  useEffect(() => {
    if (urlAssemblyId && assemblies.length > 0) {
      const assemblyIndex = enhancedAssemblies.findIndex((assembly) => assembly.serial === urlAssemblyId);

      if (assemblyIndex > 0) {
        setHighlightedIndex(assemblyIndex);
        onHighlight(enhancedAssemblies[assemblyIndex]);
      }
    }
  }, [urlAssemblyId, assemblies, enhancedAssemblies, onHighlight]);

  const handleSelectionChange = (assembly, index) => {
    setHighlightedIndex(index);

    // If the "ALL ASSEMBLIES" option is selected, pass null to onHighlight
    if (index === 0 && assembly.isAllOption) {
      onHighlight(null);
    } else {
      onHighlight(assembly);
    }
  };

  const handleScroll = (event) => {
    // We can keep this for any internal scrolling needs
    lastScrollPosition.current = event.target.scrollTop;
    // Only call onScroll if it exists
    if (onScroll) {
      onScroll(event);
    }
  };

  const handleExpandClick = () => {
    // Get the currently selected assembly
    const selectedAssembly = enhancedAssemblies[highlightedIndex];

    // Don't expand if it's the "ALL ASSEMBLIES" option
    if (selectedAssembly.isAllOption) return;

    // Call the onExpand function with the selected assembly
    if (onExpand) {
      onExpand(selectedAssembly);
    }
  };

  // Custom formatter for assemblies
  const assemblyFormatter = (assembly, index) => {
    // Special case for "ALL ASSEMBLIES" option
    if (assembly.isAllOption) {
      return {
        left: assembly.name,
        right: assembly.location.name,
      };
    }

    // Safely access nested properties for regular assemblies
    const locationName = assembly?.location?.name || "Unknown Location";
    const assemblyName = assembly?.name || `Assembly ${index}`;

    return {
      left: assemblyName,
      right: locationName,
    };
  };

  // Custom renderer for additional content
  const renderCustomContent = (assembly, index) => {
    const isHighlighted = index === highlightedIndex;
    return (
      <div className={`${styles.customContent} ${isHighlighted ? styles.highlighted : ""}`}>
        {/* Additional content can be added here if needed */}
      </div>
    );
  };

  if (!assemblies || assemblies.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>No assemblies available</div>
      </div>
    );
  }

  // Determine if we should show the expand button (not for ALL ASSEMBLIES)
  const showExpandButton = highlightedIndex > 0 && onExpand;

  return (
    <div className={styles.container}>
      <div ref={scrollRef} className={styles.scrollableList} onScroll={handleScroll}>
        <WheelListHandler
          items={enhancedAssemblies}
          onSelectionChange={handleSelectionChange}
          valueFormatter={assemblyFormatter}
          perspective="center"
          initialIndex={highlightedIndex}
          renderCustomContent={renderCustomContent}
          buttonText={showExpandButton ? "VIEW ASSEMBLY DETAILS " : null}
          onButtonClick={showExpandButton ? handleExpandClick : null}
        />
      </div>
    </div>
  );
};

export default SelectedAssemblies;
