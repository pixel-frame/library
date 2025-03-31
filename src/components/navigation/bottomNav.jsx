import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./bottomNav.module.css";
import Icon from "../Icons";

const BottomNav = () => {
  const [activeTab, setActiveTab] = useState("bank");

  const handleNavClick = (tabName) => {
    setActiveTab(tabName);
  };

  const isDetailPage = location.pathname.includes("/pixel/");

  // If we're on a detail page, don't render the nav at all
  if (isDetailPage) {
    return null;
  }

  const handleKeyDown = (e, tabName) => {
    if (e.key === "Enter" || e.key === " ") {
      setActiveTab(tabName);
    }
  };

  return (
    <nav className={styles.bottomNav}>
      <div className={styles.navContainer}>
        <Link
          to="/"
          className={`${styles.navItem} ${activeTab === "bank" ? styles.active : ""}`}
          onClick={() => handleNavClick("bank")}
          onKeyDown={(e) => handleKeyDown(e, "bank")}
          tabIndex="0"
          aria-label="Bank"
          aria-current={activeTab === "bank" ? "page" : undefined}
        >
          <Icon name="star" size={14} className={styles.navIcon} active={activeTab === "bank"} />
          <span className={styles.navText}>Bank</span>
        </Link>

        <Link
          to="/emissions"
          className={`${styles.navItem} ${activeTab === "emissions" ? styles.active : ""}`}
          onClick={() => handleNavClick("emissions")}
          onKeyDown={(e) => handleKeyDown(e, "emissions")}
          tabIndex="0"
          aria-label="Emissions"
          aria-current={activeTab === "emissions" ? "page" : undefined}
        >
          <Icon name="leaf" size={15} className={styles.navIcon} active={activeTab === "emissions"} />
          <span className={styles.navText}>Emissions</span>
        </Link>

        <Link
          to="/explore"
          className={`${styles.navItem} ${activeTab === "explore" ? styles.active : ""}`}
          onClick={() => handleNavClick("explore")}
          onKeyDown={(e) => handleKeyDown(e, "explore")}
          tabIndex="0"
          aria-label="Explore"
          aria-current={activeTab === "explore" ? "page" : undefined}
        >
          <Icon name="config" size={16} className={styles.navIcon} active={activeTab === "explore"} />
          <span className={styles.navText}>Explore</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;
