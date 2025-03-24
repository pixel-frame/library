import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
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

const PixelDetail = () => {
  const { id } = useParams();
  const [pixel, setPixel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    const fetchPixelDetail = async () => {
      try {
        const paddedId = id.toString().padStart(4, "0");
        const response = await fetch(`/data/bank/pixel/pixel_${paddedId}.json`);
        if (!response.ok) throw new Error("Pixel not found");
        const data = await response.json();
        setPixel(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPixelDetail();
  }, [id]);

  const handleTabChange = (tab) => () => {
    setActiveTab(tab);
  };

  const handleNavigateBack = () => {
    window.history.back();
  };

  if (loading) return <div className={styles.loadingIndicator}>Loading pixel details...</div>;
  if (error) return <div className={styles.errorMessage}>{error}</div>;
  if (!pixel) return <div className={styles.errorMessage}>Pixel not found</div>;

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
              onClick={handleTabChange(id)}
            >
              {label}
            </button>
          ))}
          <div className={styles.closeButtonContainer}>
            <CloseButton onClick={handleNavigateBack} ariaLabel="Back to pixels list" />
          </div>
        </nav>
      </div>

      {TABS.map(({ id: tabId, component: TabComponent }) => {
        // Special handling for AssemblyDetail component
        const props = {
          pixel,
          isActive: activeTab === tabId,
          loading,
          error,
          pixelId: id,
        };

        // For the network tab, use the last timeline entry's reconfiguration number
        if (tabId === "network" && pixel && pixel.timeline && pixel.timeline.length > 0) {
          // Get the last timeline entry
          const lastTimelineEntry = pixel.timeline[pixel.timeline.length - 1];

          console.log("Timeline entries:", pixel.timeline);
          console.log("Last timeline entry:", lastTimelineEntry);

          if (lastTimelineEntry && lastTimelineEntry.reconfiguration_number) {
            // Format the reconfiguration number as a 4-digit string with leading zeros
            const formattedAssemblyId = lastTimelineEntry.reconfiguration_number.toString().padStart(4, "0");
            props.assemblyId = formattedAssemblyId;
            console.log("Using assembly ID from timeline:", props.assemblyId);
          } else {
            console.log("No reconfiguration found in last timeline entry for pixel:", id);
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
