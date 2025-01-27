import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setNavigationSource } from "../store/cardSlice";
import "./ListingItem.css";

function ListingItem({ data }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleClick = () => {
    dispatch(setNavigationSource("listing"));
    navigate(`/pixel/${data.id}`);
  };

  return (
    <div className="listing-item" onClick={handleClick}>
      <model-viewer
        src={data.modelUrl}
        alt={data.title}
        shadow-intensity="1"
        environment-image="neutral"
        camera-orbit="0deg 0deg 2.5m"
        exposure="2"
        environment-intensity="2"
      >
        <button className="annotation" slot="hotspot-1" data-position="0.15 0.25 0.15" data-normal="0 1 0">
          {data.id}
        </button>
      </model-viewer>
      <div className="listing-metadata">
        <div className="listing-title">
          <h3>{data.id}</h3>
          <span>{data.entries}</span>
        </div>
        <div className="listing-details">
          <p>{data.distance} kilometers away</p>
          <p>{data.co2}</p>
        </div>
      </div>
    </div>
  );
}

export default ListingItem;
