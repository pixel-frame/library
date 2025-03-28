import { useEffect, useRef, useState } from "react";
import { Sheet } from "react-modal-sheet";
import styles from "./Card.module.css";
import Icon from "../Icons";

const SheetModal = ({ children, isOpen, onClose }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const contentRef = useRef(null);
  const [isGraphInteracting, setIsGraphInteracting] = useState(false);

  const handleScroll = (e) => {
    const isAtTop = e.target.scrollTop === 0;
    setIsScrolled(!isAtTop);
  };

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      if (isOpen) {
        onClose();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isOpen, onClose]);

  return (
    <Sheet isOpen={isOpen} onClose={onClose}>
      <Sheet.Container className={styles.card}>
        <Sheet.Header className={styles.handle} onClick={onClose} role="button" tabIndex={0} aria-label="Close sheet" />
        <div className={styles.cardHeader}>
          <div className={styles.returnButton} onClick={onClose} role="button" tabIndex={0} aria-label="Return to home">
            <Icon name="arrow" size={12} />
            <span>RETURN</span>
          </div>
        </div>
        <Sheet.Content className={styles.sheetContent} onScroll={handleScroll} ref={contentRef}>
          <Sheet.Scroller>{children}</Sheet.Scroller>
        </Sheet.Content>
      </Sheet.Container>
      {/* <Sheet.Backdrop /> */}
    </Sheet>
  );
};

export default SheetModal;
