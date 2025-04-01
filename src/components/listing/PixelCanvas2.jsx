import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import styles from "./Pixels.module.css";

const PixelCanvas2 = ({
  width = "100%",
  height = "300px",
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

  // Animation state
  const animationRef = useRef(null);
  const animateToCenterPixel = useRef({
    active: false,
    startPosition: new THREE.Vector3(),
    targetPosition: new THREE.Vector3(),
    startZoom: 1,
    targetZoom: 1,
    startTime: 0,
    duration: 3000, // animation duration in ms
  }).current;

  const modelRef = useRef(null);
  const gltfLoaderRef = useRef(null);

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

  // Add jitter state
  const [showJitter, setShowJitter] = useState(true);

  // Add the missing ref right after the other refs
  const currentSortModeRef = useRef("default");

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

  // Modify calculatePixelPositions to create random 3D starting positions
  const calculatePixelPositions = (pixelsToShow) => {
    let pixelPositions = [];

    // Create a sphere of positions
    const radius = 1000; // Sphere radius

    pixelsToShow.forEach((pixel, i) => {
      // Generate random spherical coordinates
      const theta = Math.random() * Math.PI * 2; // Random angle around y-axis
      const phi = Math.acos(Math.random() * 2 - 1); // Random angle from y-axis
      const r = radius * (0.2 + Math.random() * 0.8); // Random radius between 20% and 100% of max

      // Convert to Cartesian coordinates
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      pixelPositions[i] = { x, y, z };
    });

    return pixelPositions;
  };

  // Modify animate function to orbit from random starting points
  const animate = () => {
    animationFrameRef.current = requestAnimationFrame(animate);

    // Add orbital movement to all pixel objects
    pixelObjectsRef.current.forEach((pixelObj, index) => {
      if (pixelObj.userData.originalPosition) {
        // Create different orbital speeds based on distance from center
        const originalPos = pixelObj.userData.originalPosition;
        const distanceFromCenter = Math.sqrt(
          originalPos.x * originalPos.x + originalPos.y * originalPos.y + originalPos.z * originalPos.z
        );

        // Slower movement for objects further from center
        const baseSpeed = 0.0002;
        const orbitSpeed = baseSpeed * (1 - distanceFromCenter / 2000);

        // Create multiple rotation axes for more varied movement
        const time = performance.now() * orbitSpeed;
        const time2 = performance.now() * (orbitSpeed * 0.7); // Secondary rotation

        // Calculate new position using original position as center of orbit
        const orbitRadius = 100; // Size of the orbital path
        const x = originalPos.x + orbitRadius * Math.cos(time) * Math.sin(time2);
        const y = originalPos.y + orbitRadius * Math.sin(time) * Math.sin(time2);
        const z = originalPos.z + orbitRadius * Math.cos(time2);

        // Update position
        pixelObj.position.set(x, y, z);

        // Make pixels always face the camera
        pixelObj.lookAt(cameraRef.current.position);
      }
    });

    if (controlsRef.current) {
      controlsRef.current.update();
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      10000
    );
    camera.position.set(0, 0, 5000);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      precision: "mediump",
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.panSpeed = 1.0;
    controls.zoomSpeed = 1.2;
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
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controlsRef.current = controls;

    // Create grid
    createGrid();

    // Start animation
    animate();

    setIsInitialized(true);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
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
      if (modelRef.current) {
        disposeModel(modelRef.current);
        modelRef.current = null;
      }
    };
  }, []);

  // Create grid
  const createGrid = () => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;

    // Create grid material
    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
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

  // Add mouse click event listener

  // Update handleTouchTap to use the same simple approach

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

  // Load pixel images with optimizations for mobile
  useEffect(() => {
    if (!isInitialized || !pixels.length) return;

    const pixelsChanged =
      pixels.length !== previousPixelsRef.current.length ||
      pixels.some((pixel, index) => pixel.serial !== previousPixelsRef.current[index]?.serial);

    if (!pixelsChanged) return;

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

    const loadingManager = new THREE.LoadingManager();
    const textureLoader = new THREE.TextureLoader(loadingManager);

    const pixelsToShow = pixels.slice(0, Math.min(pixels.length, 140));
    const pixelPositions = calculatePixelPositions(pixelsToShow);
    const shuffledPixels = [...pixelsToShow].sort(() => Math.random() - 0.5);

    const batchSize = 10;
    let currentBatch = 0;

    const loadNextBatch = () => {
      const startIdx = currentBatch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, shuffledPixels.length);

      if (startIdx >= shuffledPixels.length) {
        return;
      }

      for (let i = startIdx; i < endIdx; i++) {
        const pixel = shuffledPixels[i];
        const pixelNumber = pixel.number || pixel.serial;
        // Keep the model-poster URL path
        const url = `data/previews/pixels/model-poster-${pixelNumber}.png`;

        const originalIndex = pixelsToShow.findIndex((p) => p.serial === pixel.serial);
        const position = pixelPositions[originalIndex];

        const minSize = 40;
        const maxSize = 40;
        const loadOrderRatio = i / pixelsToShow.length;
        const baseSize = minSize + (maxSize - minSize) * loadOrderRatio;

        textureLoader.load(
          url,
          (texture) => {
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;
            createPixelObject(texture, position.x, position.y, position.z, baseSize, pixel, i);
          },
          undefined,
          () => {
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

      currentBatch++;
      setTimeout(loadNextBatch, 100);
    };

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
    const outlineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
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
    context.fillStyle = "white";
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

  // Animation function for centering on a pixel
  const animateToPixel = () => {
    if (!animateToCenterPixel.active) {
      animationRef.current = null;
      return;
    }

    const elapsed = performance.now() - animateToCenterPixel.startTime;
    const progress = Math.min(elapsed / animateToCenterPixel.duration, 1);

    // Apply easing function (easeInOutCubic)
    const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    // Update camera position
    if (cameraRef.current && controlsRef.current) {
      // Interpolate position
      const newX =
        animateToCenterPixel.startPosition.x +
        (animateToCenterPixel.targetPosition.x - animateToCenterPixel.startPosition.x) * eased;
      const newY =
        animateToCenterPixel.startPosition.y +
        (animateToCenterPixel.targetPosition.y - animateToCenterPixel.startPosition.y) * eased;
      const newZ =
        animateToCenterPixel.startPosition.z +
        (animateToCenterPixel.targetPosition.z - animateToCenterPixel.startPosition.z) * eased;

      // Update camera position directly without changing orientation
      cameraRef.current.position.set(newX, newY, newZ);

      // Important: Keep camera looking straight ahead
      // This prevents any rotation by keeping the camera's up vector constant
      cameraRef.current.up.set(0, 1, 0);
      cameraRef.current.lookAt(newX, newY, 0); // Always look straight ahead

      // Instead of using controls.target which can cause rotation,
      // we'll manually update the controls position
      controlsRef.current.target.set(newX, newY, 0);

      // Update zoom
      const newZoom =
        animateToCenterPixel.startZoom + (animateToCenterPixel.targetZoom - animateToCenterPixel.startZoom) * eased;
      controlsRef.current.zoom = newZoom;

      // Update controls without triggering automatic camera changes
      controlsRef.current.update();
    }

    // Continue or end animation
    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animateToPixel);
    } else {
      // Ensure we end at exactly the target values
      if (cameraRef.current && controlsRef.current) {
        const targetX = animateToCenterPixel.targetPosition.x;
        const targetY = animateToCenterPixel.targetPosition.y;
        const targetZ = animateToCenterPixel.targetPosition.z;

        cameraRef.current.position.set(targetX, targetY, targetZ);

        // Keep camera looking straight ahead at final position
        cameraRef.current.up.set(0, 1, 0);
        cameraRef.current.lookAt(targetX, targetY, 0);

        // Update controls target to match camera
        controlsRef.current.target.set(targetX, targetY, 0);
        controlsRef.current.zoom = animateToCenterPixel.targetZoom;
        controlsRef.current.update();
      }

      animateToCenterPixel.active = false;
      animationRef.current = null;
    }
  };

  // Handle pixel selection
  useEffect(() => {
    if (!isInitialized || !pixelObjectsRef.current.length) return;

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Update selection state for all pixels
    pixelObjectsRef.current.forEach((pixelObj) => {
      const isSelected = selectedIndex !== null && pixelObj.userData.pixel.serial === pixels[selectedIndex]?.serial;

      pixelObj.userData.isSelected = isSelected;

      // Update outline visibility based on selection
      if (pixelObj.userData.outline) {
        pixelObj.userData.outline.visible = isSelected;
      }

      // Update material based on selection and availability
      const isUnavailable = pixelObj.userData.pixel.state === 4;

      if (isSelected) {
        // Hide the poster when selected (model will be shown instead)
        pixelObj.material.opacity = 0;

        // Calculate new dimensions for selected pixel (scale to 100px width/height)
        const aspectRatio = pixelObj.userData.width / pixelObj.userData.height;
        let newWidth, newHeight;

        if (aspectRatio >= 1) {
          newWidth = 100;
          newHeight = 100 / aspectRatio;
        } else {
          newHeight = 100;
          newWidth = 100 * aspectRatio;
        }

        // Update geometry
        pixelObj.geometry.dispose();
        pixelObj.geometry = new THREE.PlaneGeometry(newWidth, newHeight);

        // Update outline size to match new dimensions
        if (pixelObj.userData.outline) {
          pixelObj.userData.outline.geometry.dispose();
          pixelObj.userData.outline.geometry = new THREE.EdgesGeometry(
            new THREE.BoxGeometry(newWidth + 2, newHeight + 2, 2)
          );
        }

        // Load GLTF model for the selected pixel
        const pixelNumber = pixelObj.userData.pixel.number || pixelObj.userData.pixel.serial;
        loadGLTFModel(pixelNumber, pixelObj.position.clone());

        // Set up animation to move camera to this pixel
        animateToCenterPixel.active = true;

        // Get pixel position
        const pixelPos = pixelObj.position.clone();

        // Store current camera position as start
        animateToCenterPixel.startPosition = new THREE.Vector3().copy(cameraRef.current.position);

        // Target position: same X/Y as pixel, but maintain Z distance
        const targetZ = 150; // Closer zoom for selected pixel

        // Update the controls target to focus on the pixel's center
        controlsRef.current.target.set(pixelPos.x, pixelPos.y, 0);

        // Set camera position to look at the pixel from the desired distance
        animateToCenterPixel.targetPosition = new THREE.Vector3(pixelPos.x, pixelPos.y, targetZ);

        animateToCenterPixel.startZoom = controlsRef.current.zoom;
        animateToCenterPixel.targetZoom = 1.2;
        animateToCenterPixel.startTime = performance.now();
        animateToCenterPixel.duration = 500; // Slightly longer animation for smoother effect

        // Start animation
        animateToPixel();
      } else {
        // Show the poster with appropriate opacity when not selected
        pixelObj.material.opacity = isUnavailable ? 0.3 : 1.0;

        if (selectedIndex === null && pixelObj.userData.isSelected) {
          // Reset geometry to original size
          pixelObj.geometry.dispose();
          pixelObj.geometry = new THREE.PlaneGeometry(pixelObj.userData.width, pixelObj.userData.height);

          // Update outline size to match original dimensions
          if (pixelObj.userData.outline) {
            pixelObj.userData.outline.geometry.dispose();
            pixelObj.userData.outline.geometry = new THREE.EdgesGeometry(
              new THREE.BoxGeometry(pixelObj.userData.width + 2, pixelObj.userData.height + 2, 2)
            );
          }

          // Remove the model when deselecting
          if (modelRef.current) {
            disposeModel(modelRef.current);
            modelRef.current = null;
          }

          // Reset camera position if we're deselecting
          animateToCenterPixel.active = true;
          animateToCenterPixel.startPosition = new THREE.Vector3().copy(cameraRef.current.position);

          // Only change X and Y to return to center, maintain current Z
          animateToCenterPixel.targetPosition = new THREE.Vector3(0, 0, 3000); // Increased zoom distance

          // Reset controls target to center
          controlsRef.current.target.set(0, 0, 0);

          animateToCenterPixel.startZoom = controlsRef.current.zoom;
          animateToCenterPixel.targetZoom = 0.8;
          animateToCenterPixel.startTime = performance.now();
          animateToCenterPixel.duration = 500;

          // Start animation
          animateToPixel();
        }
      }
    });
  }, [selectedIndex, isInitialized, pixels]);

  // Function to dispose of a model and free memory
  const disposeModel = (model) => {
    if (!model) return;

    model.traverse((object) => {
      if (object.geometry) object.geometry.dispose();

      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    if (sceneRef.current) {
      sceneRef.current.remove(model);
    }
  };

  // Load GLTF model
  const loadGLTFModel = (pixelNumber, position) => {
    if (!gltfLoaderRef.current || !sceneRef.current) return;

    if (modelRef.current) {
      disposeModel(modelRef.current);
      modelRef.current = null;
    }

    const modelUrl = `data/models/pixels/Pixel ${pixelNumber}.glb`;

    gltfLoaderRef.current.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        model.position.copy(position);
        model.position.y -= 30;

        const boundingBox = new THREE.Box3().setFromObject(model);
        const modelHeight = boundingBox.max.y - boundingBox.min.y;
        model.position.y += modelHeight / 2;
        model.scale.set(250, 250, 250);

        // Reset rotation
        model.rotation.set(0, 0, 0);

        // Add to scene
        sceneRef.current.add(model);
        modelRef.current = model;

        // Adjust Z position
        model.position.z += 5;
      },
      undefined,
      (error) => {
        console.error("Error loading GLTF model:", error);
      }
    );
  };

  // Add a function to calculate the optimal camera distance to see all pixels
  const calculateOptimalCameraDistance = () => {
    if (!pixelObjectsRef.current.length) return 3000; // Increased default distance

    // Find the furthest pixel from center
    let maxDistance = 0;
    pixelObjectsRef.current.forEach((pixel) => {
      const distance = Math.sqrt(pixel.position.x * pixel.position.x + pixel.position.y * pixel.position.y);
      maxDistance = Math.max(maxDistance, distance);
    });

    // Add padding and calculate optimal distance based on field of view
    const padding = 2.0; // Increased padding from 1.2 to 2.0
    const fov = cameraRef.current.fov * (Math.PI / 180); // Convert to radians
    const optimalDistance = (maxDistance * padding) / Math.tan(fov / 2);

    return Math.max(optimalDistance, 3000); // Increased minimum distance
  };

  // Add a toggle function for jitter
  const toggleJitter = () => {
    setShowJitter((prev) => !prev);

    // Recalculate positions and start transition
    startSortTransition();
  };

  // Remove or modify other animation-related effects that might be interfering
  useEffect(() => {
    if (!isInitialized || !pixelObjectsRef.current.length) return;

    // When loading GLTF model, don't override the animation
    if (selectedIndex !== null) {
      const pixelObj = pixelObjectsRef.current.find(
        (obj) => obj.userData.pixel.serial === pixels[selectedIndex]?.serial
      );
      if (pixelObj) {
        const pixelNumber = pixelObj.userData.pixel.number || pixelObj.userData.pixel.serial;
        loadGLTFModel(pixelNumber, pixelObj.position.clone());
      }
    } else {
      if (modelRef.current) {
        disposeModel(modelRef.current);
        modelRef.current = null;
      }
    }
  }, [selectedIndex, isInitialized, pixels]);

  return <div ref={containerRef} className={styles.canvasContainer} style={{ width, height }} />;
};

export default PixelCanvas2;
