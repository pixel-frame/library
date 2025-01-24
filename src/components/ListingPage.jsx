import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setExpanded } from "../store/cardSlice";
import "./ListingPage.css";
import ListingItem from "./ListingItem";

function ListingPage() {
  const dispatch = useDispatch();
  const { isExpanded } = useSelector((state) => state.card);

  useEffect(() => {
    // Set expanded on initial load
    dispatch(setExpanded(true));
  }, []); // Empty dependency array means this runs once on mount

  const listing = {
    id: "PIXEL 072",
    entries: "4",
    distance: "1,670",
    co2: "30",
    modelUrl: "/pixel.gltf",
    title: "Pixel Frame",
    description: "Material Pasts | Material Futures",
  };

  // Create array of 10 items
  const listings = Array(10)
    .fill(listing)
    .map((item, index) => ({
      ...item,
      id: `PIXEL ${(72 + index).toString().padStart(3, "0")}`,
    }));

  return (
    <div className="listing-page">
      {listings.map((listing) => (
        <ListingItem key={listing.id} data={listing} />
      ))}
      {isExpanded && (
        <button className="explore-button" onClick={() => dispatch(setExpanded(false))}>
          Explore [+]
        </button>
      )}
    </div>
  );
}

export default ListingPage;
