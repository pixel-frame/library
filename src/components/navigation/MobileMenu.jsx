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

  // List of "concrete" in 42 different languages
  const concreteTranslations = [
    "Concrete",
    "Hormigón",
    "Béton",
    "Beton",
    "Calcestruzzo",
    "Concreto",
    "Betão",
    "Beton",
    "Betong",
    "Betoni",
    "Beton",
    "Beton",
    "Beton",
    "Beton",
    "Betón",
    "Betono",
    "Betonas",
    "Betons",
    "Betón",
    "Beton",
    "Бетон",
    "Μπετόν",
    "בטון",
    "خرسانة",
    "بتن",
    "कंक्रीट",
    "कोंक्रीट",
    "ಕಾಂಕ್ರೀಟ್",
    "കോൺക്രീറ്റ്",
    "கான்கிரீட்",
    "కాంక్రీట్",
    "คอนกรีต",
    "Bê tông",
    "混凝土",
    "コンクリート",
    "콘크리트",
    "Konkrit",
    "Sima",
    "Semento",
    "Simiti",
    "Siminti",
    "Simenti",
  ];

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

            {/* Top Section: Dark Mode Toggle and Privacy Policy */}
            <div className={styles.topSection}>
              <div
                className={styles.themeToggle}
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

              <a href="/privacy-policy" className={styles.privacyLink} tabIndex="0" aria-label="Privacy Policy">
                Privacy Policy
              </a>
            </div>

            {/* Concrete in Different Languages */}
            <div className={styles.concreteContainer}>
              {concreteTranslations.map((translation, index) => (
                <div key={index} className={styles.concreteItem}>
                  <AnimatedText text={translation} delay={index * 50} />
                </div>
              ))}
            </div>

            {/* Navigation Links */}
            <nav className={styles.mobileNav}>
              <ul>
                {links &&
                  links.map((link, index) => (
                    <li key={index}>
                      <a href={link.url} tabIndex="0">
                        <AnimatedText text={link.label} delay={index * 100} />
                      </a>
                    </li>
                  ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileMenu;
