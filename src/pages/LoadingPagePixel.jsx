import { useEffect, useRef, useState } from "react";
import modelPoster from "/public/data/previews/pixels/model-poster-3.png";
import Button from "@widgets/Button";
import { AnimatedText } from "../components/text/AnimatedText";
import styles from "./LoadingPagePixel.module.css";

const ASCII_CHARS = " .:-=+*#%@".split("");
const ANIMATION_DURATION = 1000; // Duration in milliseconds
const FRAMES_PER_SECOND = 30;

export default function LoadingPagePixel({ onProceed }) {
  const gridRef = useRef(null);
  const [asciiArt, setAsciiArt] = useState([]);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showScanResults, setShowScanResults] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = modelPoster;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const aspectRatio = img.width / img.height;
      const width = 100;
      const height = Math.floor(width / aspectRatio);

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);

      const asciiLines = [];
      for (let y = 0; y < height; y++) {
        let line = "";
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = imageData.data[idx];
          const g = imageData.data[idx + 1];
          const b = imageData.data[idx + 2];
          const brightness = (r + g + b) / 3;
          const charIndex = Math.floor((brightness / 255) * (ASCII_CHARS.length - 1));
          line += ASCII_CHARS[charIndex];
        }
        asciiLines.push(line);
      }
      setAsciiArt(asciiLines);
    };
  }, []);

  useEffect(() => {
    if (!asciiArt.length || !isAnimating) return;

    const totalFrames = (ANIMATION_DURATION / 1000) * FRAMES_PER_SECOND;
    const frameInterval = ANIMATION_DURATION / totalFrames;
    let currentFrame = 0;

    const animate = () => {
      if (!gridRef.current) return;

      const progress = currentFrame / totalFrames;
      setAnimationProgress(progress);

      // Start showing scan results at 50% progress
      if (progress >= 0.7 && !showScanResults) {
        setShowScanResults(true);
      }

      const randomChars = asciiArt.map((line, y) =>
        line
          .split("")
          .map((char, x) => {
            // Add more noise to borders
            if (y === 0 || y === asciiArt.length - 1 || x === 0 || x === line.length - 1) {
              return Math.random() > 0.1 ? ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)] : " ";
            }

            const targetCharIndex = ASCII_CHARS.indexOf(char);
            const currentProgress = progress * (1 + Math.random() * 0.3); // Add some randomness to progress

            // As progress increases, narrow down the possible characters
            const range = Math.ceil(ASCII_CHARS.length * (1 - currentProgress));
            const minIndex = Math.max(0, targetCharIndex - range);
            const maxIndex = Math.min(ASCII_CHARS.length - 1, targetCharIndex + range);

            // Chance to show random character decreases with progress
            if (Math.random() > currentProgress * 0.8) {
              return ASCII_CHARS[minIndex + Math.floor(Math.random() * (maxIndex - minIndex + 1))];
            }

            // Gradually increase chance of showing correct character
            return Math.random() > 0.3 ? char : ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
          })
          .join("")
      );

      gridRef.current.textContent = randomChars.join("\n");

      if (currentFrame < totalFrames) {
        currentFrame++;
        setTimeout(() => requestAnimationFrame(animate), frameInterval);
      } else {
        setIsAnimating(false);
        gridRef.current.textContent = asciiArt.join("\n");
      }
    };

    requestAnimationFrame(animate);
  }, [asciiArt, isAnimating]);

  return (
    <div className={styles.loadingPage}>
      <pre ref={gridRef} className={styles.asciiGrid} />
      {showScanResults && (
        <div className={styles.scanResults}>
          <AnimatedText text="SUCCESSFULLY SCANNED" delay={0} />
          <AnimatedText text="PIXEL 0072" delay={500} />
        </div>
      )}
      <Button onClick={onProceed}>[TAP HERE TO PROCEED]</Button>
    </div>
  );
}
