import { useSelector, useDispatch } from "react-redux";
import { setExpanded } from "../store/cardSlice";
import "./Card.css";

function Card({ children }) {
  const dispatch = useDispatch();
  const { isExpanded, isDetailView } = useSelector((state) => state.card);

  const handleClick = () => {
    if (!isExpanded) {
      dispatch(setExpanded(true));
    }
  };

  const handleScroll = (e) => {
    if (e.target.scrollTop > 50 && !isExpanded) {
      dispatch(setExpanded(true));
    }
    if (e.target.scrollTop === 0 && isExpanded) {
      dispatch(setExpanded(false));
    }
  };

  return (
    <div className={`card ${isExpanded ? "expanded" : ""}`} onClick={handleClick}>
      <div className="card-content" onScroll={handleScroll}>
        {children}
      </div>
    </div>
  );
}

export default Card;