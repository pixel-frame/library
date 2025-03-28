import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { geoMercator, geoOrthographic, geoPath } from "d3-geo";
import * as topojson from "topojson-client";
import styles from "./InteractiveGlobe.module.css";

const InteractiveGlobe = ({ highlightedAssembly, focusedAssembly }) => {
  const svgRef = useRef(null);
  const projectionRef = useRef(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const [assemblies, setAssemblies] = useState([]);
  const animationRef = useRef(null);
  const rotationRef = useRef([-12, -42, 0]);
  const transformRef = useRef(null);
  const shouldRotateRef = useRef(true);

  // Add default rotation and scale constants
  const DEFAULT_SCALE = 1;

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

  // Load assemblies data
  useEffect(() => {
    fetch("/data/bank/assembly/assemblies.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Loaded assemblies data:", data);
        if (data && data.reconfigurations) {
          setAssemblies(data.reconfigurations);
        } else {
          console.error("Unexpected data structure:", data);
        }
      })
      .catch((error) => {
        console.error("Error loading assemblies data:", error);
      });
  }, []);

  // Transform assemblies data into points format
  const transformAssembliesToPoints = () => {
    console.log("Transforming assemblies:", assemblies);

    if (!assemblies || assemblies.length === 0) {
      console.log("No assemblies data available");
      return [];
    }

    // Create a map to group assemblies by location
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

    // Convert to array of points
    const points = Object.values(locationGroups).map((location) => ({
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name,
      count: location.assemblies.length,
      transportType: "air",
      assemblies: location.assemblies, // Include individual assemblies
    }));

    console.log("Transformed points:", points);
    return points;
  };

  // Simplified autoRotate function - only check shouldRotateRef
  const autoRotate = useCallback(() => {
    if (!shouldRotateRef.current || !projectionRef.current) return;

    const rotation = projectionRef.current.rotate();
    const speed = 0.05;
    projectionRef.current.rotate([rotation[0] + speed, rotation[1], rotation[2]]);
    updateGlobe();

    animationRef.current = requestAnimationFrame(autoRotate);
  }, [updateGlobe]);

  // Effect to handle rotation based only on focusedAssembly
  useEffect(() => {
    if (focusedAssembly) {
      shouldRotateRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      shouldRotateRef.current = true;
      autoRotate();
    }
  }, [focusedAssembly, autoRotate]);

  // Main useEffect
  useEffect(() => {
    if (!svgRef.current || assemblies.length === 0) return;

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Set dimensions for 3D globe
    const width = 300;
    const height = 300;

    // Create the orthographic projection for 3D globe
    projectionRef.current = geoOrthographic()
      .scale(width / 2 - 10)
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .precision(0.1)
      .rotate([12, 42, 0]);

    const initialScale = projectionRef.current.scale();
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
      .attr("r", initialScale)
      .attr("class", styles.globeOutline);

    // Create a container for all the map elements
    const mapGroup = svg.append("g");

    // Create a container for the points and lines
    const pointsGroup = svg.append("g");

    // Function to create route path
    const createRoutePath = (start, end) => {
      // Create a curved path for 3D globe
      const route = d3.geoInterpolate([start.longitude, start.latitude], [end.longitude, end.latitude]);

      const routePoints = [];
      for (let t = 0; t <= 1; t += 0.01) {
        routePoints.push(route(t));
      }

      return {
        type: "LineString",
        coordinates: routePoints,
      };
    };

    // Set initial rotation from stored value
    if (rotationRef.current) {
      projectionRef.current.rotate(rotationRef.current);
      updateGlobe();
    }

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

        // Transform assemblies data into points
        const pointsData = transformAssembliesToPoints();

        // Only proceed if we have actual data
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
              const isHighlighted =
                highlightedAssembly &&
                highlightedAssembly.location.coordinates.latitude === d.latitude &&
                highlightedAssembly.location.coordinates.longitude === d.longitude;
              const isFocused =
                focusedAssembly &&
                focusedAssembly.location.coordinates.latitude === d.latitude &&
                focusedAssembly.location.coordinates.longitude === d.longitude;

              if (isFocused) {
                // Create larger squares for focused location
                d.assemblies.forEach((assembly, index) => {
                  const row = Math.floor(index / 3);
                  const col = index % 3;
                  const isSelected = highlightedAssembly && assembly.id === highlightedAssembly.id;
                  console.log("buzz" + JSON.stringify(highlightedAssembly));
                  console.log("guzz" + JSON.stringify(assembly));
                  element
                    .append("rect")
                    .attr("x", (col - 1) * 20 - 6) // Doubled spacing
                    .attr("y", row * 20 - 24) // Doubled spacing and offset
                    .attr("width", 15) // Doubled size
                    .attr("height", 15) // Doubled size
                    .attr("class", `${styles.markerSquare}  ${isSelected ? styles.highlighted : ""}`);
                });
              } else {
                // Single square for unfocused location
                element
                  .append("rect")
                  .attr("x", -3)
                  .attr("y", -12)
                  .attr("width", 5)
                  .attr("height", 5)
                  .attr("class", `${styles.markerSquare} ${isHighlighted ? styles.highlighted : ""}`);
              }

              element
                .append("text")
                .attr("y", 3)
                .attr("text-anchor", "middle")
                .attr("class", styles.markerText)
                .text(`[${d.count}]`);
            })
            .attr("transform", (d) => {
              const coords = projectionRef.current([d.longitude, d.latitude]);
              return coords ? `translate(${coords[0]}, ${coords[1]})` : null;
            });

          // Update to hide points on the back side
          updateGlobe();

          // Create lines between consecutive points
          for (let i = 0; i < pointsData.length - 1; i++) {
            const start = pointsData[i];
            const end = pointsData[i + 1];

            // Create route
            const routeLine = createRoutePath(start, end);

            // Add the path with appropriate class
            pointsGroup
              .append("path")
              .datum(routeLine)
              .attr("class", `${styles.routeLine} ${styles.airRoute} routePath`)
              .attr("d", path);
          }
        }

        // 3D specific interactions
        const dragBehavior = d3
          .drag()
          .on("start", function (event) {
            setUserInteracted(true);
            event.sourceEvent.stopPropagation();
            const r = projectionRef.current.rotate();
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

            const x1 = point[0];
            const y1 = point[1];

            const deltaX = (x1 - rotation.x0) / 5;
            const deltaY = (y1 - rotation.y0) / 5;

            const newRotation = [rotation.r0[0] + deltaX, rotation.r0[1] - deltaY, rotation.r0[2]];
            projectionRef.current.rotate(newRotation);
            // Store current rotation
            rotationRef.current = newRotation;

            updateGlobe();
          });

        svg.call(dragBehavior);

        // Start auto-rotation if not focused
        if (!focusedAssembly) {
          shouldRotateRef.current = true;
          autoRotate();
        }

        // Add zoom functionality
        const zoom = d3
          .zoom()
          .scaleExtent([0.7, 8])
          .on("zoom", (event) => {
            setUserInteracted(true);
            // Store current transform
            transformRef.current = event.transform;

            const newScale = initialScale * event.transform.k;
            projectionRef.current.scale(newScale);
            svg.select("circle").attr("r", newScale);
            updateGlobe();
          });

        // Apply stored transform if it exists
        if (transformRef.current) {
          svg.call(zoom.transform, transformRef.current);
        }

        svg.call(zoom);
      })
      .catch((error) => {
        console.error("Error loading world map data:", error);
      });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [assemblies, highlightedAssembly, focusedAssembly]);

  // Add this effect to handle focusing on a specific assembly
  useEffect(() => {
    if (!focusedAssembly || !svgRef.current || !projectionRef.current) return;

    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom().scaleExtent([0.7, 8]);

    // Get current rotation
    const currentRotation = projectionRef.current.rotate();

    // Target rotation for the focused assembly
    const targetRotation = [
      -focusedAssembly.location.coordinates.longitude,
      -focusedAssembly.location.coordinates.latitude,
      0,
    ];

    // Animation duration in milliseconds
    const duration = 1500;

    // Create interpolator for smooth rotation transition
    const rotationInterpolator = d3.interpolate(currentRotation, targetRotation);

    // Get current transform or create default if none exists
    const currentTransform = transformRef.current || d3.zoomIdentity;

    // Target zoom level (increased to 8)
    const targetTransform = d3.zoomIdentity.scale(8);

    // Start animation
    d3.transition()
      .duration(duration)
      .ease(d3.easeCubicInOut) // Add easing for more natural motion
      .tween("rotate", () => {
        return (t) => {
          // Update rotation gradually
          const newRotation = rotationInterpolator(t);
          projectionRef.current.rotate(newRotation);
          rotationRef.current = newRotation;

          // Update globe at each step
          updateGlobe();
        };
      });

    // Animate the zoom separately
    svg.transition().duration(duration).ease(d3.easeCubicInOut).call(zoom.transform, targetTransform);

    transformRef.current = targetTransform;
    setUserInteracted(true);
  }, [focusedAssembly, updateGlobe]);

  return (
    <div className={styles.interactiveGlobeContainer}>
      <svg ref={svgRef} className={styles.interactiveGlobe}></svg>
    </div>
  );
};

export default InteractiveGlobe;
