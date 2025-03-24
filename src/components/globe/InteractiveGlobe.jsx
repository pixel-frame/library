import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { geoMercator, geoOrthographic, geoPath } from "d3-geo";
import * as topojson from "topojson-client";
import styles from "./InteractiveGlobe.module.css";

const InteractiveGlobe = () => {
  const svgRef = useRef(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const [assemblies, setAssemblies] = useState([]);
  const [is3D, setIs3D] = useState(true);
  const animationRef = useRef(null);

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
    const points = Object.values(locationGroups).map((location) => {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        name: location.name,
        count: location.assemblies.length,
        transportType: "air", // Default to air transport
      };
    });

    console.log("Transformed points:", points);
    return points;
  };

  const handleToggleView = () => {
    setIs3D(!is3D);
    setUserInteracted(false); // Reset interaction state when toggling
  };

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
    const projection = is3D
      ? geoOrthographic()
          .scale(width / 2 - 10)
          .translate([width / 2, height / 2])
          .clipAngle(90)
          .precision(0.1)
      : geoMercator()
          .scale(width / 2 / Math.PI)
          .translate([width / 2, height / 2]);

    const initialScale = projection.scale();
    const path = geoPath().projection(projection);

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

    // Function to update all elements based on current projection (for 3D)
    const updateGlobe = () => {
      if (!is3D) return;

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

              // Add gray square
              element
                .append("rect")
                .attr("x", -3)
                .attr("y", -12)
                .attr("width", 5)
                .attr("height", 5)
                .attr("class", styles.markerSquare);

              // Add text with assembly count in brackets (show in both views)
              element
                .append("text")
                .attr("y", 3)
                .attr("text-anchor", "middle")
                .attr("class", styles.markerText)
                .text(`[${d.count}]`);

              // Only add location name in 2D view
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
              const coords = projection([d.longitude, d.latitude]);
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
              const deltaX = (x1 - rotation.x0) / 5;
              const deltaY = (y1 - rotation.y0) / 5;

              // Apply rotation
              projection.rotate([rotation.r0[0] + deltaX, rotation.r0[1] - deltaY, rotation.r0[2]]);

              // Update all elements
              updateGlobe();
            });

          svg.call(dragBehavior);

          // Auto-rotation animation
          const autoRotate = () => {
            if (userInteracted) return;

            const rotation = projection.rotate();
            const speed = 0.03; // Adjust rotation speed
            projection.rotate([rotation[0] + speed, rotation[1], rotation[2]]);
            updateGlobe();

            animationRef.current = requestAnimationFrame(autoRotate);
          };

          // Start auto-rotation
          autoRotate();
        }

        // Add zoom and pan functionality (works for both 2D and 3D)
        const zoom = d3
          .zoom()
          .scaleExtent([is3D ? 0.7 : 1, 8])
          .on("zoom", (event) => {
            setUserInteracted(true);

            if (is3D) {
              const newScale = initialScale * event.transform.k;
              projection.scale(newScale);

              // Update globe outline
              svg.select("circle").attr("r", newScale);

              // Update all elements
              updateGlobe();
            } else {
              // For 2D, just transform the groups
              mapGroup.attr("transform", event.transform);
              pointsGroup.attr("transform", event.transform);
            }
          });

        svg.call(zoom);
      })
      .catch((error) => {
        console.error("Error loading world map data:", error);
      });

    // Clean up animation on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [assemblies, userInteracted, is3D]);

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
