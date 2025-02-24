import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ThemeToggle } from "./components/ThemeToggle/ThemeToggle";
import DetailsTestPage from "./components/DetailsTestPage";

function App() {
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    // Dynamically import model-viewer when component mounts
    import("@google/model-viewer");
  }, []);

  return (
    <ThemeProvider>
      <div className="app">
        <ThemeToggle />
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
    </ThemeProvider>
  );
}

export default App;
