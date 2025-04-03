import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import styles from "./Pixels.module.css";

const PixelCanvas2 = ({
  width = "100%",
  height = "800px",
  pixels = [],
  selectedIndex = null,
  onPixelClick = null,
  sortMode = "default",
}) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const pixelObjectsRef = useRef([]);
  const animationFrameRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Add a ref to track the current sort mode
  const currentSortModeRef = useRef("default");

  // Add transition state
  const transitionRef = useRef({
    active: false,
    startTime: 0,
    duration: 1000, // transition duration in ms
    pixelPositions: {}, // will store pixel serial -> {start, target} positions
  }).current;

  // Add a ref to track the previous sort mode
  const previousSortModeRef = useRef("default");

  // Add a ref to track the previous pixels array
  const previousPixelsRef = useRef([]);

  // Update the ref when the prop changes
  useEffect(() => {
    console.log(`Sort mode changed from ${currentSortModeRef.current} to ${sortMode}`);

    // Only trigger transition if the sort mode actually changed
    if (currentSortModeRef.current !== sortMode && isInitialized) {
      console.log("Triggering sort transition");
      previousSortModeRef.current = currentSortModeRef.current;
      currentSortModeRef.current = sortMode;

      // Calculate new positions and start transition
      startSortTransition();
    } else {
      currentSortModeRef.current = sortMode;
    }
  }, [sortMode, isInitialized]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Create camera - use PerspectiveCamera but ensure it's looking straight ahead
    const camera = new THREE.PerspectiveCamera(
      60, // field of view
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      5000 // Increased far plane to accommodate larger view
    );
    camera.position.set(0, 0, 2400); // Start with a farther view
    camera.up.set(0, 1, 0); // Ensure up vector is fixed
    camera.lookAt(0, 0, 0); // Look at center
    cameraRef.current = camera;

    // Create renderer with optimizations for mobile
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance", // Optimize for battery life
      precision: "mediump", // Use medium precision for better performance on mobile
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create controls - optimize for touch
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.panSpeed = 1.0; // Slightly faster for touch
    controls.zoomSpeed = 1.2; // Slightly faster for touch
    controls.minDistance = 50;
    controls.maxDistance = 500;
    controls.touches = {
      ONE: THREE.TOUCH.PAN,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    controls.enableDamping = true; // Add inertia for smoother touch interactions
    controls.dampingFactor = 0.1;

    // Track touch state
    const touchState = {
      isTouching: false,
      startTime: 0,
      startPosition: { x: 0, y: 0 },
      moveDistance: 0,
    };

    // Add touch event listeners
    containerRef.current.addEventListener("touchstart", (e) => {
      touchState.isTouching = true;
      touchState.startTime = Date.now();
      touchState.startPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      touchState.moveDistance = 0;
      setIsDragging(true);
    });

    containerRef.current.addEventListener("touchmove", (e) => {
      if (touchState.isTouching) {
        const dx = e.touches[0].clientX - touchState.startPosition.x;
        const dy = e.touches[0].clientY - touchState.startPosition.y;
        touchState.moveDistance = Math.sqrt(dx * dx + dy * dy);
      }
    });

    containerRef.current.addEventListener("touchend", (e) => {
      const touchDuration = Date.now() - touchState.startTime;
      const wasTap = touchDuration < 300 && touchState.moveDistance < 10;

      if (wasTap) {
        const rect = containerRef.current.getBoundingClientRect();
        const touchX = touchState.startPosition.x;
        const touchY = touchState.startPosition.y;

        // Convert touch position to normalized device coordinates (-1 to +1)
        const mouseX = ((touchX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((touchY - rect.top) / rect.height) * 2 + 1;

        // Add console.log for debugging
        console.log("Touch tap detected:", { mouseX, mouseY });
        handleTouchTap(mouseX, mouseY);
      }

      touchState.isTouching = false;
      setIsDragging(false);
    });

    // Force controls to maintain camera orientation
    const oldUpdate = controls.update;
    controls.update = function () {
      oldUpdate.call(this);
      camera.up.set(0, 1, 0); // Keep up vector constant
      camera.lookAt(camera.position.x, camera.position.y, 0); // Always look straight ahead
    };

    controlsRef.current = controls;

    // Create grid
    createGrid();

    // Animation loop with performance optimizations
    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const animate = (time) => {
      animationFrameRef.current = requestAnimationFrame(animate);

      // Throttle rendering for better performance
      const elapsed = time - lastTime;
      if (elapsed < frameInterval && !transitionRef.active) {
        return; // Skip this frame unless we're animating
      }

      lastTime = time;

      controls.update();
      renderer.render(scene, camera);
    };

    animate(0);

    setIsInitialized(true);

    // Handle resize with debounce for better performance
    let resizeTimeout;
    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      resizeTimeout = setTimeout(() => {
        if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        // Update camera aspect ratio
        const camera = cameraRef.current;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        // Update renderer
        rendererRef.current.setSize(width, height);
      }, 100); // 100ms debounce
    };

    window.addEventListener("resize", handleResize);

    // Handle device orientation changes
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);

      if (containerRef.current) {
        containerRef.current.removeEventListener("touchstart", () => {});
        containerRef.current.removeEventListener("touchmove", () => {});
        containerRef.current.removeEventListener("touchend", () => {});
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      // Dispose of all Three.js objects
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }
    };
  }, []);

  // Create grid
  const createGrid = () => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;

    // Create grid material
    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0xb4b4b4,
      transparent: true,
      opacity: 1, // Increased opacity for better visibility
    });

    // Grid dimensions - significantly increased
    const gridSize = 2000; // Increased from 400 to 2000
    const cellSize = 10; // Increased from 20 to 40
    const verticalCellSize = cellSize * (3 / 2); // 2:3 ratio

    // Create grid lines
    const gridGroup = new THREE.Group();

    // Vertical lines
    for (let x = -gridSize / 2; x <= gridSize / 2; x += cellSize) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, -gridSize / 2, 0),
        new THREE.Vector3(x, gridSize / 2, 0),
      ]);
      const line = new THREE.Line(geometry, gridMaterial);
      gridGroup.add(line);
    }

    // Horizontal lines
    for (let y = -gridSize / 2; y <= gridSize / 2; y += verticalCellSize) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-gridSize / 2, y, 0),
        new THREE.Vector3(gridSize / 2, y, 0),
      ]);
      const line = new THREE.Line(geometry, gridMaterial);
      gridGroup.add(line);
    }

    // Create grid background
    const backgroundGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const backgroundMaterial = new THREE.MeshBasicMaterial({
      color: 0x323232,
      transparent: true,
      opacity: 0.1, // Slightly increased opacity
      side: THREE.DoubleSide,
    });
    const backgroundPlane = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    backgroundPlane.position.z = -5; // Move slightly back

    // Create grid border
    const borderGeometry = new THREE.EdgesGeometry(backgroundGeometry);
    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0xc8c8c8,
      linewidth: 5, // Increased from 3 to 5
      opacity: 0.9, // Increased opacity
    });
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);

    // Add to scene
    gridGroup.add(backgroundPlane);
    gridGroup.add(border);
    scene.add(gridGroup);
  };

  // Modify handleTouchTap to include debugging
  const handleTouchTap = (mouseX, mouseY) => {
    console.log("handleTouchTap called:", { mouseX, mouseY });

    if (isDragging || !isInitialized || !onPixelClick) {
      console.log("Early return conditions:", { isDragging, isInitialized, hasOnPixelClick: !!onPixelClick });
      return;
    }

    // Set up raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(mouseX, mouseY);
    raycaster.setFromCamera(mouse, cameraRef.current);

    // Find intersections with pixel objects
    const intersects = raycaster.intersectObjects(pixelObjectsRef.current, true); // Added 'true' for recursive check
    console.log("Intersections found:", intersects.length);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      // Traverse up to find the parent object with pixel data if needed
      let targetObject = clickedObject;
      while (targetObject && !targetObject.userData?.pixel) {
        targetObject = targetObject.parent;
      }

      if (targetObject && targetObject.userData?.pixel) {
        const clickedPixel = targetObject.userData.pixel;
        console.log("Clicked pixel:", clickedPixel);

        // Find index of this pixel in the original pixels array
        const index = pixels.findIndex((p) => p.serial === clickedPixel.serial);
        console.log("Found index:", index);

        if (index !== -1) {
          console.log("Calling onPixelClick with index:", index);
          onPixelClick(index);
        }
      }
    }
  };

  // Function to start transition between sort modes
  const startSortTransition = () => {
    if (!pixelObjectsRef.current.length) return;

    console.log(`Starting transition from ${previousSortModeRef.current} to ${currentSortModeRef.current}`);

    // Calculate target positions for all pixels based on new sort mode
    const targetPositions = calculatePixelPositions(pixels.slice(0, Math.min(pixels.length, 140)));

    // Store current positions as starting points
    transitionRef.pixelPositions = {};

    let positionCount = 0;
    pixelObjectsRef.current.forEach((pixelObj) => {
      const serial = pixelObj.userData.pixel.serial;

      // Find index of this pixel in the original pixels array
      const index = pixels.findIndex((p) => p.serial === serial);

      if (index !== -1 && targetPositions[index]) {
        transitionRef.pixelPositions[serial] = {
          start: pixelObj.position.clone(),
          target: new THREE.Vector3(
            targetPositions[index].x,
            targetPositions[index].y - 30, // Apply the same offset as in createPixelObject
            targetPositions[index].z
          ),
        };
        positionCount++;
      }
    });

    console.log(`Set up transition for ${positionCount} pixels`);

    // Start transition animation
    transitionRef.active = true;
    transitionRef.startTime = performance.now();
  };

  // Calculate pixel positions based on current sort mode
  const calculatePixelPositions = (pixelsToShow) => {
    let pixelPositions = [];

    if (currentSortModeRef.current === "assembly") {
      // Sort by assembly (number_of_reconfigurations)
      // Group pixels by their reconfiguration count
      const groupedPixels = {};
      pixelsToShow.forEach((pixel, index) => {
        const reconfCount = pixel.number_of_reconfigurations || 0;
        if (!groupedPixels[reconfCount]) {
          groupedPixels[reconfCount] = [];
        }
        groupedPixels[reconfCount].push({ pixel, index });
      });

      // Arrange pixels in a spiral pattern based on reconfiguration count
      const counts = Object.keys(groupedPixels).sort((a, b) => b - a);

      let currentRadius = 50;
      let currentAngle = 0;
      let pixelIndex = 0;

      counts.forEach((count) => {
        const pixelsInGroup = groupedPixels[count];
        const angleIncrement = (2 * Math.PI) / pixelsInGroup.length;

        pixelsInGroup.forEach(({ pixel, index }) => {
          const x = Math.cos(currentAngle) * currentRadius;
          const y = Math.sin(currentAngle) * currentRadius;

          pixelPositions[index] = { x, y, z: 0 }; // Set z to 0 for all pixels
          currentAngle += angleIncrement;
          pixelIndex++;
        });

        currentRadius += 100;
      });
    } else {
      // Default grid layout
      const gridSize = 500;
      const gridDivisions = Math.ceil(Math.sqrt(pixelsToShow.length));
      const cellWidth = gridSize / gridDivisions;
      const cellHeight = cellWidth;

      pixelsToShow.forEach((pixel, i) => {
        // Calculate grid position (now only in 2D)
        const gridX = i % gridDivisions;
        const gridY = Math.floor(i / gridDivisions);

        // Calculate base position with spacing
        const baseX = (gridX - gridDivisions / 2) * cellWidth + cellWidth / 2;
        const baseY = (gridY - gridDivisions / 2) * cellHeight + cellHeight / 2;

        // Add some randomness within the cell, but keep it contained
        const randomX = baseX + (Math.random() - 0.5) * cellWidth * 0.5;
        const randomY = baseY + (Math.random() - 0.5) * cellHeight * 0.5;

        pixelPositions[i] = { x: randomX, y: randomY, z: 0 }; // Set z to 0 for all pixels
      });
    }

    return pixelPositions;
  };

  // Load pixel images with optimizations for mobile
  useEffect(() => {
    if (!isInitialized || !pixels.length) return;

    // Check if pixels have actually changed
    const pixelsChanged =
      pixels.length !== previousPixelsRef.current.length ||
      pixels.some((pixel, index) => pixel.serial !== previousPixelsRef.current[index]?.serial);

    // Only reload pixels if they've actually changed
    if (!pixelsChanged) return;

    // Update the previous pixels ref
    previousPixelsRef.current = [...pixels];

    const scene = sceneRef.current;

    // Clear existing pixel objects
    pixelObjectsRef.current.forEach((obj) => {
      scene.remove(obj);
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
      if (obj.geometry) obj.geometry.dispose();
    });
    pixelObjectsRef.current = [];

    // Texture loader with loading manager for better control
    const loadingManager = new THREE.LoadingManager();
    const textureLoader = new THREE.TextureLoader(loadingManager);

    // Limit concurrent texture loads for better performance
    loadingManager.onStart = function () {
      // Could add loading indicator here
    };

    loadingManager.onLoad = function () {
      // Set initial camera position to show all pixels
      if (cameraRef.current && selectedIndex === null) {
        const optimalDistance = calculateOptimalCameraDistance();
        cameraRef.current.position.z = optimalDistance;
        cameraRef.current.updateProjectionMatrix();
      }
    };

    loadingManager.onProgress = function (url, loaded, total) {
      // Track loading progress
    };

    // Ensure we're only showing the actual number of pixels
    const pixelsToShow = pixels.slice(0, Math.min(pixels.length, 140));
    console.log(pixels.length);

    // Determine pixel positions based on sort mode
    const pixelPositions = calculatePixelPositions(pixelsToShow);

    // Shuffle pixels to randomize load order
    const shuffledPixels = [...pixelsToShow].sort(() => Math.random() - 0.5);

    // Batch loading for better performance
    const batchSize = 10; // Load 10 textures at a time
    let currentBatch = 0;

    const loadNextBatch = () => {
      const startIdx = currentBatch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, shuffledPixels.length);

      if (startIdx >= shuffledPixels.length) {
        return; // All batches loaded
      }

      // Load current batch
      for (let i = startIdx; i < endIdx; i++) {
        const pixel = shuffledPixels[i];
        const pixelNumber = pixel.number || pixel.serial;
        const url = `data/previews/pixels/model-poster-${pixelNumber}.png`;

        // Get the original index of this pixel in the pixelsToShow array
        const originalIndex = pixelsToShow.findIndex((p) => p.serial === pixel.serial);

        // Get position from our calculated positions array
        const position = pixelPositions[originalIndex];

        // First loaded: 60px, Last loaded: 80px
        const minSize = 40;
        const maxSize = 40;
        const loadOrderRatio = i / pixelsToShow.length;
        const baseSize = minSize + (maxSize - minSize) * loadOrderRatio;

        // Load texture
        textureLoader.load(
          url,
          // onLoad
          (texture) => {
            // Apply texture compression for mobile
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter; // Add magFilter for better quality
            texture.generateMipmaps = false; // Disable mipmaps for performance
            createPixelObject(texture, position.x, position.y, position.z, baseSize, pixel, i);
          },
          // onProgress
          undefined,
          // onError
          () => {
            // Fallback image
            const fallbackImages = [45, 46, 50];
            const randomFallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
            const fallbackUrl = `data/previews/pixels/model-poster-${randomFallback}.png`;

            textureLoader.load(fallbackUrl, (texture) => {
              texture.minFilter = THREE.LinearFilter;
              texture.magFilter = THREE.LinearFilter;
              texture.generateMipmaps = false;
              createPixelObject(texture, position.x, position.y, position.z, baseSize, pixel, i);
            });
          }
        );
      }

      // Schedule next batch
      currentBatch++;
      setTimeout(loadNextBatch, 100); // 100ms delay between batches
    };

    // Start loading the first batch
    loadNextBatch();
  }, [isInitialized, pixels]);

  // Create pixel object with optimizations for mobile
  const createPixelObject = (texture, x, y, z, baseSize, pixel, loadOrder) => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;

    // Calculate proportional dimensions
    const aspectRatio = texture.image.width / texture.image.height;
    let width, height;

    if (aspectRatio >= 1) {
      width = baseSize;
      height = baseSize / aspectRatio;
    } else {
      height = baseSize;
      width = baseSize * aspectRatio;
    }

    // Create plane for image - use lower segment count for better performance
    const geometry = new THREE.PlaneGeometry(width, height, 1, 1);

    // Create material with texture and enhanced contrast
    const isUnavailable = pixel.state === 4;

    // Create a custom shader material for better contrast
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: isUnavailable ? 0.3 : 1.0,
      side: THREE.FrontSide, // Only render front side for performance
      depthWrite: true, // Enable depth writing for proper rendering
    });

    // Enhance texture quality
    texture.anisotropy = 8; // Increased from 4 to 8 for sharper images
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    // Apply color correction to the texture to enhance contrast
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = texture.image.width;
    canvas.height = texture.image.height;

    // Draw the original image
    ctx.drawImage(texture.image, 0, 0);

    // Apply contrast enhancement
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Contrast factor (1.0 = no change, 2.0 = double contrast)
    const contrastFactor = 1.3;
    const brightnessFactor = 10; // Slight brightness boost

    for (let i = 0; i < data.length; i += 4) {
      // Skip fully transparent pixels
      if (data[i + 3] === 0) continue;

      // Apply contrast to RGB channels
      for (let j = 0; j < 3; j++) {
        let color = data[i + j];
        // Apply brightness adjustment
        color += brightnessFactor;
        // Apply contrast adjustment
        color = ((color / 255 - 0.5) * contrastFactor + 0.5) * 255;
        // Clamp to valid range
        data[i + j] = Math.max(0, Math.min(255, color));
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Create a new texture from the enhanced canvas
    const enhancedTexture = new THREE.Texture(canvas);
    enhancedTexture.needsUpdate = true;
    enhancedTexture.anisotropy = 8;
    enhancedTexture.minFilter = THREE.LinearFilter;
    enhancedTexture.magFilter = THREE.LinearFilter;

    // Use the enhanced texture
    material.map = enhancedTexture;

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y - 30, z);
    mesh.rotation.set(0, 0, 0);

    // Use frustum culling for better performance
    mesh.frustumCulled = true;

    // Create serial number text below the pixel
    const serialText = createSerialText(pixel.serial, width, height);
    serialText.position.set(0, -height / 2 - 10, 0); // Position below the pixel
    mesh.add(serialText);

    // Create outline for selection (initially invisible)
    const outlineGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(width + 2, height + 2, 2));
    const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
    const outline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
    outline.position.set(0, 0, 0);
    outline.visible = false;
    mesh.add(outline);

    mesh.userData = {
      pixel,
      width,
      height,
      loadOrder,
      isSelected: false,
      originalPosition: new THREE.Vector3(x, y - 30, z),
      originalRotation: new THREE.Euler().copy(mesh.rotation),
      outline, // Store reference to outline
    };

    // Add to scene and tracking array
    scene.add(mesh);
    pixelObjectsRef.current.push(mesh);
  };

  // Create serial text for a pixel
  const createSerialText = (serial, width, height) => {
    // Format serial number with leading zeros
    const formattedSerial = String(serial).padStart(4, "0");

    // Create canvas for text with higher resolution
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 256; // Increased from 128 for higher resolution
    canvas.height = 64; // Increased from 32 and made more proportional

    // Set text properties
    context.fillStyle = "rgba(0, 0, 0, 0)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = "bold 28px Arial, sans-serif"; // Improved font
    context.fillStyle = "black";
    context.textAlign = "center";
    context.textBaseline = "middle";

    // Apply anti-aliasing for smoother text
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    // Draw text
    context.fillText(formattedSerial, canvas.width / 2, canvas.height / 2);

    // Create texture from canvas with proper filtering
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false; // Disable mipmaps for text

    // Create material and plane with proper aspect ratio
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: true,
    });

    // Calculate proper aspect ratio for the text plane
    const textAspect = canvas.width / canvas.height;
    const textWidth = Math.min(width, 40); // Limit width to avoid overly wide text
    const textHeight = textWidth / textAspect;

    const plane = new THREE.Mesh(new THREE.PlaneGeometry(textWidth, textHeight), material);

    return plane;
  };

  // Add a function to calculate the optimal camera distance to see all pixels
  const calculateOptimalCameraDistance = () => {
    if (!pixelObjectsRef.current.length) return 800; // Default distance

    // Find the furthest pixel from center
    let maxDistance = 0;
    pixelObjectsRef.current.forEach((pixel) => {
      const distance = Math.sqrt(pixel.position.x * pixel.position.x + pixel.position.y * pixel.position.y);
      maxDistance = Math.max(maxDistance, distance);
    });

    // Add padding and calculate optimal distance based on field of view
    const padding = 1.2; // 20% padding
    const fov = cameraRef.current.fov * (Math.PI / 180); // Convert to radians
    const optimalDistance = (maxDistance * padding) / Math.tan(fov / 2);

    return Math.max(optimalDistance, 800); // Ensure minimum distance
  };

  return <div ref={containerRef} className={styles.canvasContainer} style={{ width, height }} />;
};

export default PixelCanvas2;
