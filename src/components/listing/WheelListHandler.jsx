import React, { useCallback, useState, useEffect, useMemo } from "react";
import WheelList from "./WheelList";
import styles from "./WheelList.module.css";
import { AnimatedText } from "../text/AnimatedText";

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
 * @param {string} props.buttonText - Text to display on the action button
 * @param {Function} props.onButtonClick - Handler for button click
 * @param {string} props.titleText - Text to display as the title when the first item is selected
 */
const WheelListHandler = ({
  items = [],
  onSelectionChange,
  valueFormatter,
  perspective = "left",
  initialIndex = 0,
  renderCustomContent,
  buttonText,
  onButtonClick,
  titleText,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [isButtonVisible, setIsButtonVisible] = useState(!!buttonText && !!onButtonClick);

  // Simple button visibility logic
  useEffect(() => {
    setIsButtonVisible(!!buttonText && !!onButtonClick);
  }, [buttonText, onButtonClick]);

  // Memoize the index change handler
  const handleIndexChange = useCallback(
    (index) => {
      setSelectedIndex(index);
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

  // Memoize the formatter function
  const formatter = useMemo(() => valueFormatter || defaultFormatter, [valueFormatter, defaultFormatter]);

  // Memoize the setValue function
  const setValue = useCallback(
    (i) => {
      if (!items[i]) return { left: "", right: "" };

      const item = items[i];
      const formattedValue = formatter(item, i);

      // Check if the item has a sparklineComponent property
      if (item.sparklineComponent) {
        return {
          ...formattedValue,
          customContent: item.sparklineComponent,
        };
      }

      // Support for custom content from renderCustomContent prop
      if (renderCustomContent) {
        return {
          ...formattedValue,
          customContent: renderCustomContent(item, i),
        };
      }

      return formattedValue;
    },
    [items, formatter, renderCustomContent]
  );

  // Memoize the button click handler
  const handleButtonClick = useCallback(() => {
    if (onButtonClick && items[selectedIndex]) {
      onButtonClick(items[selectedIndex]);
    }
  }, [items, onButtonClick, selectedIndex]);

  // Empty state
  if (!items || items.length === 0) {
    return (
      <div className={styles.wheelContainer}>
        <div className={styles.emptyState}>No items available</div>
      </div>
    );
  }

  return (
    <div className={styles.wheelContainer}>
      {selectedIndex <= 1 && titleText && (
        <h2 className={styles.wheelTitle}>
          <AnimatedText text={titleText} />
        </h2>
      )}
      {selectedIndex <= 1 && titleText === "PIXEL BANK" && (
        <p className={styles.wheelDesc}>140 Total, 70 Available, 50 upcoming, 20 retired</p>
      )}
      {isButtonVisible && (
        <button className={styles.actionButton} onClick={handleButtonClick} aria-label={buttonText} tabIndex="0">
          <div className={styles.actionButtonInner}>{buttonText}</div>
        </button>
      )}
      <div className={styles.smallWheelWrapper}>
        <WheelList
          loop={false}
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
