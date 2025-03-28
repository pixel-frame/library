#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { NodeIO } from "@gltf-transform/core";
import { dedup, draco, textureCompress, prune, resample, weld } from "@gltf-transform/functions";
import sharp from "sharp";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function optimizeModel(inputPath, outputPath) {
  console.log(`Optimizing ${inputPath} -> ${outputPath}`);

  const io = new NodeIO();
  const document = await io.read(inputPath);

  // Define optimization settings
  const resolution = 1024;
  const normalResolution = 2048;

  await document.transform(
    // Mesh optimization
    dedup(),
    prune(),
    weld(),
    resample(),

    // Texture optimization for regular textures
    textureCompress({
      format: "webp",
      encoder: sharp,
      resize: [resolution, resolution],
      filter: (texture, slot) => !slot.includes("normal"),
    }),

    // Texture optimization for normal maps (higher resolution, jpeg format)
    textureCompress({
      format: "jpeg",
      encoder: sharp,
      resize: [normalResolution, normalResolution],
      filter: (texture, slot) => slot.includes("normal"),
    }),

    // Apply Draco compression
    draco()
  );

  await io.write(outputPath, document);
  console.log(`Optimization complete: ${outputPath}`);

  // Log file size reduction
  const inputSize = fs.statSync(inputPath).size / (1024 * 1024);
  const outputSize = fs.statSync(outputPath).size / (1024 * 1024);
  console.log(`Original size: ${inputSize.toFixed(2)} MB`);
  console.log(`Optimized size: ${outputSize.toFixed(2)} MB`);
  console.log(`Reduction: ${((1 - outputSize / inputSize) * 100).toFixed(2)}%`);
}

async function main() {
  try {
    const inputPath = path.resolve(__dirname, "public/data/models/assemblies/0003.glb");
    const outputPath = path.resolve(__dirname, "test_pixel.glb");

    await optimizeModel(inputPath, outputPath);
  } catch (error) {
    console.error("Error optimizing model:", error);
    process.exit(1);
  }
}

main();
