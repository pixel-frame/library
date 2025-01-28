import { useState, useEffect, useRef } from "react";
import DetailModal from "./DetailModal";
import "./ModalCarousel.css";

function ModalCarousel({ selectedPixel, connections, onClose }) {
  const [modalStack, setModalStack] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef(null);
  const touchStartX = useRef(0);

  useEffect(() => {
    if (selectedPixel) {
      // Get connected pixels based on beam connections
      const connectedIds = connections.beams.map((id) => id);

      // Create modal stack with selected pixel first
      const stack = [
        {
          pixel: selectedPixel,
          connections: connections,
        },
        ...connectedIds.map((id) => ({
          pixel: { id },
          connections: {
            beams: [], // These would come from your data source
            columns: [],
          },
        })),
      ];

      setModalStack(stack);
      setActiveIndex(0);
    }
  }, [selectedPixel, connections]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!carouselRef.current) return;

    const touchDelta = touchStartX.current - e.touches[0].clientX;
    const threshold = 100; // Minimum swipe distance

    if (Math.abs(touchDelta) > threshold) {
      if (touchDelta > 0) {
        handleNext();
      } else {
        handlePrev();
      }
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const handleNext = () => {
    if (activeIndex < modalStack.length - 1) {
      setActiveIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="modal-carousel" ref={carouselRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
      <div
        className="modal-track"
        style={{
          transform: `translateX(${-activeIndex * 100}%)`,
        }}
      >
        {modalStack.map((modal, index) => (
          <div
            key={modal.pixel.id}
            className={`modal-slide ${index === activeIndex ? "active" : ""}`}
            style={{
              transform: `translateX(${index * 100}%)`,
            }}
          >
            <DetailModal pixel={modal.pixel} structuralConnections={modal.connections} onClose={onClose} />
          </div>
        ))}
      </div>

      {modalStack.length > 1 && (
        <>
          {activeIndex > 0 && (
            <button className="modal-nav prev" onClick={handlePrev}>
              ←
            </button>
          )}
          {activeIndex < modalStack.length - 1 && (
            <button className="modal-nav next" onClick={handleNext}>
              →
            </button>
          )}
        </>
      )}

      <div className="modal-indicators">
        {modalStack.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === activeIndex ? "active" : ""}`}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default ModalCarousel;
