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
        className={`hamburger-icon ${isOpen ? "open" : ""}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
        tabIndex="0"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu-content">
            {/* Close Button */}
            <button className={styles.closeButton} onClick={handleToggle} aria-label="Close menu" tabIndex="0">
              ×
            </button>

            {/* Navigation Links */}
            <nav className="mobile-nav">
              <ul>
                {links &&
                  links.map((link, index) => (
                    <li key={index}>
                      <a href={link.url}>{link.label}</a>
                    </li>
                  ))}
              </ul>
            </nav>

            <ThemeToggle />
          </div>
        </div>
      )}
    </>
  );
};

export default MobileMenu;
