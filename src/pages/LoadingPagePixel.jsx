import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Button from "@widgets/Button";
import { AnimatedText } from "../components/text/AnimatedText";
import styles from "./LoadingPagePixel.module.css";

const ASCII_CHARS = " .:-=+*#%@".split("");
const ANIMATION_DURATION = 1000;
const FRAMES_PER_SECOND = 9;
const WIDTH = 60;

export default function LoadingPagePixel({ onProceed }) {
  const location = useLocation();
  const pixelNumber = location.pathname.split("/").pop().replace("pixel", "");
  const formattedPixelNumber = parseInt(pixelNumber).toString();
  const modelPoster = `/data/previews/pixels/model-poster-${formattedPixelNumber}.png`;
  const gridRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [asciiArt, setAsciiArt] = useState([]);
  const [showScanResults, setShowScanResults] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = modelPoster;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const aspectRatio = img.width / img.height;
      const height = Math.floor(WIDTH / aspectRatio);

      canvas.width = WIDTH;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, WIDTH, height);
      const imageData = ctx.getImageData(0, 0, WIDTH, height);

      const asciiLines = [];
      for (let y = 0; y < height; y++) {
        let line = "";
        for (let x = 0; x < WIDTH; x++) {
          const idx = (y * WIDTH + x) * 4;
          const brightness = (imageData.data[idx] + imageData.data[idx + 1] + imageData.data[idx + 2]) / 3;
          const charIndex = Math.floor((brightness / 255) * (ASCII_CHARS.length - 1));
          line += ASCII_CHARS[charIndex];
        }
        asciiLines.push(line);
      }
      setAsciiArt(asciiLines);
    };
  }, [modelPoster]);

  useEffect(() => {
    if (!asciiArt.length || !isAnimating) return;

    const totalFrames = (ANIMATION_DURATION / 1000) * FRAMES_PER_SECOND;
    let currentFrame = 0;
    let lastFrameTime = 0;
    const frameInterval = 1000 / FRAMES_PER_SECOND;

    const animate = (timestamp) => {
      if (!gridRef.current) return;

      if (timestamp - lastFrameTime < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(currentFrame / totalFrames, 1);

      if (progress >= 0.7 && !showScanResults) {
        setShowScanResults(true);
      }

      const currentLines = asciiArt.map((line) => {
        const chars = line.split("");
        return chars
          .map((char) => {
            if (char !== " ") {
              return progress > Math.random() ? char : ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
            }
            return " ";
          })
          .join("");
      });

      gridRef.current.textContent = currentLines.join("\n");

      if (currentFrame < totalFrames) {
        currentFrame++;
        lastFrameTime = timestamp;
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        gridRef.current.textContent = asciiArt.join("\n");
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [asciiArt, isAnimating]);

  const handleProceedClick = () => {
    setIsExiting(true);
    setTimeout(onProceed, 1000);
  };

  return (
    <div className={`${styles.loadingPage} ${isExiting ? styles.fadeOut : ""}`}>
      <pre ref={gridRef} className={styles.asciiGrid} />
      {showScanResults && (
        <div className={styles.scanResults}>
          <AnimatedText text="SUCCESSFULLY SCANNED" delay={0} />
          <AnimatedText text={`PIXEL ${formattedPixelNumber}`} delay={500} />
        </div>
      )}
      {!isAnimating && <Button onClick={handleProceedClick}>[TAP HERE TO PROCEED]</Button>}
    </div>
  );
}
