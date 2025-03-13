import { useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import styles from "./MobileMenu.module.css";
import { AnimatedText } from "../text/AnimatedText";

const MobileMenu = ({ links }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
                      <a href={link.url}>
                        <AnimatedText text={link.label} delay={index * 100} />
                      </a>
                    </li>
                  ))}
              </ul>
            </nav>

            <div
              className={styles.themeStatus}
              onClick={toggleTheme}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  toggleTheme();
                }
              }}
              tabIndex="0"
              role="button"
              aria-label="Toggle dark mode"
            >
              DARK MODE: {theme === "dark" ? "ON" : "OFF"}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileMenu;
