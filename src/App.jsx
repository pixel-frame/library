import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ThemeToggle } from "./components/ThemeToggle/ThemeToggle";
import LoadingPage from "./pages/LoadingPage";
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
          <Route path="/" element={<LoadingPage />} />
          <Route path="/details" element={<DetailsTestPage />} />
          <Route path="*" element={<LoadingPage />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;
