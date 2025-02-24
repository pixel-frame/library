import { useState, useEffect } from "react";
import "./AnimatedText.css";

export function AnimatedText({ text, delay = 0 }) {
  const glyphs = "@FPESGMORXZABCDEFGHIJKLMNOPQRSTUVWXYZ,/:";
  const initialGlyph = glyphs[Math.floor(Math.random() * glyphs.length)];
  const [displayText, setDisplayText] = useState(text.replace(/./g, initialGlyph));
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    let currentIteration = 0;
    const maxIterations = 30;
    const intervalTime = 35;

    const startAnimation = () => {
      setTimeout(() => {
        const wordAnimation = setInterval(() => {
          if (currentIteration < maxIterations) {
            setIsChanging(true);
            const frameGlyph = glyphs[Math.floor(Math.random() * glyphs.length)];
            setDisplayText(text.replace(/./g, frameGlyph));
            setTimeout(() => setIsChanging(false), 10);
            currentIteration++;
          } else {
            setIsChanging(true);
            setDisplayText(text);
            setTimeout(() => {
              setIsChanging(false);
            }, 10);
            clearInterval(wordAnimation);
          }
        }, intervalTime);
      }, delay);
    };

    startAnimation();
  }, [text, delay]);

  return (
    <div className="sanimated-text-container">
      <span className={`sanimated-text ${isChanging ? "changing" : ""}`}>{displayText}</span>
    </div>
  );
}
