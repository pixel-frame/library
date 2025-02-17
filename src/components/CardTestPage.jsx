import { useState, useEffect } from "react";
import { AnimatedText } from "./AnimatedText";
import { RollingText } from "./RollingText";
import "./CardTestPage.css";

function generateASCIIArt(seed) {
  // Simple ASCII art generator - you can make this more complex
  const patterns = [
    `
    ┌────┐
    │    │
    └────┘
    `,
    `
     /\\
    /  \\
    ────
    `,
    `
    ┌┐ ┌┐
    └┘ └┘
    ────
    `,
    `
     ▲
    ▲ ▲
    ───
    `,
    `
    ╔══╗
    ║  ║
    ╚══╝
    `,
  ];

  return patterns[seed % patterns.length];
}

function CardTestPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const listings = [
    { name: "BEAM ASSEMBLY", year: "2022", location: "Cambridge, MA" },
    { name: "COLUMN ASSEMBLY", year: "2022", location: "Cambridge, MA" },
    { name: "SHEAR TEST", year: "2022", location: "Cambridge, MA" },
    { name: "BEAM ASSEMBLY", year: "2023", location: "Washington DC" },
    { name: "SHOWCASE COLUMN", year: "2023", location: "Washington DC" },
    { name: "SHOWCASE COLUMN", year: "2023", location: "Washington DC" },
    { name: "EXHIBITION BEAM", year: "2024", location: "Cambridge, MA" },
    { name: "EXHIBITION COLUMN", year: "2025", location: "Cambridge, MA" },
    { name: "BIENNALE BEAM", year: "2025", location: "Venice, IT" },
    { name: "BIENNALE COLUMN", year: "2025", location: "Venice, IT" },
    { name: "WAREHOUSE", year: "2034", location: "Edmonton, AB" },
    { name: "PAVILION", year: "2035", location: "Chicago, IL" },
    { name: "TOWER", year: "2035", location: "Vancouver, BC" },
  ];

  useEffect(() => {
    let lastWheelTime = Date.now();
    const wheelThreshold = 100;

    const handleWheel = (event) => {
      const now = Date.now();
      if (now - lastWheelTime < wheelThreshold) {
        return;
      }

      const delta = Math.sign(event.deltaY);

      setSelectedIndex((prevIndex) => {
        if (delta > 0) {
          return Math.min(prevIndex + 1, listings.length - 1);
        } else {
          return Math.max(prevIndex - 1, 0);
        }
      });

      lastWheelTime = now;
    };

    const listElement = document.querySelector(".scrollable-list");
    listElement?.addEventListener("wheel", handleWheel);

    return () => {
      listElement?.removeEventListener("wheel", handleWheel);
    };
  }, [listings.length]);

  return (
    <div className="card-test-page">
      <div className="rolling-header">
        <RollingText text="MATERIAL PASTS | MATERIAL FUTURES | A TABLE IS A GRID IS A MAP | " />
      </div>

      <div className="main-content">
        <div className="top-section">
          <div className="content">
            <h2>LISTING</h2>
            <div className="ascii-container">
              {listings[selectedIndex].name}
              <pre>{generateASCIIArt(selectedIndex)}</pre>
              <div className="selected-info">
                {listings[selectedIndex].year} - {listings[selectedIndex].location}
              </div>
            </div>
          </div>
        </div>

        <div className="scrollable-list">
          {listings.map((item, index) => (
            <div key={index} className={`list-item ${selectedIndex === index ? "selected" : ""}`}>
              <AnimatedText text={item.name} delay={0} className="item-name" />
              <AnimatedText text={item.year} delay={0} className="item-year" />
              <AnimatedText text={item.location} delay={0} className="item-location" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CardTestPage;
