import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { AnimatedText } from "../components/text/AnimatedText";
import styles from "./LoadingPagePixel.module.css";

const ANIMATION_DURATION = 2000;
const INITIAL_DELAY = 2000; // 1.5 seconds initial delay
const GRID_ROWS = 60; // Higher definition
const GRID_COLS = 40; // Higher definition

export default function LoadingPagePixel({ onProceed }) {
  const location = useLocation();
  const pixelNumber = location.pathname.split("/").pop().replace("pixel", "");
  const formattedPixelNumber = parseInt(pixelNumber).toString();
  const canvasRef = useRef(null);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Set canvas size to match viewport
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Calculate square size
    const squareWidth = Math.ceil(canvas.width / GRID_COLS);
    const squareHeight = Math.ceil(canvas.height / GRID_ROWS);

    // Create squares with disappear times
    const squares = [];
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        // Base timing mostly on row position for top-to-bottom effect
        const baseDelay = (y / GRID_ROWS) * ANIMATION_DURATION * 0.7;
        // Add some randomness for noise effect
        const randomDelay = Math.random() * ANIMATION_DURATION * 0.3;

        squares.push({
          x: x * squareWidth,
          y: y * squareHeight,
          width: squareWidth + 1, // Avoid gaps
          height: squareHeight + 1, // Avoid gaps
          disappearTime: INITIAL_DELAY + baseDelay + randomDelay,
        });
      }
    }

    // Animation variables
    let startTime = null;
    let animationFrame;

    const render = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw visible squares
      let allDisappeared = true;

      for (const square of squares) {
        if (elapsed < square.disappearTime) {
          allDisappeared = false;
          ctx.fillStyle = "black";
          ctx.fillRect(square.x, square.y, square.width, square.height);
        }
      }

      // Continue animation if not all squares have disappeared
      if (!allDisappeared) {
        animationFrame = requestAnimationFrame(render);
      } else {
        // Auto proceed after animation completes
        setTimeout(() => {
          onProceed();
        }, 3000);
      }
    };

    // Fill canvas with black initially
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Start animation
    animationFrame = requestAnimationFrame(render);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [onProceed]);

  return (
    <div className={styles.loadingOverlay}>
      <canvas ref={canvasRef} className={styles.canvas} />

      <div className={styles.scanResults}>
        <AnimatedText text="SUCCESSFULLY SCANNED" />
        <AnimatedText text={`PIXEL ${formattedPixelNumber}`} />
      </div>
    </div>
  );
}
