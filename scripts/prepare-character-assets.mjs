import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {
  clearSmallDetachedComponents,
  findOpaqueComponents,
  getAlignedOffset,
  opaqueBounds,
  resolveFrameRect,
} from './character-frame-utils.mjs';

const root = process.cwd();
const atlasPaths = [
  'src/game/characters/characterAtlas.json',
  'src/game/characters/gothCharacterAtlas.json',
  'src/game/characters/wingedCharacterAtlas.json',
  'src/game/characters/akaneCharacterAtlas.json',
];
const outputDir = path.join(root, 'assets/character/runtime');
const frameDir = path.join(outputDir, 'frames');
const checkOnly = process.argv.includes('--check');

for (const atlasRelativePath of atlasPaths) {
const atlasPath = path.join(root, atlasRelativePath);
const configText = await fs.readFile(atlasPath, 'utf8');
const config = JSON.parse(configText.replace(/^\uFEFF/, ''));
const characterOutputDir = outputDir;

const frameNames = new Set(config.frames.map((frame) => frame.name));
if (frameNames.size !== config.frames.length) {
  throw new Error(`${config.id} must define uniquely named frames.`);
}
for (const [animation, expectedCount] of Object.entries(config.animationCounts ?? {})) {
  const actualCount = config.frames.filter((frame) => frame.animation === animation).length;
  if (actualCount !== expectedCount) {
    throw new Error(`${config.id}/${animation} must define ${expectedCount} frames; found ${actualCount}.`);
  }
}
for (const frame of config.frames) {
  if (!Object.hasOwn(config.animationCounts ?? {}, frame.animation)) {
    throw new Error(`${config.id}/${frame.name} uses unconfigured animation "${frame.animation}".`);
  }
}

for (const source of Object.values(config.sources)) {
  const metadata = await sharp(path.join(root, source.path)).metadata();
  if (metadata.width !== source.width || metadata.height !== source.height) {
    throw new Error(`${config.id} source dimensions changed for ${source.path}; update ${path.basename(atlasPath)} crop bounds.`);
  }
}

async function assertTransparentPng(filePath, expectedWidth, expectedHeight, { frameName = path.basename(filePath), checkFrame = false } = {}) {
  const label = `${config.id}/${frameName}`;
  let decoded;
  try {
    decoded = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  } catch (error) {
    throw new Error(`${label} is missing or unreadable (${path.basename(filePath)}): ${error.message}`);
  }
  const { data, info } = decoded;
  if (info.width !== expectedWidth || info.height !== expectedHeight) {
    throw new Error(`${label} (${path.basename(filePath)}) must be ${expectedWidth}x${expectedHeight}; found ${info.width}x${info.height}.`);
  }
  let transparentPixels = 0;
  let opaquePixels = 0;
  for (let index = 3; index < data.length; index += info.channels) {
    if (data[index] === 0) transparentPixels += 1;
    if (data[index] > 0) opaquePixels += 1;
  }
  if (transparentPixels === 0 || opaquePixels === 0) {
    throw new Error(`${label} (${path.basename(filePath)}) must contain visible pixels and transparent background.`);
  }
  if (checkFrame) {
    const bounds = opaqueBounds(data, info.width, info.height);
    const edgePadding = config.framePadding ?? 4;
    if (bounds.left < edgePadding || bounds.top < edgePadding ||
        bounds.right >= info.width - edgePadding || bounds.bottom >= info.height - edgePadding) {
      throw new Error(`${label} artwork touches the frame boundary: ${JSON.stringify(bounds)}.`);
    }
    const minComponentPixels = config.cleanup?.runtimeMinComponentPixels ?? 3;
    const padding = config.cleanup?.runtimeMainPadding ?? 3;
    const components = findOpaqueComponents(data, info.width, info.height);
    const main = components[0];
    const residue = components.find((component) => component.size < minComponentPixels &&
      (component.left > main.right + padding || component.right < main.left - padding ||
       component.top > main.bottom + padding || component.bottom < main.top - padding));
    if (residue) {
      throw new Error(`${label} has unexplained detached residue (${residue.size}px at ${residue.left},${residue.top}-${residue.right},${residue.bottom}).`);
    }
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

function clearConnectedLowDifferenceBackground(data, width, height, maxDifference) {
  const visited = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  let head = 0;
  let tail = 0;
  const add = (index, fromIndex = null) => {
    if (visited[index]) return;
    const pixel = index * 4;
    if (data[pixel + 3] === 0) return;
    if (fromIndex !== null) {
      const fromPixel = fromIndex * 4;
      const red = data[pixel] - data[fromPixel];
      const green = data[pixel + 1] - data[fromPixel + 1];
      const blue = data[pixel + 2] - data[fromPixel + 2];
      if (Math.sqrt(red * red + green * green + blue * blue) > maxDifference) return;
    }
    visited[index] = 1;
    queue[tail++] = index;
  };
  for (let x = 0; x < width; x += 1) {
    add(x); add((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    add(y * width); add(y * width + width - 1);
  }
  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) add(index - 1, index);
    if (x + 1 < width) add(index + 1, index);
    if (y > 0) add(index - width, index);
    if (y + 1 < height) add(index + width, index);
  }
  for (let index = 0; index < visited.length; index += 1) {
    if (visited[index]) data[index * 4 + 3] = 0;
  }
}

function clearGeneratedRunArtifacts(data, width, height) {
  const [main, ...detached] = findOpaqueComponents(data, width, height);
  if (!main) return;
  for (const component of detached) {
    const horizontalGap = Math.max(0, component.left - main.right, main.left - component.right);
    const verticalGap = Math.max(0, component.top - main.bottom, main.top - component.bottom);
    if (component.size >= 500 && Math.max(horizontalGap, verticalGap) <= 12) continue;
    for (const index of component.pixels) data[index * 4 + 3] = 0;
  }
}

async function makeTransparentFrame(frame) {
  const source = config.sources[frame.source];
  const rect = resolveFrameRect(frame, source);

  const { data: raw, info } = await sharp(path.join(root, source.path))
    .extract(rect)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = Buffer.from(raw);
  if (config.sources[frame.source].backgroundMode === 'transparent') {
    // Normalized sheets already have a clean alpha channel.
  } else if (config.sources[frame.source].backgroundDifference) {
    clearConnectedLowDifferenceBackground(pixels, info.width, info.height, config.sources[frame.source].backgroundDifference);
  } else {
    clearConnectedBlueBackground(pixels, info.width, info.height);
  }
  if (source.cleanupMode === 'runCycle') {
    clearGeneratedRunArtifacts(pixels, info.width, info.height);
  }
  const cleanup = config.cleanup ?? {};
  const { removed } = clearSmallDetachedComponents(pixels, info.width, info.height, {
    minComponentPixels: frame.minComponentPixels ?? cleanup.minComponentPixels ?? 0,
    mainPadding: frame.componentPadding ?? cleanup.mainPadding ?? 8,
    keepComponents: frame.keepComponents ?? [],
  });
  if (removed.length) {
    console.log(`Cleaned ${config.displayName}/${frame.name}: removed ${removed.length} detached fragments (${removed.reduce((sum, { size }) => sum + size, 0)} pixels).`);
  }
  const bounds = opaqueBounds(pixels, info.width, info.height);
  if (!bounds) throw new Error(`${config.id}/${frame.name} is empty after background removal.`);

  const trimmed = await sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } })
    .extract({ left: bounds.left, top: bounds.top, width: bounds.right - bounds.left + 1, height: bounds.bottom - bounds.top + 1 })
    .resize(config.contentSize, config.contentSize, { fit: 'inside', kernel: 'nearest' })
    .png()
    .toBuffer({ resolveWithObject: true });
  const normalized = source.cleanupMode === 'runCycle'
    ? await sharp(trimmed.data).resize(trimmed.info.width, source.targetHeight, { fit: 'fill', kernel: 'nearest' }).png().toBuffer({ resolveWithObject: true })
    : trimmed;
  const resizedPixels = normalized.data;
  const anchor = frame.anchor ?? (['idle', 'idleLook', 'walk', 'run', 'start'].includes(frame.animation) ? 'feet' : 'center');
  const offset = getAlignedOffset({ left: 0, top: 0, right: normalized.info.width - 1, bottom: normalized.info.height - 1 },
    config.frameWidth, config.frameHeight, anchor, config.floorPadding ?? 4);
  return sharp({
    create: {
      width: config.frameWidth,
      height: config.frameHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resizedPixels, left: offset.left, top: offset.top }])
    .png()
    .toBuffer();
}

const frameFiles = new Map();
for (const frame of config.frames) {
  try {
    resolveFrameRect(frame, config.sources[frame.source]);
  } catch (error) {
    throw new Error(`${config.id}/${frame.name} has an invalid source crop: ${error.message}`);
  }
  const output = path.join(frameDir, `${frame.name}.png`);
  if (!checkOnly) {
    frameFiles.set(frame.name, await makeTransparentFrame(frame));
  } else {
    await assertTransparentPng(output, config.frameWidth, config.frameHeight, { frameName: frame.name, checkFrame: true });
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

const imagePath = path.join(characterOutputDir, `${config.textureKey}.png`);
const manifestPath = path.join(characterOutputDir, `${config.textureKey}.json`);
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
  try {
    await fs.access(imagePath);
  } catch {
    throw new Error(`${config.id}/atlas is missing (${path.basename(imagePath)}).`);
  }
  let savedManifest;
  try {
    savedManifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`${config.id}/atlas manifest is missing or invalid (${path.basename(manifestPath)}): ${error.message}`);
  }
  const missingFrame = config.frames.find((frame) => !savedManifest.frames?.[frame.name]);
  if (missingFrame) {
    throw new Error(`${config.id}/${missingFrame.name} is missing from the atlas manifest.`);
  }
  if (Object.keys(savedManifest.frames).length !== config.frames.length) {
    throw new Error(`${config.id}/atlas manifest frame count does not match the character frame map.`);
  }
  const invalidFrame = config.frames.find((frame, index) => {
    const actual = savedManifest.frames[frame.name]?.frame;
    return actual?.x !== (index % config.atlasColumns) * config.frameWidth ||
      actual?.y !== Math.floor(index / config.atlasColumns) * config.frameHeight ||
      actual?.w !== config.frameWidth || actual?.h !== config.frameHeight;
  });
  if (invalidFrame) {
    throw new Error(`${config.id}/${invalidFrame.name} has incorrect atlas coordinates or dimensions.`);
  }
  if (savedManifest.meta?.size?.w !== atlasWidth || savedManifest.meta?.size?.h !== atlasHeight) {
    throw new Error(`${config.id}/atlas must be ${atlasWidth}x${atlasHeight}.`);
  }
  await assertTransparentPng(imagePath, atlasWidth, atlasHeight, { frameName: 'atlas' });
  console.log(`Validated ${config.id}: ${config.frames.length} frames (${atlasWidth}x${atlasHeight}) and all source crops.`);
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
  console.log(`Prepared ${config.id}: ${config.frames.length} transparent frames at ${characterOutputDir}.`);
}
}

console.log(`${checkOnly ? 'Validated' : 'Prepared'} ${atlasPaths.length} character atlases.`);
