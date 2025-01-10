import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useSelector, useDispatch } from "react-redux";
import "mapbox-gl/dist/mapbox-gl.css";

const MapViewer = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const { center, zoom } = useSelector((state) => state.map);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: center,
      zoom: zoom,
    });
  }, []);

  return <div ref={mapContainer} style={{ width: "100%", height: "500px" }} />;
};

export default MapViewer;
