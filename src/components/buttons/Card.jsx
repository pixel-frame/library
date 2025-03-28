import { useEffect, useRef, useState } from "react";
import { Sheet } from "react-modal-sheet";
import styles from "./Card.module.css";

const SheetModal = ({ children, isOpen, onClose }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const contentRef = useRef(null);

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
        <Sheet.Header className={styles.handle} />
        <Sheet.Content onScroll={handleScroll} ref={contentRef}>
          <Sheet.Scroller> {children}</Sheet.Scroller>
        </Sheet.Content>
      </Sheet.Container>
      {/* <Sheet.Backdrop /> */}
    </Sheet>
  );
};

export default SheetModal;
