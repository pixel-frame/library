import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import GridMap from "./components/GridMap";
import Card from "./components/Card";
import AboutPage from "./components/AboutPage";
import ListingDetailPage from "./components/ListingDetailPage";
import LoadingScreen from "./components/LoadingScreen";
import DetailsTestPage from "./components/DetailsTestPage";
import { setDetailView } from "./store/cardSlice";
import "./App.css";

function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { hasShownIntro } = useSelector((state) => state.loading);
  const [activeModal, setActiveModal] = useState(false);

  useEffect(() => {
    // Dynamically import model-viewer when component mounts
    import("@google/model-viewer");
  }, []);

  useEffect(() => {
    // Set detail view state based on URL
    dispatch(setDetailView(location.pathname.includes("/pixel/")));
  }, [location, dispatch]);

  // Extract ID from path if we're on a detail page
  const selectedId = location.pathname.includes("/pixel/") ? location.pathname.split("/pixel/")[1].split("?")[0] : null;

  // If we're on the details test page, render only that
  if (location.pathname === "/details") {
    return <DetailsTestPage />;
  }

  // Otherwise render the main app layout
  return (
    <div className="app">
      {!hasShownIntro ? (
        <LoadingScreen />
      ) : (
        <>
          {/* Always render the base view */}
          <GridMap
            selectedId={selectedId}
            onModalOpen={() => setActiveModal(true)}
            onModalClose={() => setActiveModal(false)}
          />
          <Card isModalActive={activeModal}>
            <Routes>
              <Route path="/" element={<AboutPage />} />
              <Route path="/pixel/:id" element={<ListingDetailPage />} />
            </Routes>
          </Card>
        </>
      )}
    </div>
  );
}

export default App;
