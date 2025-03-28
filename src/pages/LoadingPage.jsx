import { useEffect, useRef, useState } from "react";
import "./LoadingPage.css";
import Button from "@widgets/Button";

export default function LoadingPage({ onProceed }) {
  const gridRef = useRef(null);
  const [animConfig, setAnimConfig] = useState({
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

    const width = 200;
    const height = 200;

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

  const handleConfigChange = (key, value) => {
    setAnimConfig((prev) => ({
      ...prev,
      [key]: Number(value),
    }));
  };

  return (
    <div className="loading-page">
      <h1>From Liquid to Stone</h1>
      <h2>A Reconfigurable Concrete Tectonic Against Obsolescence</h2>
      <p className="center-text">
        Pixelframe is a modular precast concrete constructive system that is designed for reuse, alongside up front
        material savings. Enabling builders and developers to construct long-span, multi-story buildings within a
        circular economy of building materials, Pixelframe structures are fully-dry jointed and contain no internal
        steel reinforcement, which means the concrete modules are 100% reusable.
      </p>
      <Button onClick={onProceed}>[TAP HERE TO PROCEED]</Button>
      <pre ref={gridRef} className="ascii-grid" />

      <div className="controls">
        <div className="control-group">
          <label htmlFor="xFrequency">X Frequency: {animConfig.xFrequency}</label>
          <input
            type="range"
            id="xFrequency"
            min="-300"
            max="-50"
            value={animConfig.xFrequency}
            onChange={(e) => handleConfigChange("xFrequency", e.target.value)}
          />
        </div>

        <div className="control-group">
          <label htmlFor="yFrequency">Y Frequency: {animConfig.yFrequency}</label>
          <input
            type="range"
            id="yFrequency"
            min="1"
            max="50"
            value={animConfig.yFrequency}
            onChange={(e) => handleConfigChange("yFrequency", e.target.value)}
          />
        </div>

        <div className="control-group">
          <label htmlFor="speed">Speed: {animConfig.speed}</label>
          <input
            type="range"
            id="speed"
            min="0.00001"
            max="0.001"
            step="0.00001"
            value={animConfig.speed}
            onChange={(e) => handleConfigChange("speed", e.target.value)}
          />
        </div>

        <div className="control-group">
          <label htmlFor="amplitude">Amplitude: {animConfig.amplitude}</label>
          <input
            type="range"
            id="amplitude"
            min="1"
            max="20"
            step="0.1"
            value={animConfig.amplitude}
            onChange={(e) => handleConfigChange("amplitude", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
