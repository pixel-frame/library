import { useState, useEffect } from "react";
import "./AnimatedText.css";

export function AnimatedText({ text, delay = 0 }) {
  const glyphs = "@FPESGMORXZABCDEFGHIJKLMNOPQRSTUVWXYZ/:";
  
  // Initialize with random characters for each position
  const getRandomText = () => {
    return text.split('').map(() => 
      glyphs[Math.floor(Math.random() * glyphs.length)]
    ).join('');
  };
  
  const [displayText, setDisplayText] = useState(getRandomText());
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    let currentIteration = 0;
    const maxIterations = 10;
    const intervalTime = 40;

    const wordAnimation = setInterval(() => {
      if (currentIteration < maxIterations) {
        setIsChanging(true);
        setDisplayText(getRandomText());
        setTimeout(() => setIsChanging(false), 0);
        currentIteration++;
      } else {
        setIsChanging(true);
        setDisplayText(text);
        setTimeout(() => {
          setIsChanging(false);
        }, 3);
        clearInterval(wordAnimation);
      }
    }, intervalTime);

    return () => clearInterval(wordAnimation);
  }, [text, delay]);

  return (
    <div className="sanimated-text-container">
      <span className={`sanimated-text ${isChanging ? "changing" : ""}`}>{displayText}</span>
    </div>
  );
}
