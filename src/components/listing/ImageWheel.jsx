import React, { useRef } from "react";
import { useKeenSlider } from "keen-slider/react";
import styles from "./ImageWheel.module.css";

export default function ImageWheel(props) {
  const perspective = props.perspective || "center";
  const wheelSize = 15;
  const slides = props.length;
  const slideDegree = 360 / wheelSize;
  const slidesPerView = props.loop ? 8 : 1;
  const [sliderState, setSliderState] = React.useState(null);
  const size = useRef(0);
  const options = useRef({
    slides: {
      number: slides,
      origin: props.loop ? "center" : "auto",
      perView: slidesPerView,
    },
    vertical: true,
    initial: props.initIdx || 0,
    loop: props.loop,
    dragSpeed: (val) => {
      const height = size.current;
      return val * (height / ((height / 2) * Math.tan(slideDegree * (Math.PI / 180))) / slidesPerView);
    },
    created: (s) => {
      size.current = s.size;
    },
    updated: (s) => {
      size.current = s.size;
    },
    detailsChanged: (s) => {
      setSliderState(s.track.details);
    },
    rubberband: !props.loop,
    mode: "free-snap",
  });

  const [sliderRef, slider] = useKeenSlider(options.current);
  const [radius, setRadius] = React.useState(0);

  React.useEffect(() => {
    if (slider.current) setRadius(slider.current.size / 2);
  }, [slider]);

  React.useEffect(() => {
    if (sliderState && props.onIndexChange) {
      // Get the current centered index
      const currentIndex = sliderState.abs;
      props.onIndexChange(currentIndex);
    }
  }, [sliderState, props.onIndexChange]);

  // Add effect to move slider when currentIndex changes externally
  React.useEffect(() => {
    if (slider.current && props.currentIndex !== undefined && sliderState && sliderState.abs !== props.currentIndex) {
      slider.current.moveToIdx(props.currentIndex);
    }
  }, [props.currentIndex, slider, sliderState]);

  function slideValues() {
    if (!sliderState) return [];
    const offset = props.loop ? 1 / 2 - 1 / slidesPerView / 2 : 0;

    const values = [];
    for (let i = 0; i < slides; i++) {
      const distance = sliderState ? (sliderState.slides[i].distance - offset) * slidesPerView : 0;
      const rotate = Math.abs(distance) > wheelSize / 2 ? 180 : distance * (360 / wheelSize) * -1;
      const isUpsideDown = Math.abs(rotate) > 90;
      const isActive = Math.abs(distance) < 0.15 && rotate > -45 && rotate < 45;
      const style = {
        transform: `rotateX(${rotate}deg) translateZ(${radius}px)`,
        WebkitTransform: `rotateX(${rotate}deg) translateZ(${radius}px)`,
      };
      const value = props.setValue ? props.setValue(i, sliderState.abs + Math.round(distance)) : i;
      values.push({ style, value, isUpsideDown, isActive });
    }
    return values;
  }

  const wheelClass = `${styles.wheel} keen-slider ${styles[`wheel--perspective-${perspective}`]}`;

  return (
    <div className={wheelClass} ref={sliderRef}>
      <div className={styles.wheelInner}>
        <div className={styles.wheelSlides} style={{ width: props.width + "px" }}>
          {slideValues().map(({ style, value, isUpsideDown, isActive }, idx) => (
            <div
              className={`${styles.wheelSlide} ${isUpsideDown ? styles.hiddenSlide : ""} ${
                isActive ? styles.activeSlide : ""
              }`}
              style={style}
              key={idx}
            >
              <div className={styles.imageContainer}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
