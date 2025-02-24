import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import DetailsTestPage from "./components/DetailsTestPage";
import "./App.css";

function App() {
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    // Dynamically import model-viewer when component mounts
    import("@google/model-viewer");
  }, []);

  return (
    <div className="app">
      <Routes>
        {/* Details test page route */}
        <Route path="/details" element={<DetailsTestPage />} />
        {/* Main app routes */}
        <Route
          path="*"
          element={
            <>
              <div>Hello</div>
            </>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
