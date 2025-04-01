import styles from "./DesktopWarning.module.css";
import { useEffect, useRef, useState } from "react";

const DesktopWarning = () => {
  const gridRef = useRef(null);
  const [animConfig] = useState({
    xFrequency: -50,
    yFrequency: 20,
    speed: 0.00001,
    amplitude: 10.18,
  });

  useEffect(() => {
    if (!gridRef.current) return;

    const characters = [33, 126];
    const charStart = characters[0];
    const charMax = characters[1] - charStart;
    let frame;

    const width = 400;
    const height = 400;

    const render = (time) => {
      let content = "";
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const v =
            (Math.sin(x / animConfig.xFrequency) + Math.cos(y / animConfig.yFrequency) + time * animConfig.speed) *
            animConfig.amplitude;
          content += String.fromCharCode(charStart + (Math.floor(v) % charMax));
        }
        content += "\n";
      }

      gridRef.current.textContent = content;
      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [animConfig]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.phoneFrame}>
          <div className={styles.notch}></div>
          <div className={styles.screen}>
            <pre ref={gridRef} className={styles.asciiGrid} />
          </div>
          <div className={styles.homeButton}></div>
        </div>
        <h1>From Liquid to Stone</h1>
        <p>Please view on a mobile device.</p>
      </div>
    </div>
  );
};

export default DesktopWarning;
