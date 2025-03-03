import { useState } from "react";
import { ThemeToggle } from "../ThemeToggle/ThemeToggle";
import styles from "./MobileMenu.module.css";

const MobileMenu = ({ links }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleToggle();
    }
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        className={`${styles.hamburgerIcon} ${isOpen ? styles.open : ""}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
        tabIndex="0"
      >
        <span className={styles.hamburgerLine}></span>
        <span className={styles.hamburgerLine}></span>
        <span className={styles.hamburgerLine}></span>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className={styles.mobileMenuOverlay}>
          <div className={styles.mobileMenuContent}>
            {/* Close Button */}
            <button className={styles.closeButton} onClick={handleToggle} aria-label="Close menu" tabIndex="0">
              ×
            </button>

            {/* Navigation Links */}
            <nav className={styles.mobileNav}>
              <ul>
                {links &&
                  links.map((link, index) => (
                    <li key={index}>
                      <a href={link.url}>{link.label}</a>
                    </li>
                  ))}
              </ul>
            </nav>

            <div className={styles.themeToggleContainer}>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileMenu;
