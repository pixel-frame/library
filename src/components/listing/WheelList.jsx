import React, { useRef } from "react";
import { useKeenSlider } from "keen-slider/react";
import styles from "./WheelList.module.css";
import { AnimatedText } from "../text/AnimatedText";

export default function Wheel(props) {
  const perspective = props.perspective || "center";
  const wheelSize = 20;
  const slides = props.length;
  const slideDegree = 360 / wheelSize;
  const slidesPerView = props.loop ? 9 : 1;
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
      console.log("WheelList index changed:", currentIndex);
      props.onIndexChange(currentIndex);
    }
  }, [sliderState, props.onIndexChange]);

  function slideValues(idx, distance) {
    if (!sliderState) return [];
    const offset = props.loop ? 1 / 2 - 1 / slidesPerView / 2 : 0;

    const values = [];
    for (let i = 0; i < slides; i++) {
      const distance = sliderState ? (sliderState.slides[i].distance - offset) * slidesPerView : 0;
      const rotate = Math.abs(distance) > wheelSize / 2 ? 180 : distance * (360 / wheelSize) * -1;
      const style = {
        transform: `rotateX(${rotate}deg) translateZ(${radius}px)`,
        WebkitTransform: `rotateX(${rotate}deg) translateZ(${radius}px)`,
      };
      const value = props.setValue ? props.setValue(i, sliderState.abs + Math.round(distance)) : i;
      values.push({ style, value });
    }
    return values;
  }

  const wheelClass = `${styles.wheel} keen-slider ${styles[`wheel--perspective-${perspective}`]}`;

  return (
    <div className={wheelClass} ref={sliderRef}>
      <div
        className={styles.wheelShadowTop}
        style={{
          transform: `translateZ(${radius}px)`,
          WebkitTransform: `translateZ(${radius}px)`,
        }}
      />
      <div className={styles.wheelInner}>
        <div className={styles.wheelSlides} style={{ width: props.width + "px" }}>
          {slideValues().map(({ style, value }, idx) => (
            <div className={styles.wheelSlide} style={style} key={idx}>
              <span className={styles.leftText}>
                <AnimatedText text={value.left} />
              </span>

              {value.customContent && <div className={styles.customContent}>{value.customContent}</div>}
              <span className={styles.rightText}>
                <AnimatedText text={value.right} />
              </span>
            </div>
          ))}
        </div>
        {props.label && (
          <div
            className={styles.wheelLabel}
            style={{
              transform: `translateZ(${radius}px)`,
              WebkitTransform: `translateZ(${radius}px)`,
            }}
          >
            {props.label}
          </div>
        )}
      </div>
      <div
        className={styles.wheelShadowBottom}
        style={{
          transform: `translateZ(${radius}px)`,
          WebkitTransform: `translateZ(${radius}px)`,
        }}
      />
    </div>
  );
}
