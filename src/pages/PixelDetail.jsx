import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import StoryTab from "../components/pixelTabs/StoryTab";
import InfoTab from "../components/pixelTabs/InfoTab";
import styles from "./PixelDetail.module.css";
import CloseButton from "../components/buttons/CloseButton";
import AssemblyDetail from "./AssemblyDetail";

const TABS = [
  { id: "info", label: "[ Details ]", component: InfoTab },
  { id: "story", label: "[ History ]", component: StoryTab },
  { id: "network", label: "[ Assembly ]", component: AssemblyDetail },
];

const PixelDetail = ({ id: propId, initialTab = "info", onClose }) => {
  const { id: urlId } = useParams();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");

  // Use prop ID if provided, otherwise fall back to URL param
  const pixelId = propId || urlId;
  const [activeTab, setActiveTab] = useState(tabFromUrl || initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pixelData, setPixelData] = useState(null);

  useEffect(() => {
    const fetchPixelDetail = async () => {
      if (!pixelId) return;

      try {
        const paddedId = pixelId.toString().padStart(4, "0");
        const response = await fetch(`/data/bank/pixel/pixel_${paddedId}.json`);
        if (!response.ok) throw new Error("Pixel not found");
        const data = await response.json();
        setPixelData(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    setLoading(true);
    fetchPixelDetail();
  }, [pixelId]);

  const handleTabChange = (tab) => () => {
    setActiveTab(tab);
  };

  const handleNavigateBack = () => {
    window.history.back();
  };

  if (loading) return <div className={styles.loadingIndicator}>Loading pixel details...</div>;
  if (error) return <div className={styles.errorMessage}>{error}</div>;
  if (!pixelData) return <div className={styles.errorMessage}>Pixel not found</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <nav className={styles.navigation} role="tablist">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              className={`${styles.tabButton} ${activeTab === id ? styles.tabButtonActive : ""}`}
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`${id}-tab`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
          <div className={styles.closeButtonContainer}>
            <CloseButton onClick={onClose} ariaLabel="Close pixel details" />
          </div>
        </nav>
      </div>

      {TABS.map(({ id: tabId, component: TabComponent }) => {
        const props = {
          pixel: pixelData,
          isActive: activeTab === tabId,
          loading,
          error,
          pixelId,
        };

        if (tabId === "network" && pixelData?.timeline?.length > 0) {
          const lastTimelineEntry = pixelData.timeline[pixelData.timeline.length - 1];
          if (lastTimelineEntry?.reconfiguration_number) {
            props.assemblyId = lastTimelineEntry.reconfiguration_number.toString().padStart(4, "0");
          }
        }

        return (
          <div
            key={tabId}
            id={`${tabId}-tab`}
            className={`${styles.tabPanel} ${activeTab === tabId ? styles.tabPanelActive : ""}`}
            role="tabpanel"
            aria-hidden={activeTab !== tabId}
          >
            <TabComponent {...props} />
          </div>
        );
      })}
    </div>
  );
};

export default PixelDetail;
