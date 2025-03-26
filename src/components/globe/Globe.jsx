import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { geoOrthographic, geoPath } from "d3-geo";
import * as topojson from "topojson-client";
import styles from "./Globe.module.css";

const Globe = ({ latitude, longitude }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 96;
    const height = 96;
    const sensitivity = 75;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create the projection
    const projection = geoOrthographic()
      .scale(40)
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .precision(0.1)
      .rotate([-longitude, -latitude, 0]);

    const path = geoPath().projection(projection);

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%");

    // Add globe outline
    svg
      .append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", 40)
      .attr("class", styles.globeOutline);

    // Load world map data
    d3.json("https://unpkg.com/world-atlas@2.0.2/countries-110m.json")
      .then((data) => {
        const countries = topojson.feature(data, data.objects.countries).features;

        // Add countries
        svg.selectAll(".country").data(countries).enter().append("path").attr("class", styles.landmass).attr("d", path);

        // Add grid lines
        const graticule = d3.geoGraticule();
        svg.append("path").datum(graticule).attr("class", styles.gridLine).attr("d", path);

        // Add marker for current location
        svg
          .append("circle")
          .attr("cx", projection([longitude, latitude])[0])
          .attr("cy", projection([longitude, latitude])[1])
          .attr("r", 3)
          .attr("class", styles.locationMarker);
      })
      .catch((error) => {
        console.error("Error loading world map data:", error);

        // Fallback to a simple circle if map data fails to load
        svg
          .append("circle")
          .attr("cx", projection([longitude, latitude])[0])
          .attr("cy", projection([longitude, latitude])[1])
          .attr("r", 3)
          .attr("class", styles.locationMarker);
      });
  }, [latitude, longitude]);

  return (
    <div className={styles.globeContainer}>
      <svg ref={svgRef} className={styles.globe}></svg>
    </div>
  );
};

export default Globe;
