import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setExpanded } from "../store/cardSlice";
import Card from "./Card";
import "./ListingDetailPage.css";

function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "model";

  const handleTabChange = (view) => {
    navigate(`/pixel/${id}?view=${view}`);
  };

  const handleMapClick = () => {
    dispatch(setExpanded(false));
  };

  const handleScroll = (e) => {
    const threshold = 50; // pixels scrolled before triggering
    if (e.target.scrollTop > threshold) {
      dispatch(setExpanded(false));
    }
  };

  // Mock data - in real app, fetch based on ID
  const listing = {
    id: `PIXEL ${id}`,
    title: "Pixel Frame",
    description: "Material Pasts | Material Futures",
    modelUrl: "/pixel.gltf",
  };

  const renderContent = () => {
    switch (currentView) {
      case "model":
        return (
          <div className="model-container">
            <model-viewer
              src={listing.modelUrl}
              alt={listing.title}
              shadow-intensity="1"
              environment-image="neutral"
              style={{ width: "99%", height: "90vh" }}
              camera-orbit="45deg 55deg 2.5m"
              exposure="2"
              environment-intensity="2"
              auto-rotate
              camera-controls
              ar
              ar-modes="webxr scene-viewer quick-look"
            >
              <button className="annotation" slot="hotspot-1" data-position="0.15 0.25 0.15" data-normal="0 1 0">
                {listing.id}
              </button>
            </model-viewer>
          </div>
        );
      case "info":
        return (
          <div className="info-content">
            <h2>{listing.title}</h2>
            <p>{listing.description}</p>
          </div>
        );
      case "map":
        return (
          <div className="map-content">
            <h2>Location Map</h2>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="listing-detail-container" onScroll={handleScroll}>
      <Card>
        <div className="listing-detail">
          <div className="detail-content">{renderContent()}</div>
          <div className="detail-tabs">
            <button
              className={`tab ${currentView === "model" ? "active" : ""}`}
              onClick={() => handleTabChange("model")}
            >
              Model
            </button>
            <button className={`tab ${currentView === "info" ? "active" : ""}`} onClick={() => handleTabChange("info")}>
              Info
            </button>
            <button className={`tab ${currentView === "map" ? "active" : ""}`} onClick={() => handleTabChange("map")}>
              Map
            </button>
          </div>
        </div>
      </Card>
      <div className="map-peek" onClick={handleMapClick}>
        {/* This will show the top portion of the grid map */}
      </div>
    </div>
  );
}

export default ListingDetailPage;
