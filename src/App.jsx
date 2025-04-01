import { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ThemeToggle } from "./components/ThemeToggle/ThemeToggle";
import Layout from "./components/layout/Layout";
import LoadingPage from "./pages/LoadingPage";
import LoadingPagePixel from "./pages/LoadingPagePixel";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ListingPage from "./pages/ListingPage";
import AssemblyDetail from "./pages/AssemblyDetail";
import PixelDetail from "./pages/PixelDetail";
import { initMobileViewportFix } from "./utils/mobileViewportFix";
import Explore from "./pages/Explore";
import Carbon from "./pages/Emissions";
import Pixels from "./components/listing/Pixels";
import DesktopWarning from "./components/DesktopWarning/DesktopWarning";
// Wrapper component to handle the loading page logic
const AppContent = () => {
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(() => {
    try {
      return localStorage.getItem("hasSeenLoadingPage") !== "true";
    } catch (e) {
      return true;
    }
  });

  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  if (!isMobileView) {
    return <DesktopWarning />;
  }

  return (
    <>
      {isRfidSource && showLoadingOverlay && <LoadingPagePixel onProceed={handleProceed} />}
      <Layout>
        <Routes>
          <Route path="/test" element={<ListingPage />} />
          <Route path="/assemblies" element={<ListingPage />} />
          <Route path="/" element={<Pixels />} />
          <Route path="/assembly/:id" element={<AssemblyDetail />} />
          <Route path="/pixel/:id" element={<PixelDetail />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
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
