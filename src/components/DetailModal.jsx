import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setNavigationSource, setModalActive } from "../store/cardSlice";
import "./DetailModal.css";

function DetailModal({ pixel, onClose }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      dispatch(setNavigationSource("map"));
      dispatch(setModalActive(false));
      navigate(`/pixel/${pixel.id}`);
    },
    [navigate, pixel.id, dispatch]
  );

  const handleModalClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  return (
    <div className="detail-modal" onClick={handleModalClick}>
      <div className="modal-content" onClick={handleClick}>
        <div className="modal-header">
          <h3>PIXEL {pixel.id}</h3>
          <button
            className="close-button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            ×
          </button>
        </div>
        <div className="modal-model">
          <model-viewer
            src="/pixel.gltf"
            alt={`Pixel ${pixel.id}`}
            shadow-intensity="1"
            environment-image="neutral"
            camera-orbit="0deg 0deg 2.5m"
            exposure="2"
            environment-intensity="2"
            auto-rotate
          />
        </div>
        <div className="modal-info">
          <div className="info-row">
            <span>Location:</span>
            <span>{pixel.location === "near" ? "Near Field" : "Far Field"}</span>
          </div>
          <div className="info-row">
            <span>Status:</span>
            <span>{pixel.availability ? "Available" : "Unavailable"}</span>
          </div>
        </div>
        <div className="modal-footer">Tap for full details →</div>
      </div>
    </div>
  );
}

export default DetailModal;
