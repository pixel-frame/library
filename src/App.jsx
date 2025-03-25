import { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ThemeToggle } from "./components/ThemeToggle/ThemeToggle";
import Layout from "./components/layout/Layout";
import LoadingPage from "./pages/LoadingPage";
import LoadingPagePixel from "./pages/LoadingPagePixel";
import DetailsTestPage from "./components/DetailsTestPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ListingPage from "./pages/ListingPage";
import AssemblyDetail from "./pages/AssemblyDetail";
import PixelDetail from "./pages/PixelDetail";
import { initMobileViewportFix } from "./utils/mobileViewportFix";
import Explore from "./pages/Explore";
import Carbon from "./pages/Emissions";
// Wrapper component to handle the loading page logic
const AppContent = () => {
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(() => {
    try {
      return localStorage.getItem("hasSeenLoadingPage") !== "true";
    } catch (e) {
      return true;
    }
  });

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isRfidSource = searchParams.get("source") === "rfid";
  const navigate = useNavigate();

  const handleProceed = () => {
    try {
      localStorage.setItem("hasSeenLoadingPage", "true");
    } catch (e) {
      console.error("Could not save to localStorage:", e);
    }
    setShowLoadingOverlay(false);
  };

  return (
    <>
      {isRfidSource && <LoadingPagePixel onProceed={handleProceed} />}
      <Layout>
        <Routes>
          <Route path="/" element={<ListingPage />} />
          <Route path="/assemblies" element={<ListingPage />} />
          <Route path="/pixels" element={<ListingPage />} />
          <Route path="/assembly/:id" element={<AssemblyDetail />} />
          <Route path="/pixel/:id" element={<PixelDetail />} />
          <Route path="/details" element={<DetailsTestPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="*" element={<DetailsTestPage />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/emissions" element={<Carbon />} />
        </Routes>
      </Layout>
    </>
  );
};

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Dynamically import model-viewer when component mounts
    import("@google/model-viewer");

    // Initialize mobile viewport fix
    initMobileViewportFix();
  }, []);

  return (
    <ThemeProvider>
      <div className="app">
        <AppContent />
      </div>
    </ThemeProvider>
  );
}

export default App;
