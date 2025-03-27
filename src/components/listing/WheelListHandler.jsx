import React, { useCallback } from "react";
import WheelList from "./WheelList";
import styles from "./WheelList.module.css";

/**
 * A component that wraps the WheelList to handle selection of items
 *
 * @param {Object} props
 * @param {Array} props.items - Array of items to display in the wheel
 * @param {Function} props.onSelectionChange - Callback when selection changes
 * @param {Function} props.valueFormatter - Function to format display text for each item
 * @param {string} props.perspective - Perspective for the wheel ("left", "center", etc.)
 * @param {number} props.initialIndex - Initial selected index
 * @param {Function} props.renderCustomContent - Function to render custom content for each item
 */
const WheelListHandler = ({
  items = [],
  onSelectionChange,
  valueFormatter,
  perspective = "left",
  initialIndex = 0,
  renderCustomContent,
}) => {
  const handleIndexChange = useCallback(
    (index) => {
      if (onSelectionChange && items[index]) {
        onSelectionChange(items[index], index);
      }
    },
    [items, onSelectionChange]
  );

  // Default formatter if none provided
  const defaultFormatter = useCallback((item, index) => {
    // Handle pixels
    if (item.pixel_number || item.serial) {
      return {
        left: `Pixel ${item.pixel_number || item.serial || index}`,
        right: item.total_emissions ? `${item.total_emissions.toFixed(2)}kg CO2e` : "Available",
      };
    }
    // Handle assemblies
    else if (item.name || item.location) {
      return {
        left: item.name || `Assembly ${index + 1}`,
        right: item.location?.name || "Unknown Location",
      };
    }
    // Fallback
    return {
      left: `Item ${index + 1}`,
      right: "Details",
    };
  }, []);

  const formatter = valueFormatter || defaultFormatter;

  // If no items, show empty state
  if (!items || items.length === 0) {
    return (
      <div className={styles.wheelContainer}>
        <div className={styles.emptyState}>No items available</div>
      </div>
    );
  }

  const setValue = (i) => {
    const item = items[i];
    const formattedValue = formatter(item, i);

    // If custom content renderer is provided, add it to the formatted value
    if (renderCustomContent) {
      return {
        ...formattedValue,
        customContent: renderCustomContent(item, i),
      };
    }

    return formattedValue;
  };

  return (
    <div className={styles.wheelContainer}>
      <div className={styles.smallWheelWrapper}>
        <WheelList
          loop
          length={items.length}
          width="100%"
          perspective={perspective}
          setValue={setValue}
          onIndexChange={handleIndexChange}
          initIdx={initialIndex}
        />
      </div>
    </div>
  );
};

export default WheelListHandler;
