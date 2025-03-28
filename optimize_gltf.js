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
  console.log(`Optimizing ${inputPath}`);

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

    // Apply Draco compression with embedded buffers
    draco({
      encodeSpeed: 1,
      decodeSpeed: 5,
      quantizePosition: 14,
      quantizeNormal: 10,
      quantizeTexcoord: 12,
      quantizeColor: 8,
      quantizeGeneric: 12,
    })
  );

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write to the output path with GLB format
  await io.write(outputPath, document);

  // Get file sizes for logging
  const inputSize = fs.statSync(inputPath).size / (1024 * 1024);
  const outputSize = fs.statSync(outputPath).size / (1024 * 1024);

  console.log(`Optimization complete: ${outputPath}`);
  console.log(`Original size: ${inputSize.toFixed(2)} MB`);
  console.log(`Optimized size: ${outputSize.toFixed(2)} MB`);
  console.log(`Reduction: ${((1 - outputSize / inputSize) * 100).toFixed(2)}%`);
}

async function processDirectory(inputDirectory, outputDirectory) {
  const files = fs.readdirSync(inputDirectory);
  const glbFiles = files.filter((file) => path.extname(file).toLowerCase() === ".glb");

  console.log(`Found ${glbFiles.length} GLB files to optimize in ${inputDirectory}`);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }

  for (const file of glbFiles) {
    const inputPath = path.join(inputDirectory, file);
    const outputPath = path.join(outputDirectory, file);
    try {
      await optimizeModel(inputPath, outputPath);
    } catch (error) {
      console.error(`Error optimizing ${inputPath}:`, error);
    }
  }
}

async function main() {
  try {
    const pixelsDirectory = path.resolve(__dirname, "public/data/models/pixels/");
    const optimizedDirectory = path.resolve(__dirname, "public/data/models/pixels_optimized/");

    if (!fs.existsSync(pixelsDirectory)) {
      console.error(`Input directory not found: ${pixelsDirectory}`);
      process.exit(1);
    }

    await processDirectory(pixelsDirectory, optimizedDirectory);
    console.log(`All models have been optimized and saved to ${optimizedDirectory}`);
  } catch (error) {
    console.error("Error during optimization process:", error);
    process.exit(1);
  }
}

main();
