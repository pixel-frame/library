import { useEffect, useRef } from "react";
import "./LoadingPage.css";
import Button from "@widgets/Button";

export default function LoadingPage({ onProceed }) {
  const gridRef = useRef(null);

  useEffect(() => {
    if (!gridRef.current) return;

    const characters = [33, 126];
    const charStart = characters[0];
    const charMax = characters[1] - charStart;
    let frame;

    // Animation configuration
    const animConfig = {
      xFrequency: 20, // Controls horizontal wave frequency
      yFrequency: 10, // Controls vertical wave frequency
      speed: 0.0007, // Controls animation speed
      amplitude: 1.18, // Controls the intensity of the effect
    };

    // Fixed dimensions for the grid to prevent excessive rendering
    const width = 70; // 800px / 5px font-size
    const height = 50; // 600px / 5px font-size

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
  }, []);

  return (
    <div className="loading-page">
      <h1>From Liquid to Stone</h1>
      <h2>A Reconfigurable Concrete Tectonic Against Obsolescence</h2>
      <pre ref={gridRef} className="ascii-grid" />
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua.
      </p>
      <Button onClick={onProceed}>[TAP HERE TO PROCEED]</Button>
    </div>
  );
}
