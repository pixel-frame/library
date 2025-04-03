import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import styles from "./Pixels.module.css";

const PixelCanvasPreview = ({ width = "100%", height = "350px" }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const pixelObjectsRef = useRef([]);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      5000
    );
    camera.position.set(0, 0, 500);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Create grid
    const createGrid = () => {
      const gridSize = 2000;
      const gridDivisions = 100; // Increased to match 20px size (2000/100 = 20px per division)

      // Get CSS variables from root
      const rootStyle = getComputedStyle(document.documentElement);
      const accentColor = rootStyle.getPropertyValue("--accent").trim();
      const accentLightColor = rootStyle.getPropertyValue("--accent-light").trim();

      const gridMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color(accentColor),
        transparent: true,
        opacity: 1,
      });

      const gridHelper = new THREE.GridHelper(
        gridSize,
        gridDivisions,
        new THREE.Color(accentColor),
        new THREE.Color(accentColor)
      );
      gridHelper.rotation.x = Math.PI / 2;
      scene.add(gridHelper);

      // Add background plane
      const planeGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(accentLightColor),
        transparent: false,
        side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.position.z = -1;
      scene.add(plane);
    };

    createGrid();

    // Load and create pixel objects
    const loadPixels = () => {
      const textureLoader = new THREE.TextureLoader();
      const baseSize = 50;
      const radius = 140; // Orbit radius
      const orbitSpeed = 0.0005; // Base orbit speed

      // Helper function to create a pixel with custom parameters
      const createPixel = (texture, orbitModifier = 1, heightModifier = 1) => {
        const aspectRatio = texture.image.width / texture.image.height;
        const width = baseSize;
        const height = baseSize / aspectRatio;

        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);

        const angle = Math.random() * Math.PI * 2;
        const orbitRadius = radius * (0.5 + Math.random() * 0.5) * orbitModifier;
        const verticalOffset = (Math.random() - 0.5) * 200 * heightModifier;
        const orbitSpeedModifier = (0.8 + Math.random() * 0.4) * orbitModifier;

        mesh.userData = {
          angle,
          radius: orbitRadius,
          speed: orbitSpeed * orbitSpeedModifier,
          verticalOffset,
        };

        scene.add(mesh);
        pixelObjectsRef.current.push(mesh);
      };

      // Load sample pixels three times with different parameters
      for (let i = 1; i <= 140; i++) {
        const url = `data/previews/pixels/model-poster-${i}.png`;

        textureLoader.load(
          url,
          (texture) => {
            texture.minFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;

            // Create three instances with different orbit and height modifiers
            createPixel(texture, 1, 1); // Inner layer
            createPixel(texture, 1.3, 1.2); // Middle layer
            createPixel(texture, 1.6, 1.4); // Outer layer
          },
          undefined,
          () => {
            console.log(`Failed to load pixel ${i}`);
          }
        );
      }
    };

    loadPixels();

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      // Update pixel positions
      pixelObjectsRef.current.forEach((pixel) => {
        const { angle, radius, speed, verticalOffset } = pixel.userData;
        pixel.userData.angle += speed;

        pixel.position.x = Math.cos(pixel.userData.angle) * radius;
        pixel.position.y = Math.sin(pixel.userData.angle) * radius;
        pixel.position.z = verticalOffset;

        // Make pixels always face the camera
        pixel.lookAt(camera.position);
      });

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (renderer && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, []);

  return <div ref={containerRef} className={styles.canvasContainer} style={{ width, height }} />;
};

export default PixelCanvasPreview;
