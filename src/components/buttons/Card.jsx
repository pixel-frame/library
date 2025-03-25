import { useEffect, useRef, useState } from "react";
import styles from "./Card.module.css";

const Card = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const cardRef = useRef(null);
  const contentRef = useRef(null);

  const handleScroll = () => {
    if (contentRef.current && !isScrolled) {
      setIsScrolled(true);
    }
  };

  useEffect(() => {
    const currentCard = cardRef.current;
    if (currentCard) {
      currentCard.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (currentCard) {
        currentCard.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${isScrolled ? styles.expanded : ""}`}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.handle} aria-hidden="true" />
      <div ref={contentRef} className={styles.content}>
        {children}
      </div>
    </div>
  );
};

export default Card;
