import React from "react";
import { useLocation } from "react-router-dom";
import Assemblies from "../components/listing/Assemblies";

const ListingPage = () => {
  const { pathname } = useLocation();

  return (
    <div className="listing-page">
      <div className="listings-container">{pathname === "/" && <div>Nothing here yet.</div>}</div>
      <div className="listings-container">{pathname === "/assemblies" && <Assemblies />}</div>
    </div>
  );
};

export default ListingPage;
