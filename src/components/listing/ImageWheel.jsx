import React, { useEffect, useRef, useState } from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import styles from "./ImageWheel.module.css";

const ImageWheel = ({ images }) => {
  const [mounted, setMounted] = useState(false);
  const imagesRef = useRef(images);
  const [sliderRef, sliderInstance] = useKeenSlider({
    loop: true,
    vertical: true,
    slides: {
      perView: 1,
      spacing: 10,
    },
    created: (s) => {
      console.log("ImageWheel slider created");
      setMounted(true);
    },
  });

  // Force a slide change when images change
  useEffect(() => {
    console.log("ImageWheel useEffect - images changed:", images);
    console.log("ImageWheel useEffect - previous images:", imagesRef.current);
    console.log("ImageWheel useEffect - sliderInstance:", sliderInstance);

    // Check if images reference has changed
    if (images !== imagesRef.current && sliderInstance && sliderInstance.current && mounted) {
      console.log("ImageWheel - Images reference changed, triggering animation");
      imagesRef.current = images;

      // Try different methods to force a slide change
      try {
        // Method 1: Use next()
        console.log("ImageWheel - Trying next() method");
        sliderInstance.current.next();

        // Method 2: Use moveToIdx
        setTimeout(() => {
          console.log("ImageWheel - Trying moveToIdx method");
          const currentIdx = sliderInstance.current.track.details?.abs || 0;
          const nextIdx = (currentIdx + 1) % (images.length || 1);
          sliderInstance.current.moveToIdx(nextIdx);
        }, 500);

        // Method 3: Force a refresh
        setTimeout(() => {
          console.log("ImageWheel - Trying refresh method");
          sliderInstance.current.refresh();
        }, 1000);
      } catch (error) {
        console.error("ImageWheel - Error during slide transition:", error);
      }
    }
  }, [sliderInstance, images, mounted]);

  // Add a manual animation trigger for debugging
  useEffect(() => {
    if (mounted && sliderInstance && sliderInstance.current) {
      const interval = setInterval(() => {
        console.log("ImageWheel - Auto-advancing slide");
        try {
          sliderInstance.current.next();
        } catch (error) {
          console.error("ImageWheel - Error in auto-advance:", error);
        }
      }, 5000); // Auto-advance every 5 seconds for testing

      return () => clearInterval(interval);
    }
  }, [sliderInstance, mounted]);

  return (
    <div ref={sliderRef} className={`keen-slider ${styles.verticalSlider}`}>
      {images && images.length > 0 ? (
        images.map((image, index) => (
          <div key={`${image.src}-${index}`} className={`keen-slider__slide ${styles.slideItem}`}>
            <img
              src={image.src}
              alt={image.alt || `Image ${index + 1}`}
              className={styles.slideImage}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        ))
      ) : (
        <>
          <div className={`keen-slider__slide ${styles.slideItem}`}>1</div>
          <div className={`keen-slider__slide ${styles.slideItem}`}>2</div>
          <div className={`keen-slider__slide ${styles.slideItem}`}>3</div>
          <div className={`keen-slider__slide ${styles.slideItem}`}>4</div>
          <div className={`keen-slider__slide ${styles.slideItem}`}>5</div>
        </>
      )}
    </div>
  );
};

export default ImageWheel;
