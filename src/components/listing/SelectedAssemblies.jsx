import React, { useEffect, useState, useRef } from "react";
import styles from "./SelectedAssemblies.module.css";
import WheelListHandler from "./WheelListHandler";

const SelectedAssemblies = ({ assemblies = [], onScroll, onHighlight, onExpand }) => {
  const [highlightedIndex, setHighlightedIndex] = useState(0); // Default to first item (ALL ASSEMBLIES)
  const scrollRef = useRef(null);
  const lastScrollPosition = useRef(0);

  // Create a modified list with "ALL ASSEMBLIES" as the first option
  const enhancedAssemblies = [
    { name: "ALL ASSEMBLIES", isAllOption: true, location: { name: "Global View" } },
    ...assemblies,
  ];

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
    lastScrollPosition.current = event.target.scrollTop;
    onScroll(event);
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
    const timestamp = assembly?.timestamp ? new Date(assembly.timestamp).toLocaleDateString() : "No date";
    const pixelCount = Array.isArray(assembly?.pixels) ? assembly.pixels.length : 0;
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
        />
      </div>
    </div>
  );
};

export default SelectedAssemblies;
