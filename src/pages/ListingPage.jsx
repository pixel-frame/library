import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../widgets/Button";
import Assemblies from "../components/listing/Assemblies";
import Pixels from "../components/listing/Pixels";

const ListingPage = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="listing-page">
      <div className="listings-container">
        {pathname === "/" && (
          <div className="button-container">
            <Button onClick={() => navigate("/pixels")}>[Pixels]</Button>
            <Button onClick={() => navigate("/assemblies")}>[Assemblies]</Button>
          </div>
        )}
      </div>
      <div className="listings-container">{pathname === "/assemblies" && <Assemblies />}</div>
      <div className="listings-container">{pathname === "/pixels" && <Pixels />}</div>
    </div>
  );
};

export default ListingPage;
