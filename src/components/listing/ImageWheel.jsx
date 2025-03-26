import React from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import styles from "./ImageWheel.module.css";

const ImageWheel = ({ images }) => {
  const [sliderRef] = useKeenSlider(
    {
      loop: true,
      vertical: true,
      slides: {
        perView: 1,
        spacing: 10,
      },
    },
    [
      (slider) => {
        let timeout;
        let touchActive = false;

        function clearNextTimeout() {
          clearTimeout(timeout);
        }

        function nextTimeout() {
          clearTimeout(timeout);
          if (touchActive) return;
          timeout = setTimeout(() => {
            slider.next();
          }, 3000);
        }

        slider.on("created", () => {
          slider.container.addEventListener(
            "touchstart",
            () => {
              touchActive = true;
              clearNextTimeout();
            },
            { passive: true }
          );

          slider.container.addEventListener("touchend", () => {
            touchActive = false;
            nextTimeout();
          });

          nextTimeout();
        });

        slider.on("dragStarted", clearNextTimeout);
        slider.on("animationEnded", nextTimeout);
        slider.on("updated", nextTimeout);
      },
    ]
  );

  return (
    <div ref={sliderRef} className={`keen-slider ${styles.verticalSlider}`}>
      {images && images.length > 0 ? (
        images.map((image, index) => (
          <div key={index} className={`keen-slider__slide ${styles.slideItem}`}>
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
