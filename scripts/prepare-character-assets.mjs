import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const atlasPath = path.join(root, 'src/game/characters/characterAtlas.json');
const config = JSON.parse(await fs.readFile(atlasPath, 'utf8'));
const outputDir = path.join(root, 'assets/character/runtime');
const frameDir = path.join(outputDir, 'frames');
const checkOnly = process.argv.includes('--check');

for (const source of Object.values(config.sources)) {
  const metadata = await sharp(path.join(root, source.path)).metadata();
  if (metadata.width !== source.width || metadata.height !== source.height) {
    throw new Error(`Source dimensions changed for ${source.path}; update characterAtlas.json crop bounds.`);
  }
}

async function assertTransparentPng(filePath, expectedWidth, expectedHeight) {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== expectedWidth || info.height !== expectedHeight) {
    throw new Error(`${path.basename(filePath)} must be ${expectedWidth}x${expectedHeight}.`);
  }
  let transparentPixels = 0;
  let opaquePixels = 0;
  for (let index = 3; index < data.length; index += info.channels) {
    if (data[index] === 0) transparentPixels += 1;
    if (data[index] > 0) opaquePixels += 1;
  }
  if (transparentPixels === 0 || opaquePixels === 0) {
    throw new Error(`${path.basename(filePath)} must contain visible pixels and transparent background.`);
  }
}

function isBlueBackground(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta < 8 || max < 22) return false;

  let hue;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue = ((hue * 60) + 360) % 360;
  const saturation = delta / max;
  const lightness = (max + min) / 510;
  return hue >= 190 && hue <= 285 && saturation >= 0.14 && lightness <= 0.78;
}

function clearConnectedBlueBackground(data, width, height) {
  const visited = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  let head = 0;
  let tail = 0;

  const addIfBackground = (index, fromIndex = null) => {
    if (visited[index]) return;
    const pixel = index * 4;
    if (data[pixel + 3] === 0 || !isBlueBackground(data[pixel], data[pixel + 1], data[pixel + 2])) return;
    if (fromIndex !== null) {
      const fromPixel = fromIndex * 4;
      const red = data[pixel] - data[fromPixel];
      const green = data[pixel + 1] - data[fromPixel + 1];
      const blue = data[pixel + 2] - data[fromPixel + 2];
      if (Math.sqrt(red * red + green * green + blue * blue) > 24) return;
    }
    visited[index] = 1;
    queue[tail++] = index;
  };

  for (let x = 0; x < width; x += 1) {
    addIfBackground(x);
    addIfBackground((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    addIfBackground(y * width);
    addIfBackground(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) addIfBackground(index - 1, index);
    if (x + 1 < width) addIfBackground(index + 1, index);
    if (y > 0) addIfBackground(index - width, index);
    if (y + 1 < height) addIfBackground(index + width, index);
  }

  for (let index = 0; index < visited.length; index += 1) {
    if (visited[index]) data[index * 4 + 3] = 0;
  }
}

async function makeTransparentFrame(frame) {
  const source = config.sources[frame.source];
  const rowTop = source.rowBoundaries[frame.row];
  const rowBottom = source.rowBoundaries[frame.row + 1];
  const rect = {
    left: frame.column * (source.width / source.columns),
    top: rowTop,
    width: source.width / source.columns,
    height: rowBottom - rowTop,
  };
  if (!Object.values(rect).every(Number.isInteger) || rect.left < 0 || rect.top < 0 ||
      rect.left + rect.width > source.width || rect.top + rect.height > source.height) {
    throw new Error(`Frame "${frame.name}" has a crop outside ${source.path}.`);
  }

  const { data: raw, info } = await sharp(path.join(root, source.path))
    .extract(rect)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = Buffer.from(raw);
  clearConnectedBlueBackground(pixels, info.width, info.height);

  let left = info.width;
  let top = info.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (pixels[(y * info.width + x) * 4 + 3] === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left || bottom < top) throw new Error(`Frame "${frame.name}" is empty after background removal.`);

  const trimmed = await sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } })
    .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
    .resize(config.contentSize, config.contentSize, { fit: 'inside', kernel: 'nearest' })
    .png()
    .toBuffer({ resolveWithObject: true });
  const resizedPixels = trimmed.data;
  const offsetX = Math.floor((config.frameWidth - trimmed.info.width) / 2);
  const offsetY = Math.floor((config.frameHeight - trimmed.info.height) / 2);
  return sharp({
    create: {
      width: config.frameWidth,
      height: config.frameHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resizedPixels, left: offsetX, top: offsetY }])
    .png()
    .toBuffer();
}

const frameFiles = new Map();
for (const frame of config.frames) {
  const output = path.join(frameDir, `${frame.name}.png`);
  if (!checkOnly) {
    frameFiles.set(frame.name, await makeTransparentFrame(frame));
  } else {
    await assertTransparentPng(output, config.frameWidth, config.frameHeight);
  }
}

const atlasWidth = config.atlasColumns * config.frameWidth;
const atlasRows = Math.ceil(config.frames.length / config.atlasColumns);
const atlasHeight = atlasRows * config.frameHeight;
const atlasFrames = {};
const overlays = [];
for (const [index, frame] of config.frames.entries()) {
  const x = (index % config.atlasColumns) * config.frameWidth;
  const y = Math.floor(index / config.atlasColumns) * config.frameHeight;
  atlasFrames[frame.name] = {
    frame: { x, y, w: config.frameWidth, h: config.frameHeight },
    rotated: false,
    trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: config.frameWidth, h: config.frameHeight },
    sourceSize: { w: config.frameWidth, h: config.frameHeight },
  };
  if (!checkOnly) overlays.push({ input: frameFiles.get(frame.name), left: x, top: y });
}

const imagePath = path.join(outputDir, `${config.textureKey}.png`);
const manifestPath = path.join(outputDir, `${config.textureKey}.json`);
const manifest = {
  frames: atlasFrames,
  meta: {
    app: 'prepare-character-assets.mjs',
    image: `${config.textureKey}.png`,
    format: 'RGBA8888',
    size: { w: atlasWidth, h: atlasHeight },
    scale: '1',
  },
};

if (checkOnly) {
  await fs.access(imagePath);
  const savedManifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  if (Object.keys(savedManifest.frames).length !== config.frames.length ||
      config.frames.some((frame) => !savedManifest.frames[frame.name])) {
    throw new Error('Atlas manifest frame count does not match the character frame map.');
  }
  await assertTransparentPng(imagePath, atlasWidth, atlasHeight);
  console.log(`Validated ${config.frames.length} frames (${atlasWidth}x${atlasHeight}) and all source crops.`);
} else {
  await fs.mkdir(frameDir, { recursive: true });
  for (const [name, data] of frameFiles) await fs.writeFile(path.join(frameDir, `${name}.png`), data);
  await sharp({
    create: {
      width: atlasWidth,
      height: atlasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite(overlays).png().toFile(imagePath);
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Prepared ${config.frames.length} transparent frames at ${outputDir}.`);
}
