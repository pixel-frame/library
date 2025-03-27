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

  return (
    <Sheet isOpen={isOpen} onClose={onClose} detent="content-height">
      <Sheet.Container className={`${styles.card} ${isScrolled ? styles.expanded : ""}`}>
        <Sheet.Header className={styles.handle} />
        <Sheet.Content className={styles.content} onScroll={handleScroll} ref={contentRef}>
          {children}
        </Sheet.Content>
      </Sheet.Container>
      {/* <Sheet.Backdrop /> */}
    </Sheet>
  );
};

export default SheetModal;
