import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import StoryTab from "../components/pixelTabs/StoryTab";
import InfoTab from "../components/pixelTabs/InfoTab";
import NetworkTab from "../components/pixelTabs/NetworkTab";
import styles from "./PixelDetail.module.css";
import CloseButton from "../components/buttons/CloseButton";

const TABS = [
  { id: "info", label: "[ INFO ]", component: InfoTab },
  { id: "story", label: "[ STORY ]", component: StoryTab },
  { id: "network", label: "[ NETWORK ]", component: NetworkTab },
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

      {TABS.map(({ id, component: TabComponent }) => (
        <div
          key={id}
          id={`${id}-tab`}
          className={`${styles.tabPanel} ${activeTab === id ? styles.tabPanelActive : ""}`}
          role="tabpanel"
          aria-hidden={activeTab !== id}
        >
          <TabComponent pixel={pixel} isActive={activeTab === id} loading={loading} error={error} />
        </div>
      ))}
    </div>
  );
};

export default PixelDetail;
