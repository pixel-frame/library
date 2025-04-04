import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { geoMercator, geoOrthographic, geoPath } from "d3-geo";
import * as topojson from "topojson-client";
import styles from "./InteractiveGlobe.module.css";

const InteractiveGlobe = ({ highlightedAssembly, focusedAssembly }) => {
  const svgRef = useRef(null);
  const projectionRef = useRef(null);
  const [assemblies, setAssemblies] = useState([]);
  const animationRef = useRef(null);
  const rotationRef = useRef([-12, -42, 0]);
  const shouldRotateRef = useRef(true);
  const scaleRef = useRef(null);

  // Add default rotation and scale constants
  const DEFAULT_SCALE = 1;
  const BASE_SCALE = 140; // width/2 - 10
  const ZOOMED_SCALE = BASE_SCALE * 8;

  // Define updateGlobe at component level
  const updateGlobe = useCallback(() => {
    if (!projectionRef.current || !svgRef.current) return;

    const mapGroup = d3.select(svgRef.current).select("g");
    const pointsGroup = d3.select(svgRef.current).select("g:last-of-type");
    const path = geoPath().projection(projectionRef.current);

    mapGroup.selectAll("path").attr("d", path);

    pointsGroup
      .selectAll(".marker")
      .attr("transform", (d) => {
        const coords = projectionRef.current([d.longitude, d.latitude]);
        return coords ? `translate(${coords[0]}, ${coords[1]})` : null;
      })
      .style("display", (d) => {
        const position = projectionRef.current.rotate();
        const point = [d.longitude, d.latitude];
        const visible = d3.geoDistance([-position[0], -position[1]], point) < Math.PI / 2;
        return visible ? "block" : "none";
      });

    pointsGroup.selectAll(".routePath").attr("d", path);
  }, []);

  // Simplified assemblies data loading
  useEffect(() => {
    fetch("/data/bank/assembly/assemblies.json")
      .then((response) => response.json())
      .then((data) => {
        if (data?.reconfigurations) {
          setAssemblies(data.reconfigurations);
        }
      })
      .catch((error) => console.error("Error loading assemblies:", error));
  }, []);

  // Simplified points transformation
  const transformAssembliesToPoints = () => {
    if (!assemblies.length) return [];

    const locationGroups = assemblies.reduce((acc, assembly) => {
      const key = `${assembly.location.coordinates.latitude},${assembly.location.coordinates.longitude}`;
      if (!acc[key]) {
        acc[key] = {
          name: assembly.location.name,
          latitude: assembly.location.coordinates.latitude,
          longitude: assembly.location.coordinates.longitude,
          assemblies: [],
        };
      }
      acc[key].assemblies.push(assembly);
      return acc;
    }, {});

    return Object.values(locationGroups).map((location) => ({
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name,
      count: location.assemblies.length,
      assemblies: location.assemblies,
    }));
  };

  // Add this function after transformAssembliesToPoints
  const createRouteLines = () => {
    const routes = [];

    // Create routes between consecutive assemblies
    for (let i = 0; i < assemblies.length - 1; i++) {
      const currentAssembly = assemblies[i];
      const nextAssembly = assemblies[i + 1];

      if (currentAssembly.location?.coordinates && nextAssembly.location?.coordinates) {
        const source = [currentAssembly.location.coordinates.longitude, currentAssembly.location.coordinates.latitude];
        const destination = [nextAssembly.location.coordinates.longitude, nextAssembly.location.coordinates.latitude];

        const route = d3.geoInterpolate(source, destination);
        const routePoints = [];
        for (let t = 0; t <= 1; t += 0.01) {
          routePoints.push(route(t));
        }

        routes.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: routePoints,
          },
        });
      }
    }

    return routes;
  };

  // Simplified autoRotate
  const autoRotate = useCallback(() => {
    if (!shouldRotateRef.current || !projectionRef.current) return;

    const rotation = projectionRef.current.rotate();
    projectionRef.current.rotate([rotation[0] + 0.05, rotation[1], rotation[2]]);
    updateGlobe();

    animationRef.current = requestAnimationFrame(autoRotate);
  }, [updateGlobe]);

  // Main rendering effect
  useEffect(() => {
    if (!svgRef.current || !assemblies.length) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    d3.select(svgRef.current).selectAll("*").remove();

    const width = 300;
    const height = 300;
    const initialScale = width / 2 - 10;

    projectionRef.current = geoOrthographic()
      .scale(scaleRef.current || initialScale)
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .rotate(rotationRef.current);

    if (!scaleRef.current) {
      scaleRef.current = initialScale;
    }

    const path = geoPath().projection(projectionRef.current);

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
      .attr("r", scaleRef.current)
      .attr("class", styles.globeOutline);

    // Create a container for all the map elements
    const mapGroup = svg.append("g");

    // Create a container for the points and lines
    const pointsGroup = svg.append("g");

    // Simplified map loading and point rendering
    d3.json("https://unpkg.com/world-atlas@2.0.2/countries-110m.json")
      .then((data) => {
        const countries = topojson.feature(data, data.objects.countries).features;

        mapGroup
          .selectAll(".country")
          .data(countries)
          .enter()
          .append("path")
          .attr("class", styles.landmass)
          .attr("d", path);

        const pointsData = transformAssembliesToPoints();

        if (pointsData.length > 0) {
          // Draw points with gray squares and assembly counts
          pointsGroup
            .selectAll(".marker")
            .data(pointsData)
            .enter()
            .append("g")
            .attr("class", "marker")
            .each(function (d) {
              const element = d3.select(this);
              const isFocused =
                focusedAssembly &&
                focusedAssembly.location.coordinates.latitude === d.latitude &&
                focusedAssembly.location.coordinates.longitude === d.longitude;

              if (isFocused) {
                // Debug logs

                d.assemblies.forEach((assembly, index) => {
                  const row = Math.floor(index / 3);
                  const col = index % 3;

                  const isSelected = highlightedAssembly && assembly.number === highlightedAssembly.number;

                  element
                    .append("rect")
                    .attr("x", (col - 1) * 20 - 6)
                    .attr("y", row * 20 - 24)
                    .attr("width", 15)
                    .attr("height", 15)
                    .attr("class", `${styles.markerSquare} ${isSelected ? styles.highlighted : ""}`);
                });

                // Calculate the bottom of the last row of squares
                const lastRow = Math.floor((d.assemblies.length - 1) / 3);
                const squaresBottom = lastRow * 20;

                // Add count text below the squares
                element
                  .append("text")
                  .attr("y", squaresBottom + 10)
                  .attr("text-anchor", "middle")
                  .attr("class", styles.markerText)
                  .text(`[${d.count}]`);

                // Add location name below the count
                element
                  .append("text")
                  .attr("y", squaresBottom + 25)
                  .attr("text-anchor", "middle")
                  .attr("class", styles.locationText)
                  .text(d.name);
              } else {
                // Single small square when not focused
                element
                  .append("rect")
                  .attr("x", -3)
                  .attr("y", -12)
                  .attr("width", 5)
                  .attr("height", 5)
                  .attr("class", styles.markerSquare);

                // Count text for unfocused state
                element
                  .append("text")
                  .attr("y", 3)
                  .attr("text-anchor", "middle")
                  .attr("class", styles.markerText)
                  .text(`[${d.count}]`);
              }
            })
            .attr("transform", (d) => {
              const coords = projectionRef.current([d.longitude, d.latitude]);
              return coords ? `translate(${coords[0]}, ${coords[1]})` : null;
            });

          // Debug route rendering
          const routes = createRouteLines();

          const routePaths = pointsGroup
            .selectAll(".routePath")
            .data(routes)
            .enter()
            .append("path")
            .attr("class", `${styles.routeLine} routePath`)
            .attr("d", path);

          updateGlobe();
        }

        // Simplified drag behavior
        const dragBehavior = d3.drag().on("drag", (event) => {
          const [x, y] = d3.pointer(event);
          const rotation = projectionRef.current.rotate();
          const newRotation = [rotation[0] + event.dx / 5, rotation[1] - event.dy / 5, rotation[2]];

          projectionRef.current.rotate(newRotation);
          rotationRef.current = newRotation;
          updateGlobe();
        });

        svg.call(dragBehavior);

        if (!focusedAssembly) {
          shouldRotateRef.current = true;
          autoRotate();
        }
      })
      .catch((error) => console.error("Error loading map:", error));

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [assemblies, highlightedAssembly, focusedAssembly, autoRotate]);

  // Modify the effect that handles focusing
  useEffect(() => {
    if (!svgRef.current || !projectionRef.current) return;

    const svg = d3.select(svgRef.current);
    const currentRotation = projectionRef.current.rotate();
    const currentScale = projectionRef.current.scale();
    const duration = 1000;

    if (focusedAssembly) {
      shouldRotateRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    const targetRotation = focusedAssembly
      ? [-focusedAssembly.location.coordinates.longitude, -focusedAssembly.location.coordinates.latitude, 0]
      : currentRotation;

    // Only change scale if transitioning between no selection and selection
    const targetScale = focusedAssembly
      ? Math.abs(currentScale - ZOOMED_SCALE) < 0.1
        ? currentScale
        : ZOOMED_SCALE // Keep current scale if already zoomed
      : BASE_SCALE;

    // Check if we actually need to animate
    const rotationChanged = !currentRotation.every((val, i) => Math.abs(val - targetRotation[i]) < 0.1);
    const scaleChanged = Math.abs(currentScale - targetScale) > 0.1;

    if (!rotationChanged && !scaleChanged) return;

    const rotationInterpolator = d3.interpolate(currentRotation, targetRotation);
    const scaleInterpolator = d3.interpolate(currentScale, targetScale);

    d3.transition()
      .duration(duration)
      .ease(d3.easeLinear)
      .tween("transform", () => {
        return (t) => {
          const newRotation = rotationInterpolator(t);
          projectionRef.current.rotate(newRotation);
          rotationRef.current = newRotation;

          const newScale = scaleInterpolator(t);
          projectionRef.current.scale(newScale);
          scaleRef.current = newScale;
          svg.select("circle").attr("r", newScale);

          updateGlobe();
        };
      });
  }, [focusedAssembly, updateGlobe]);

  return (
    <div className={styles.interactiveGlobeContainer}>
      <svg ref={svgRef} className={styles.interactiveGlobe}></svg>
    </div>
  );
};

export default InteractiveGlobe;
