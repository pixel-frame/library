const resolution = config.resolution ?? 1024
const normalResolution = Math.max(resolution, 2048)
unpartition(),
palette({ min: 5 }),
reorder({ encoder: MeshoptEncoder }),
dedup(),
instance({ min: 5 }),
flatten(),
dequantize(),
join(),
resample({ ready: resampleReady, resample: resampleWASM }),
prune({ keepAttributes: false, keepLeaves: false }),
sparse(),
textureCompress({
  slots: /^(?!normalTexture).*$/, // exclude normal maps
  encoder: sharp,
  targetFormat: config.format,
  resize: [resolution, resolution],
}),
textureCompress({
  slots: /^(?=normalTexture).*$/, // include normal maps
  encoder: sharp,
  targetFormat: 'jpeg',
  resize: [normalResolution, normalResolution],
}),
draco())