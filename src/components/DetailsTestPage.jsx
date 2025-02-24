import { useState, useEffect } from "react";
import "./DetailsTestPage.css";

function AnimatedText({ text, delay = 0 }) {
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
            // Reset opacity after a brief delay
            setTimeout(() => setIsChanging(false), 10);
            currentIteration++;
          } else {
            // For the final text, maintain the changing state briefly
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
    <div className="animated-text-container">
      <span className={`animated-text-old ${isChanging ? "changing" : ""}`}>{displayText}</span>
      <span className="animated-text-new">{displayText}</span>
    </div>
  );
}

function RollingText({ text }) {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    const intervalTime = 300; // Time between each character shift

    const interval = setInterval(() => {
      setDisplayText((prevText) => {
        // Move first character to the end
        const shiftedText = prevText.slice(1) + prevText[0];
        return shiftedText;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rolling-text-container">
      <div className="rolling-text">
        <span>{displayText}</span>
      </div>
    </div>
  );
}

function MatrixText({ text }) {
  const [display, setDisplay] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [showButton, setShowButton] = useState(true);
  const glyphs = "@FPESGMORXZABCDEFGHIJKLMNOPQRSTUVWXYZ,/:";
  const width = 60;
  const height = 20;

  useEffect(() => {
    const introLines = ["PIXELFRAME IS A MATERIAL BANK", "AND PASSPORT LIBRARY", "YOU ARE ABOUT TO ENTER..."];

    const emptyLine = "\u00A0".repeat(width);
    const lines = Array(height).fill(emptyLine);

    introLines.forEach((line, index) => {
      const padding = "\u00A0".repeat(Math.floor((width - line.length) / 2));
      lines[Math.floor(height / 3) + index] = padding + line + padding;
    });

    setDisplay(lines.join("\n"));
  }, [text]);

  const startAnimation = () => {
    setIsAnimating(true);
    setShowButton(false); // Hide button immediately
    let filledPositions = new Set();
    let animationFrameId = null;
    let frameCount = 0;

    // Initialize from intro text
    const lines = display.split("\n");
    lines.forEach((line, y) => {
      [...line].forEach((char, x) => {
        if (char !== "\u00A0") {
          filledPositions.add(`${x},${y}`);
        }
      });
    });

    const getNeighborPositions = (x, y) => {
      return [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
        [x - 1, y - 1],
        [x + 1, y - 1],
        [x - 1, y + 1],
        [x + 1, y + 1],
      ].filter(([nx, ny]) => nx >= 0 && nx < width && ny >= 0 && ny < height && !filledPositions.has(`${nx},${ny}`));
    };

    const getGrowthCandidates = () => {
      const candidates = new Set();
      filledPositions.forEach((pos) => {
        const [x, y] = pos.split(",").map(Number);
        getNeighborPositions(x, y).forEach(([nx, ny]) => {
          candidates.add(`${nx},${ny}`);
        });
      });
      return Array.from(candidates);
    };

    const updateAnimation = () => {
      frameCount++;

      setDisplay((prev) => {
        const lines = prev.split("\n").map((line) => line.split(""));

        // Update existing glyphs every other frame
        if (frameCount % 2 === 0) {
          filledPositions.forEach((pos) => {
            const [x, y] = pos.split(",").map(Number);
            if (Math.random() < 0.5) {
              lines[y][x] = glyphs[Math.floor(Math.random() * glyphs.length)];
            }
          });
        }

        // Fill new positions
        const candidates = getGrowthCandidates();
        if (candidates.length > 0) {
          // Fill multiple positions per frame
          const numNewPositions = Math.min(8, candidates.length);
          for (let i = 0; i < numNewPositions; i++) {
            const randomIndex = Math.floor(Math.random() * candidates.length);
            const pos = candidates[randomIndex];
            const [x, y] = pos.split(",").map(Number);

            lines[y][x] = glyphs[Math.floor(Math.random() * glyphs.length)];
            filledPositions.add(pos);
            candidates.splice(randomIndex, 1);
          }
        } else {
          // Grid is full, continue animating for a moment before fade
          cancelAnimationFrame(animationFrameId);
          setTimeout(() => {
            const fadeOut = () => {
              setOpacity((prev) => {
                const newOpacity = prev - 0.02;
                if (newOpacity <= 0) {
                  setIsAnimating(false);
                  return 0;
                }
                requestAnimationFrame(fadeOut);
                return newOpacity;
              });
            };
            fadeOut();
          }, 500); // Short pause before fade
        }

        return lines.map((line) => line.join("")).join("\n");
      });

      animationFrameId = requestAnimationFrame(updateAnimation);
    };

    animationFrameId = requestAnimationFrame(updateAnimation);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  };

  return (
    <div className="matrix-container">
      <pre className="matrix-text" style={{ opacity }}>
        {display}
      </pre>
      {showButton && (
        <button className="enter-button" onClick={startAnimation} disabled={isAnimating}>
          [ENTER]
        </button>
      )}
    </div>
  );
}

function FlickeringSquares() {
  const [squares, setSquares] = useState([false, false, false, false, false]);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    // Initial load sequence
    const loadSequence = async () => {
      for (let i = 0; i < squares.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setSquares((prev) => prev.map((square, index) => (index <= i ? true : square)));
      }
      // Start rotation after loading
      setRotating(true);
    };

    loadSequence();
  }, []);

  return (
    <div className="flickering-squares">
      {squares.map((isOn, index) => (
        <div
          key={index}
          className={`square ${isOn ? "on" : ""} ${rotating ? "rotating" : ""}`}
          style={{
            animationDelay: rotating ? `${index * 0.2}s` : "0s",
          }}
        />
      ))}
    </div>
  );
}

function MaterialGrid() {
  const [squares, setSquares] = useState([]);
  const [isAnimating, setIsAnimating] = useState(true);
  const colors = ["#212121", "#424242", "#757575", "#BDBDBD"];
  const gridSize = { rows: 3, cols: 5 };
  const totalSquares = gridSize.rows * gridSize.cols;

  useEffect(() => {
    // Initialize empty grid
    const initialSquares = Array(totalSquares).fill({ active: false, color: "" });
    setSquares(initialSquares);

    // Start from center-ish position
    const startIndex = Math.floor(totalSquares / 2);
    let activeSquares = new Set([startIndex]);
    let currentSquares = [...initialSquares];

    const activateSquare = async (index) => {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      currentSquares[index] = { active: true, color: randomColor };
      setSquares([...currentSquares]);
    };

    const getNeighbors = (index) => {
      const row = Math.floor(index / gridSize.cols);
      const col = index % gridSize.cols;
      const neighbors = [];

      // Check all adjacent positions
      const positions = [
        [row - 1, col], // top
        [row + 1, col], // bottom
        [row, col - 1], // left
        [row, col + 1], // right
      ];

      positions.forEach(([r, c]) => {
        if (r >= 0 && r < gridSize.rows && c >= 0 && c < gridSize.cols) {
          const neighborIndex = r * gridSize.cols + c;
          if (!currentSquares[neighborIndex].active) {
            neighbors.push(neighborIndex);
          }
        }
      });

      return neighbors;
    };

    const animate = async () => {
      await activateSquare(startIndex);

      while (activeSquares.size < totalSquares) {
        const allPossibleNeighbors = new Set();
        activeSquares.forEach((square) => {
          getNeighbors(square).forEach((neighbor) => {
            allPossibleNeighbors.add(neighbor);
          });
        });

        if (allPossibleNeighbors.size === 0) break;

        const neighborsArray = Array.from(allPossibleNeighbors);
        const nextSquare = neighborsArray[Math.floor(Math.random() * neighborsArray.length)];

        await new Promise((resolve) => setTimeout(resolve, 200));
        await activateSquare(nextSquare);
        activeSquares.add(nextSquare);
      }

      setIsAnimating(false);
    };

    animate();
  }, []);

  return (
    <div className="material-grid">
      {squares.map((square, index) => (
        <div
          key={index}
          className={`material-square ${square.active ? "active" : ""}`}
          style={{ backgroundColor: square.active ? square.color : "transparent" }}
        />
      ))}
    </div>
  );
}

function AsciiGrid() {
  const [grid, setGrid] = useState([]);
  const gridSize = { width: 10, height: 10 }; // Smaller grid for better visibility
  const horizontalLine = " - - - - - ";
  const verticalLine = "|";
  const intersection = "+";

  useEffect(() => {
    // Initialize empty grid
    const emptyGrid = Array(gridSize.height * 2 - 1)
      .fill("")
      .map((_, rowIndex) => Array(gridSize.width * 2 - 1).fill(" "));
    setGrid(emptyGrid);

    let currentFrame = 0;
    const totalFrames = (gridSize.width + gridSize.height) * 2;

    const animate = () => {
      setGrid((prevGrid) => {
        const newGrid = prevGrid.map((row) => [...row]);

        // Draw horizontal lines
        for (let y = 0; y < gridSize.height * 2 - 1; y += 2) {
          for (let x = 0; x < Math.min(currentFrame * 2, gridSize.width * 2 - 1); x += 2) {
            if (x < gridSize.width * 2 - 2) {
              newGrid[y][x + 1] = "-";
            }
            newGrid[y][x] = "+";
          }
        }

        // Draw vertical lines
        for (let x = 0; x < gridSize.width * 2 - 1; x += 2) {
          for (let y = 0; y < Math.min((currentFrame - gridSize.width) * 2, gridSize.height * 2 - 1); y += 2) {
            if (y < gridSize.height * 2 - 2) {
              newGrid[y + 1][x] = "|";
            }
          }
        }

        return newGrid;
      });

      currentFrame++;

      if (currentFrame < totalFrames) {
        setTimeout(animate, 100); // Slower animation for better visibility
      }
    };

    animate();
  }, []);

  return (
    <div className="ascii-grid-container">
      <pre className="ascii-grid">{grid.map((row) => row.join("")).join("\n")}</pre>
    </div>
  );
}

function GridWithNodes() {
  const [display, setDisplay] = useState([]);
  const gridSize = { width: 30, height: 40 };

  // Node data with ASCII representations
  const elementNodes = [
    { x: 3, y: 2, element: "[PX-072]" },
    { x: 6, y: 2, element: "[PX-012]" },
    { x: 4, y: 5, element: "[PX-034]" },
    { x: 7, y: 5, element: "[PX-034]" },
    { x: 3, y: 7, element: "[PX-034]" },
    { x: 6, y: 7, element: "[PX-034]" },
  ];

  useEffect(() => {
    // Initialize empty grid
    const emptyGrid = Array(gridSize.height * 2 - 1)
      .fill("")
      .map((_, rowIndex) => Array(gridSize.width * 2 - 1).fill(" "));
    setDisplay(emptyGrid);

    let currentFrame = 0;
    const totalFrames = (gridSize.width + gridSize.height) * 2;

    const animate = () => {
      setDisplay((prevGrid) => {
        const newGrid = prevGrid.map((row) => [...row]);

        // Draw horizontal lines
        for (let y = 0; y < gridSize.height * 2 - 1; y += 2) {
          for (let x = 0; x < Math.min(currentFrame * 2, gridSize.width * 2 - 1); x += 2) {
            if (x < gridSize.width * 2 - 2) {
              newGrid[y][x + 1] = "-";
            }
            newGrid[y][x] = "+";
          }
        }

        // Draw vertical lines
        for (let x = 0; x < gridSize.width * 2 - 1; x += 2) {
          for (let y = 0; y < Math.min((currentFrame - gridSize.width) * 2, gridSize.height * 2 - 1); y += 2) {
            if (y < gridSize.height * 2 - 2) {
              newGrid[y + 1][x] = "|";
            }
          }
        }

        return newGrid;
      });

      currentFrame++;

      if (currentFrame < totalFrames) {
        setTimeout(animate, 10);
      } else {
        // Add nodes after grid is complete
        addNodes();
      }
    };

    const addNodes = () => {
      let nodeIndex = 0;

      const addNextNode = () => {
        if (nodeIndex < elementNodes.length) {
          const node = elementNodes[nodeIndex];

          setDisplay((prevGrid) => {
            const newGrid = prevGrid.map((row) => [...row]);
            const element = node.element;
            const y = node.y * 2;
            const x = node.x * 2;

            // Place the element centered on the intersection
            for (let i = 0; i < element.length; i++) {
              newGrid[y][x - Math.floor(element.length / 2) + i] = element[i];
            }

            return newGrid;
          });

          nodeIndex++;
          setTimeout(addNextNode, 200);
        }
      };

      addNextNode();
    };

    animate();
  }, []);

  return (
    <div className="ascii-grid-container">
      <pre className="ascii-grid">{display.map((row) => row.join("")).join("\n")}</pre>
    </div>
  );
}

function MinimalAsciiGrid() {
  const [grid, setGrid] = useState([]);
  const gridSize = { width: 15, height: 20 };

  useEffect(() => {
    // Initialize empty grid with doubled spacing
    const emptyGrid = Array(gridSize.height * 4 - 1) // Doubled from *2 to *4
      .fill("")
      .map((_, rowIndex) => Array(gridSize.width * 4 - 1).fill(" ")); // Doubled from *2 to *4
    setGrid(emptyGrid);

    let currentFrame = 0;
    const totalFrames = (gridSize.width + gridSize.height) * 2;

    const animate = () => {
      setGrid((prevGrid) => {
        const newGrid = prevGrid.map((row) => [...row]);

        // Place plus signs at intersections with doubled spacing
        for (let y = 0; y < Math.min(currentFrame * 4, gridSize.height * 4 - 1); y += 4) {
          // Doubled from 2 to 4
          for (let x = 0; x < Math.min(currentFrame * 4, gridSize.width * 4 - 1); x += 4) {
            // Doubled from 2 to 4
            newGrid[y][x] = "+";

            // Randomly add squares (about 10% chance)
            if (Math.random() < 0.0005 && x < gridSize.width * 4 - 4 && y < gridSize.height * 4 - 4) {
              // Draw a square using ASCII characters with doubled size
              newGrid[y][x + 2] = "-"; // top horizontal middle
              newGrid[y + 2][x] = "|"; // left vertical middle
              newGrid[y + 2][x + 4] = "|"; // right vertical middle
              newGrid[y + 4][x + 2] = "-"; // bottom horizontal middle
              newGrid[y + 2][x + 2] = "█"; // fill center

              // Additional lines to fill the doubled space
              newGrid[y][x + 1] = "-"; // top horizontal left
              newGrid[y][x + 3] = "-"; // top horizontal right
              newGrid[y + 1][x] = "|"; // left vertical top
              newGrid[y + 3][x] = "|"; // left vertical bottom
              newGrid[y + 1][x + 4] = "|"; // right vertical top
              newGrid[y + 3][x + 4] = "|"; // right vertical bottom
              newGrid[y + 4][x + 1] = "-"; // bottom horizontal left
              newGrid[y + 4][x + 3] = "-"; // bottom horizontal right

              // Fill the entire square
              newGrid[y + 1][x + 1] = "█"; // top left
              newGrid[y + 1][x + 2] = "█"; // top middle
              newGrid[y + 1][x + 3] = "█"; // top right
              newGrid[y + 2][x + 1] = "█"; // middle left
              newGrid[y + 2][x + 3] = "█"; // middle right
              newGrid[y + 3][x + 1] = "█"; // bottom left
              newGrid[y + 3][x + 2] = "█"; // bottom middle
              newGrid[y + 3][x + 3] = "█"; // bottom right
            }
          }
        }

        return newGrid;
      });

      currentFrame++;

      if (currentFrame < totalFrames) {
        setTimeout(animate, 10);
      }
    };

    animate();
  }, []);

  return (
    <div className="ascii-grid-container">
      <pre className="ascii-grid">{grid.map((row) => row.join("")).join("\n")}</pre>
    </div>
  );
}

function DetailsTestPage() {
  const [fontWeight, setFontWeight] = useState(400);
  const [monoValue, setMonoValue] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isModelExpanded, setIsModelExpanded] = useState(false);

  const slides = [
    {
      title: "3D Model",
      component: (
        <>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 2,
              color: "black",
              fontSize: "8rem",
              fontWeight: "NORMAL",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            MATERIAL INTELLIGENCE
          </div>

          <model-viewer
            src="/other.glb"
            alt="Pixel model"
            shadow-intensity="0"
            tone-mapping="neutral"
            camera-orbit="0deg 0deg 2.5m"
            exposure="1"
            environment-intensity="1"
            auto-rotate
            camera-controls
            style={{
              width: "100%",
              height: "80vh",
              maxWidth: "100%",
              position: "relative",
              zIndex: 1,
            }}
          />
        </>
      ),
    },
    {
      title: "3D Model",
      component: (
        <model-viewer
          src="/gull.glb"
          alt="Pixel model"
          shadow-intensity=".5"
          environment-image="neutral"
          camera-orbit="0deg 0deg 2.5m"
          exposure="1"
          environment-intensity="2"
          auto-rotate
          camera-controls
          style={{
            width: "100%",
            height: "80vh",
            maxWidth: "100%",
            position: "relative",
            zIndex: 1,
          }}
        />
      ),
    },
    {
      title: "",
      component: (
        <div className="title-slide">
          <div className="corner-square top-left"></div>
          <div className="corner-square top-right"></div>
          <h1>PIXELFRAME</h1>
          <div className="corner-square bottom-left"></div>
          <div className="corner-square bottom-right"></div>
        </div>
      ),
    },
    {
      title: "Font Controls",
      component: (
        <div className="font-controls">
          <div className="control-group">
            <label>
              Weight: {fontWeight}
              <input
                type="range"
                min="100"
                max="900"
                value={fontWeight}
                onChange={(e) => setFontWeight(e.target.value)}
                className="slider"
              />
            </label>
          </div>
          <div className="control-group">
            <label>
              Mono: {monoValue}
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={monoValue}
                onChange={(e) => setMonoValue(e.target.value)}
                className="slider"
              />
            </label>
          </div>
          <div
            className="preview-text"
            style={{
              fontWeight: fontWeight,
              fontVariationSettings: `"MONO" ${monoValue}`,
            }}
          >
            A mobile-first platform enabling interactive access to detailed material, model, and historical data of
            Pixelframe's "pixel inventory" , emphasizing material circularity and transparency.
          </div>
        </div>
      ),
    },
    {
      title: "ASCII Animation Test",
      component: (
        <div>
          <AnimatedText text="FROM LIQUID" delay={0} />
          <AnimatedText text="TO" delay={100} />
          <AnimatedText text="STONE" delay={200} />
          <br />
          <AnimatedText text="VENNICE BIENNALE 2025" delay={500} />
        </div>
      ),
    },
    {
      title: "Rolling Text Test",
      component: (
        <RollingText text="MATERIAL PASTS | MATERIAL FUTURES | A TABLE IS A GRID IS A MAP | THE PAST IS THE PRESENT IS THE FUTURE | " />
      ),
    },

    {
      title: "Matrix Text Test",
      component: <MatrixText text="WELCOME TO THE GRID" />,
    },
    {
      title: "Material Bank",
      component: <MaterialGrid />,
    },
    {
      title: "ASCII Grid",
      component: <AsciiGrid />,
    },
    {
      title: "Element Grid",
      component: <GridWithNodes />,
    },
    {
      title: "Minimal Grid",
      component: <MinimalAsciiGrid />,
    },
    {
      title: "Cool Concrete Colors",
      component: (
        <div className="color-system">
          <div className="color-grid">
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: "#F5F5F7" }}></div>
              <div className="color-info">
                <span className="color-name">Cool Concrete Light</span>
                <span className="color-hex">#F5F5F7</span>
              </div>
            </div>
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: "#E0E2E6" }}></div>
              <div className="color-info">
                <span className="color-name">Cool Concrete</span>
                <span className="color-hex">#E0E2E6</span>
              </div>
            </div>
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: "#BDBFC4" }}></div>
              <div className="color-info">
                <span className="color-name">Raw Cool Concrete</span>
                <span className="color-hex">#BDBFC4</span>
              </div>
            </div>
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: "#757882" }}></div>
              <div className="color-info">
                <span className="color-name">Aged Cool Concrete</span>
                <span className="color-hex">#757882</span>
              </div>
            </div>
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: "#42454C" }}></div>
              <div className="color-info">
                <span className="color-name">Charcoal Cool</span>
                <span className="color-hex">#42454C</span>
              </div>
            </div>
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: "#212428" }}></div>
              <div className="color-info">
                <span className="color-name">Carbon Cool</span>
                <span className="color-hex">#212428</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Neutral Concrete Colors",
      component: (
        <div className="color-system">
          <div className="color-grid">
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: "#F5F5F5" }}></div>
              <div className="color-info">
                <span className="color-name">Concrete Light</span>
                <span className="color-hex">#F5F5F5</span>
              </div>
            </div>
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: "#E0E0E0" }}></div>
              <div className="color-info">
                <span className="color-name">Concrete</span>
                <span className="color-hex">#E0E0E0</span>
              </div>
            </div>
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: "#BDBDBD" }}></div>
              <div className="color-info">
                <span className="color-name">Raw Concrete</span>
                <span className="color-hex">#BDBDBD</span>
              </div>
            </div>
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: "#757575" }}></div>
              <div className="color-info">
                <span className="color-name">Aged Concrete</span>
                <span className="color-hex">#757575</span>
              </div>
            </div>
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: "#424242" }}></div>
              <div className="color-info">
                <span className="color-name">Charcoal</span>
                <span className="color-hex">#424242</span>
              </div>
            </div>
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: "#212121" }}></div>
              <div className="color-info">
                <span className="color-name">Carbon</span>
                <span className="color-hex">#212121</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Warm Concrete Colors",
      component: (
        <div className="color-system">
          <div className="color-grid">
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: "#F5F4F2" }}></div>
              <div className="color-info">
                <span className="color-name">Warm Concrete Light</span>
                <span className="color-hex">#F5F4F2</span>
              </div>
            </div>
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: "#E2E0DD" }}></div>
              <div className="color-info">
                <span className="color-name">Warm Concrete</span>
                <span className="color-hex">#E2E0DD</span>
              </div>
            </div>
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: "#BFB8B2" }}></div>
              <div className="color-info">
                <span className="color-name">Raw Warm Concrete</span>
                <span className="color-hex">#BFB8B2</span>
              </div>
            </div>
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: "#827773" }}></div>
              <div className="color-info">
                <span className="color-name">Aged Warm Concrete</span>
                <span className="color-hex">#827773</span>
              </div>
            </div>
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: "#4C4542" }}></div>
              <div className="color-info">
                <span className="color-name">Charcoal Warm</span>
                <span className="color-hex">#4C4542</span>
              </div>
            </div>
            <div className="color-item">
              <div className="color-swatch" style={{ backgroundColor: "#282421" }}></div>
              <div className="color-info">
                <span className="color-name">Carbon Warm</span>
                <span className="color-hex">#282421</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Weight Variations",
      component: (
        <div className="test-content">
          <p className="weight-100">Weight 100 - The quick brown fox</p>
          <p className="weight-300">Weight 300 - The quick brown fox</p>
          <p className="weight-500">Weight 500 - The quick brown fox</p>
          <p className="weight-700">Weight 700 - The quick brown fox</p>
          <p className="weight-900">Weight 900 - The quick brown fox</p>
          <p className="size-xs">Extra Small - 12px</p>
          <p className="size-sm">Small - 14px</p>
          <p className="size-md">Medium - 16px</p>
          <p className="size-lg">Large - 24px</p>
          <p className="size-xl">Extra Large - 32px</p>
        </div>
      ),
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="details-test-page">
      <div className="test-container">
        <div className="slide-container">
          <button className="nav-button prev" onClick={prevSlide} disabled={currentSlide === 0}>
            ←
          </button>

          <div className="slide-content">
            <h2 className="slide-title">{slides[currentSlide].title}</h2>
            {slides[currentSlide].component}
          </div>

          <button className="nav-button next" onClick={nextSlide} disabled={currentSlide === slides.length - 1}>
            →
          </button>
        </div>

        <div className="slide-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`slide-indicator ${currentSlide === index ? "active" : ""}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default DetailsTestPage;
