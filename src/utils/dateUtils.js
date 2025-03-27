/**
 * Safely parses dates in a cross-browser compatible way (especially for Safari)
 * @param {string|Date} dateInput - Date string or Date object to parse
 * @returns {Date} Parsed Date object
 */
export const safeParseDate = (dateInput) => {
  if (!dateInput) return new Date();

  try {
    // If it's already a Date object
    if (dateInput instanceof Date) {
      // Check if it's a valid date
      if (isNaN(dateInput.getTime())) {
        return new Date(); // Return current date if invalid
      }
      return new Date(dateInput);
    }

    // Handle ISO strings in a Safari-compatible way
    if (typeof dateInput === "string") {
      // For ISO strings with time and timezone info
      if (dateInput.includes("T")) {
        const date = new Date(dateInput);
        // Check if valid
        if (isNaN(date.getTime())) {
          return new Date(); // Return current date if invalid
        }
        return date;
      }

      // Replace hyphens with slashes for better Safari compatibility
      const safeDateString = dateInput.replace(/-/g, "/");
      const date = new Date(safeDateString);

      // Check if valid
      if (isNaN(date.getTime())) {
        return new Date(); // Return current date if invalid
      }
      return date;
    }

    // Fallback
    return new Date();
  } catch (error) {
    console.warn("Error parsing date:", dateInput, error);
    return new Date(); // Return current date on any error
  }
};

/**
 * Calculates the appropriate number of ticks based on date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} Appropriate number of ticks
 */
export const getTickCount = (startDate, endDate) => {
  if (!startDate || !endDate) return 6;

  const start = safeParseDate(startDate);
  const end = safeParseDate(endDate);
  const years = (end - start) / (1000 * 60 * 60 * 24 * 365);

  if (years > 10) return Math.ceil(years / 2); // One tick every 2 years
  if (years > 5) return years + 1; // One tick per year
  if (years > 2) return years * 2; // Two ticks per year
  return years * 4; // Quarterly ticks for shorter spans
};

/**
 * Creates an x-scale for time-based charts with appropriate padding
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @param {number} width - Width of the chart area
 * @returns {Function} D3 time scale
 */
export const createTimeScale = (startDate, endDate, width, d3) => {
  // Safely parse dates
  const parsedStartDate = safeParseDate(startDate);
  const parsedEndDate = safeParseDate(endDate);

  // Calculate the time span in years
  const years = (parsedEndDate - parsedStartDate) / (1000 * 60 * 60 * 24 * 365);

  // For longer time spans, adjust padding proportionally
  const paddingMonths = years > 5 ? 6 : 2;

  // Create padded dates
  const paddedStartDate = new Date(parsedStartDate);
  paddedStartDate.setMonth(paddedStartDate.getMonth() - paddingMonths);

  const paddedEndDate = new Date(parsedEndDate);
  paddedEndDate.setMonth(paddedEndDate.getMonth() + paddingMonths);

  return d3.scaleTime().domain([paddedStartDate, paddedEndDate]).range([0, width]);
};
