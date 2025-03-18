import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { geoOrthographic, geoPath } from "d3-geo";
import * as topojson from "topojson-client";
import styles from "./InteractiveGlobe.module.css";

const InteractiveGlobe = ({ points = [] }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 300;
    const height = 300;

    // Reduce sensitivity for smoother rotation
    const sensitivity = 5;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create the projection
    const projection = geoOrthographic()
      .scale(width / 2 - 10)
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .precision(0.1);

    const initialScale = projection.scale();
    const path = geoPath().projection(projection);

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%");

    // Add globe outline
    const globeCircle = svg
      .append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", initialScale)
      .attr("class", styles.globeOutline);

    // Create a container for all the map elements
    const mapGroup = svg.append("g");

    // Create a container for the points and lines
    const pointsGroup = svg.append("g");

    // Function to update all elements based on current projection
    const updateGlobe = () => {
      mapGroup.selectAll("path").attr("d", path);

      // Update markers and check if they're on the visible side of the globe
      pointsGroup
        .selectAll(".marker")
        .attr("transform", (d) => {
          const coords = projection([d.longitude, d.latitude]);
          return coords ? `translate(${coords[0]}, ${coords[1]})` : null;
        })
        .style("display", (d) => {
          // Hide points on the back side of the globe
          const position = projection.rotate();
          const point = [d.longitude, d.latitude];
          const visible = d3.geoDistance([-position[0], -position[1]], point) < Math.PI / 2;
          return visible ? "block" : "none";
        });

      // Update routes
      pointsGroup.selectAll(".routePath").attr("d", path);
    };

    // Function to create route path based on transport type
    const createRoutePath = (start, end, transportType) => {
      const route = d3.geoInterpolate([start.longitude, start.latitude], [end.longitude, end.latitude]);

      const routePoints = [];

      if (transportType === "air") {
        // Air routes have more pronounced curves
        for (let t = 0; t <= 1; t += 0.01) {
          routePoints.push(route(t));
        }
      } else if (transportType === "car" || transportType === "train") {
        // Ground routes are more direct with fewer points
        for (let t = 0; t <= 1; t += 0.1) {
          routePoints.push(route(t));
        }
      } else {
        // Default route
        for (let t = 0; t <= 1; t += 0.01) {
          routePoints.push(route(t));
        }
      }

      return {
        type: "LineString",
        coordinates: routePoints,
      };
    };

    // Load world map data
    d3.json("https://unpkg.com/world-atlas@2.0.2/countries-110m.json")
      .then((data) => {
        const countries = topojson.feature(data, data.objects.countries).features;

        // Add countries
        mapGroup
          .selectAll(".country")
          .data(countries)
          .enter()
          .append("path")
          .attr("class", styles.landmass)
          .attr("d", path);

        // Add grid lines
        const graticule = d3.geoGraticule();
        mapGroup.append("path").datum(graticule).attr("class", styles.gridLine).attr("d", path);

        // If no points provided, generate random ones
        const pointsData = points.length > 0 ? points : generateRandomPoints(20);

        // Draw points with gray squares and random numbers
        pointsGroup
          .selectAll(".marker")
          .data(pointsData)
          .enter()
          .append("g")
          .attr("class", "marker")
          .each(function (d) {
            const element = d3.select(this);
            const randomNum = Math.floor(Math.random() * 6); // Random integer from 0-5

            // Add gray square
            element
              .append("rect")
              .attr("x", -3)
              .attr("y", -12)
              .attr("width", 5)
              .attr("height", 5)
              .attr("class", styles.markerSquare);

            // Add text with random number in brackets directly on top of square
            element
              .append("text")
              .attr("y", 3) // Center vertically within the square
              .attr("text-anchor", "middle") // Center horizontally
              .attr("class", styles.markerText)
              .text(`[${randomNum}]`);
          })
          .attr("transform", (d) => {
            const coords = projection([d.longitude, d.latitude]);
            return coords ? `translate(${coords[0]}, ${coords[1]})` : null;
          });

        // Create lines between consecutive points
        for (let i = 0; i < pointsData.length - 1; i++) {
          const start = pointsData[i];
          const end = pointsData[i + 1];

          // Determine transport type (randomly assign if not provided)
          const transportType = start.transportType || ["air", "car", "train"][Math.floor(Math.random() * 3)];

          // Create route based on transport type
          const routeLine = createRoutePath(start, end, transportType);

          // Add the path with appropriate class
          pointsGroup
            .append("path")
            .datum(routeLine)
            .attr("class", `${styles.routeLine} ${styles[transportType + "Route"]} routePath`)
            .attr("d", path);
        }

        // Improved rotation interaction
        const dragBehavior = d3
          .drag()
          .on("start", function (event) {
            event.sourceEvent.stopPropagation();
            const r = projection.rotate();
            const point = d3.pointer(event, this);

            // Store initial position and rotation
            this.__rotation = {
              x0: point[0],
              y0: point[1],
              r0: r,
            };
          })
          .on("drag", function (event) {
            if (!this.__rotation) return;

            const point = d3.pointer(event, this);
            const rotation = this.__rotation;

            // Calculate rotation based on drag distance
            const x1 = point[0];
            const y1 = point[1];

            // Calculate new rotation angles
            const deltaX = (x1 - rotation.x0) / sensitivity;
            const deltaY = (y1 - rotation.y0) / sensitivity;

            // Apply rotation
            projection.rotate([rotation.r0[0] + deltaX, rotation.r0[1] - deltaY, rotation.r0[2]]);

            // Update all elements
            updateGlobe();
          });

        svg.call(dragBehavior);

        // Improved zoom interaction
        const zoomBehavior = d3
          .zoom()
          .scaleExtent([0.7, 8])
          .on("zoom", function (event) {
            const newScale = initialScale * event.transform.k;
            projection.scale(newScale);

            // Update globe outline
            globeCircle.attr("r", newScale);

            // Update all elements
            updateGlobe();
          });

        svg.call(zoomBehavior);
      })
      .catch((error) => {
        console.error("Error loading world map data:", error);
      });
  }, [points]);

  // Function to generate random points around the globe
  const generateRandomPoints = (count) => {
    const points = [];
    const transportTypes = ["air", "car", "train"];

    for (let i = 0; i < count; i++) {
      points.push({
        latitude: Math.random() * 180 - 90,
        longitude: Math.random() * 360 - 180,
        name: `Point ${i + 1}`,
        transportType: transportTypes[Math.floor(Math.random() * transportTypes.length)],
      });
    }
    return points;
  };

  return (
    <div className={styles.interactiveGlobeContainer}>
      <svg ref={svgRef} className={styles.interactiveGlobe}></svg>
    </div>
  );
};

export default InteractiveGlobe;
