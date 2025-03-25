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
  const [is3D, setIs3D] = useState(true);
  const animationRef = useRef(null);
  const rotationRef = useRef([-12, -42, 0]);
  const transformRef = useRef(null);
  const shouldRotateRef = useRef(true);

  // Add default rotation and scale constants
  const DEFAULT_SCALE = 1;

  // Define updateGlobe at component level
  const updateGlobe = useCallback(() => {
    if (!is3D || !projectionRef.current || !svgRef.current) return;

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
  }, [is3D]);

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

  const handleToggleView = () => {
    setIs3D(!is3D);
    setUserInteracted(false); // Reset interaction state when toggling
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

    // Set dimensions based on view type
    const width = is3D ? 300 : 800;
    const height = is3D ? 300 : 450;

    // Create the appropriate projection
    projectionRef.current = is3D
      ? geoOrthographic()
          .scale(width / 2 - 10)
          .translate([width / 2, height / 2])
          .clipAngle(90)
          .precision(0.1)
          .rotate([12, 42, 0])
      : geoMercator()
          .scale(width / 2 / Math.PI)
          .translate([width / 2, height / 2]);

    const initialScale = projectionRef.current.scale();
    const path = geoPath().projection(projectionRef.current);

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%");

    // Add globe outline for 3D view
    if (is3D) {
      svg
        .append("circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", initialScale)
        .attr("class", styles.globeOutline);
    }

    // Create a container for all the map elements
    const mapGroup = svg.append("g");

    // Create a container for the points and lines
    const pointsGroup = svg.append("g");

    // Function to create route path
    const createRoutePath = (start, end) => {
      if (is3D) {
        // For 3D globe, create a curved path
        const route = d3.geoInterpolate([start.longitude, start.latitude], [end.longitude, end.latitude]);

        const routePoints = [];
        for (let t = 0; t <= 1; t += 0.01) {
          routePoints.push(route(t));
        }

        return {
          type: "LineString",
          coordinates: routePoints,
        };
      } else {
        // For 2D map, use a simple line
        return {
          type: "LineString",
          coordinates: [
            [start.longitude, start.latitude],
            [end.longitude, end.latitude],
          ],
        };
      }
    };

    // Set initial rotation from stored value
    if (is3D && rotationRef.current) {
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

              if (!is3D) {
                element
                  .append("text")
                  .attr("y", 15)
                  .attr("x", -3)
                  .attr("text-anchor", "middle")
                  .attr("class", styles.locationName)
                  .text(d.name);
              }
            })
            .attr("transform", (d) => {
              const coords = projectionRef.current([d.longitude, d.latitude]);
              return coords ? `translate(${coords[0]}, ${coords[1]})` : null;
            });

          // For 3D view, immediately update to hide points on the back side
          if (is3D) {
            updateGlobe();
          }

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

          // For 2D view, automatically zoom to fit all points
          if (!is3D && pointsData.length > 0) {
            // Create a GeoJSON feature collection from the points
            const pointFeatures = {
              type: "FeatureCollection",
              features: pointsData.map((d) => ({
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [d.longitude, d.latitude],
                },
              })),
            };

            // Calculate the bounds of the points
            const bounds = path.bounds(pointFeatures);
            const dx = bounds[1][0] - bounds[0][0];
            const dy = bounds[1][1] - bounds[0][1];
            const x = (bounds[0][0] + bounds[1][0]) / 2;
            const y = (bounds[0][1] + bounds[1][1]) / 2;
            const scale = 0.8 / Math.max(dx / width, dy / height);
            const translate = [width / 2 - scale * x, height / 2 - scale * y];

            // Apply the transform
            mapGroup.attr("transform", `translate(${translate}) scale(${scale})`);
            pointsGroup.attr("transform", `translate(${translate}) scale(${scale})`);
          }
        }

        if (is3D) {
          // 3D specific interactions

          // Improved rotation interaction
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
          if (is3D && !focusedAssembly) {
            shouldRotateRef.current = true;
            autoRotate();
          }
        }

        // Add zoom and pan functionality (works for both 2D and 3D)
        const zoom = d3
          .zoom()
          .scaleExtent([is3D ? 0.7 : 1, 8])
          .on("zoom", (event) => {
            setUserInteracted(true);
            // Store current transform
            transformRef.current = event.transform;

            if (is3D) {
              const newScale = initialScale * event.transform.k;
              projectionRef.current.scale(newScale);
              svg.select("circle").attr("r", newScale);
              updateGlobe();
            } else {
              mapGroup.attr("transform", event.transform);
              pointsGroup.attr("transform", event.transform);
            }
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
  }, [assemblies, is3D, highlightedAssembly, autoRotate, focusedAssembly]);

  // Add this effect to handle focusing on a specific assembly
  useEffect(() => {
    if (!focusedAssembly || !svgRef.current || !projectionRef.current) return;

    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom().scaleExtent([0.7, 8]);

    if (is3D) {
      const targetRotation = [
        -focusedAssembly.location.coordinates.longitude,
        -focusedAssembly.location.coordinates.latitude,
        0,
      ];
      projectionRef.current.rotate(targetRotation);
      rotationRef.current = targetRotation;

      // Increased zoom level from 2.5 to 5
      const transform = d3.zoomIdentity.scale(8);
      svg.transition().duration(1000).call(zoom.transform, transform);
      transformRef.current = transform;

      updateGlobe();
    } else {
      const coordinates = [
        focusedAssembly.location.coordinates.longitude,
        focusedAssembly.location.coordinates.latitude,
      ];
      const point = projectionRef.current(coordinates);

      if (point) {
        const width = svg.node().getBoundingClientRect().width;
        const height = svg.node().getBoundingClientRect().height;

        // Increased zoom level from 2.5 to 5
        const transform = d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(5)
          .translate(-point[0], -point[1]);

        svg.transition().duration(1000).call(zoom.transform, transform);
        transformRef.current = transform;
      }
    }

    setUserInteracted(true);
  }, [focusedAssembly, is3D]);

  // Effect to handle reset when focusedAssembly is cleared
  useEffect(() => {
    if (!focusedAssembly && svgRef.current && projectionRef.current) {
      const svg = d3.select(svgRef.current);
      const zoom = d3.zoom().scaleExtent([0.7, 8]);

      // Reset zoom/scale with animation
      const transform = d3.zoomIdentity.scale(DEFAULT_SCALE);
      svg.transition().duration(1000).call(zoom.transform, transform);
      transformRef.current = transform;

      // Resume auto-rotation
      shouldRotateRef.current = true;
      autoRotate();

      updateGlobe();
    }
  }, [focusedAssembly, is3D, autoRotate]);

  return (
    <div className={styles.interactiveGlobeContainer}>
      <button
        className={styles.viewToggleButton}
        onClick={handleToggleView}
        aria-label={`Switch to ${is3D ? "2D" : "3D"} view`}
        tabIndex="0"
      >
        Switch to {is3D ? "2D" : "3D"} View
      </button>
      <svg ref={svgRef} className={styles.interactiveGlobe}></svg>
    </div>
  );
};

export default InteractiveGlobe;
