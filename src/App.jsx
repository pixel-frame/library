import { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ThemeToggle } from "./components/ThemeToggle/ThemeToggle";
import Layout from "./components/layout/Layout";
import LoadingPage from "./pages/LoadingPage";
import DetailsTestPage from "./components/DetailsTestPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ListingPage from "./pages/ListingPage";
import AssemblyDetail from "./pages/AssemblyDetail";
import PixelDetail from "./pages/PixelDetail";
// Wrapper component to handle the loading page logic
const AppContent = () => {
  const [hasSeenLoadingPage, setHasSeenLoadingPage] = useState(() => {
    // This runs only on initial render and properly handles server-side rendering
    try {
      return localStorage.getItem("hasSeenLoadingPage") === "true";
    } catch (e) {
      return false;
    }
  });

  const location = useLocation();
  const navigate = useNavigate();

  const handleProceed = () => {
    try {
      localStorage.setItem("hasSeenLoadingPage", "true");
    } catch (e) {
      console.error("Could not save to localStorage:", e);
    }
    setHasSeenLoadingPage(true);
  };

  // If user hasn't seen loading page, show it
  if (!hasSeenLoadingPage) {
    return <LoadingPage onProceed={handleProceed} />;
  }

  // Otherwise show the actual content
  return (
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
      </Routes>
    </Layout>
  );
};

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Dynamically import model-viewer when component mounts
    import("@google/model-viewer");
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
