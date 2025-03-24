import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./bottomNav.module.css";

const BottomNav = () => {
  const [activeTab, setActiveTab] = useState("bank");
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    // Show nav when scrolling up or at the top, hide when scrolling down
    if (currentScrollY <= 0) {
      setIsVisible(true);
    } else if (currentScrollY > lastScrollY) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }

    setLastScrollY(currentScrollY);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleNavClick = (tabName) => {
    setActiveTab(tabName);
  };

  const handleKeyDown = (e, tabName) => {
    if (e.key === "Enter" || e.key === " ") {
      setActiveTab(tabName);
    }
  };

  return (
    <nav className={`${styles.bottomNav} ${isVisible ? "" : styles.hidden}`}>
      <div className={styles.navContainer}>
        <Link
          to="/pixels"
          className={`${styles.navItem} ${activeTab === "bank" ? styles.active : ""}`}
          onClick={() => handleNavClick("bank")}
          onKeyDown={(e) => handleKeyDown(e, "bank")}
          tabIndex="0"
          aria-label="Bank"
          aria-current={activeTab === "bank" ? "page" : undefined}
        >
          <div className={styles.square}></div>
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
          <div className={styles.circle}></div>
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
          <div className={styles.triangle}></div>
          <span className={styles.navText}>Explore</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;
