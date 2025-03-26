import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../widgets/Button";
import Assemblies from "../components/listing/Assemblies";
import Pixels from "../components/listing/Pixels";
import Carbon from "../components/datavis/Carbon";
import InteractiveGlobe from "../components/globe/InteractiveGlobe";
import TestList from "../components/listing/TestList";
import ImageList from "../components/listing/ImageList";
import styles from "./ListingPage.module.css";

const ListingPage = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [showMap, setShowMap] = React.useState(false);
  const [showCarbon, setCarbon] = React.useState(false);
  const [showGlobe, setGlobe] = React.useState(false);
  const [showWheel, setShowWheel] = React.useState(false);
  const [selectedPixelIndex, setSelectedPixelIndex] = React.useState(0);

  const handleMapToggle = () => {
    setShowMap(!showMap);
    navigate("/");
  };

  const handleToggle = () => {
    setCarbon(!showCarbon);
    navigate("/");
  };

  const handleGlobeToggle = () => {
    setGlobe(!showGlobe);
    navigate("/");
  };

  const handleWheelToggle = () => {
    setShowWheel(!showWheel);
    navigate("/");
  };

  const handlePixelSelection = (index) => {
    console.log("ListingPage received index change:", index);
    setSelectedPixelIndex(index);
  };

  return (
    <div className="listing-page">
      <div className="listings-container">
        {pathname === "/" && (
          <div className="button-container">
            <Button onClick={() => navigate("/pixels")}>[Pixels]</Button>
            <Button onClick={() => navigate("/assemblies")}>[Assemblies]</Button>
            <Button onClick={handleMapToggle}>[{showMap ? "Hide Map" : "Map"}]</Button>
            <Button onClick={handleToggle}>[{showCarbon ? "Hide Carbon" : "Carbon"}]</Button>
            <Button onClick={handleGlobeToggle}>[{showGlobe ? "Hide Globe" : "Globe"}]</Button>
            <Button onClick={handleWheelToggle}>[{showWheel ? "Hide Wheel" : "Wheel"}]</Button>
          </div>
        )}
      </div>
      <div className="listings-container">{pathname === "/assemblies" && <Assemblies />}</div>
      <div className="listings-container">{pathname === "/pixels" && <Pixels />}</div>
      <div className="listings-container">{pathname === "/" && showMap && <Map mode="map" />}</div>
      <div className="listings-container">{pathname === "/" && showCarbon && <Carbon />}</div>
      <div className="listings-container">{pathname === "/" && showGlobe && <InteractiveGlobe />}</div>
      {pathname === "/" && showWheel && (
        <div className={styles.wheelsContainer}>
          <div className={styles.wheelSection}>
            <ImageList selectedPixelIndex={selectedPixelIndex} />
          </div>
          <div className={styles.wheelSection}>
            <TestList onSelectionChange={handlePixelSelection} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingPage;
