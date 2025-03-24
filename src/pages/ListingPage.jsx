import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../widgets/Button";
import Assemblies from "../components/listing/Assemblies";
import Pixels from "../components/listing/Pixels";
import Map from "../components/datavis/Map";
import InteractiveGlobe from "../components/globe/InteractiveGlobe";
const ListingPage = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [showMap, setShowMap] = React.useState(false);
  const [showCarbon, setCarbon] = React.useState(false);
  const [showGlobe, setGlobe] = React.useState(false);
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
          </div>
        )}
      </div>
      <div className="listings-container">{pathname === "/assemblies" && <Assemblies />}</div>
      <div className="listings-container">{pathname === "/pixels" && <Pixels />}</div>
      <div className="listings-container">{pathname === "/" && showMap && <Map mode="map" />}</div>
      <div className="listings-container">{pathname === "/" && showCarbon && <Map mode="carbon" />}</div>
      <div className="listings-container">{pathname === "/" && showGlobe && <InteractiveGlobe />}</div>
    </div>
  );
};

export default ListingPage;
