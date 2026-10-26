import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { findOpaqueComponents, opaqueBounds } from './character-frame-utils.mjs';
import { ATLAS_COLUMNS, CONTENT_SIZE, FRAME_SIZE, MOTION_SHEETS,
  getMotionFrameDescriptors } from './motion-study-layout.mjs';

const ROOT = process.cwd();
const RUNTIME_DIR = path.join(ROOT, 'assets/character/runtime');
const FRAME_DIR = path.join(RUNTIME_DIR, 'frames');
const PROOF_DIR = path.join(RUNTIME_DIR, 'proofs');
const PORTRAIT_DIR = path.join(ROOT, 'assets/character/portraits');
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/** @typedef {{data:Buffer,width:number,height:number}} RawImage */

/** @param {RawImage} source @param {{left:number,top:number,width:number,height:number}} rect @returns {RawImage} */
export function extractMotionFrame(source, rect) {
  if (![rect.left, rect.top, rect.width, rect.height].every(Number.isInteger) ||
    rect.left < 0 || rect.top < 0 || rect.width <= 0 || rect.height <= 0 ||
    rect.left + rect.width > source.width || rect.top + rect.height > source.height) {
    throw new RangeError(`Invalid motion crop ${JSON.stringify(rect)} for ${source.width}x${source.height}.`);
  }
  const data = Buffer.alloc(rect.width * rect.height * 4);
  for (let row = 0; row < rect.height; row += 1) {
    const start = ((rect.top + row) * source.width + rect.left) * 4;
    source.data.copy(data, row * rect.width * 4, start, start + rect.width * 4);
  }
  return { data, width: rect.width, height: rect.height };
}

/** Preserve pale hair by clearing only pale pixels connected to the cell boundary. */
export function cutoutPaleBackground(frame, tolerance) {
  const { data, width, height } = frame;
  const visited = new Uint8Array(width * height);
  const originalAlpha = Uint8Array.from({ length: width * height }, (_, index) => data[index * 4 + 3]);
  const queue = new Uint32Array(width * height);
  let head = 0;
  let tail = 0;
  const isBackground = (index) => {
    const pixel = index * 4;
    if (data[pixel + 3] === 0) return false;
    const red = data[pixel];
    const green = data[pixel + 1];
    const blue = data[pixel + 2];
    if (Math.min(red, green, blue) < 210) return false;
    return Math.hypot(255 - red, 255 - green, 255 - blue) <= tolerance;
  };
  const add = (index) => {
    if (visited[index] || !isBackground(index)) return;
    visited[index] = 1;
    queue[tail++] = index;
  };
  for (let x = 0; x < width; x += 1) {
    add(x);
    add((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    add(y * width);
    add(y * width + width - 1);
  }
  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) add(index - 1);
    if (x + 1 < width) add(index + 1);
    if (y > 0) add(index - width);
    if (y + 1 < height) add(index + width);
  }
  for (let index = 0; index < visited.length; index += 1) {
    if (visited[index]) data[index * 4 + 3] = 0;
  }
  restoreEnclosedDetails(frame, originalAlpha);
  return frame;
}

/** Repair light costume and hair enclosed by thin outlines with small gaps. */
function restoreEnclosedDetails(frame, originalAlpha) {
  const { data, width, height } = frame;
  const length = width * height;
  const dilated = new Uint8Array(length);
  const closed = new Uint8Array(length);
  const radius = 2;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!data[index * 4 + 3]) continue;
      for (let dy = -radius; dy <= radius; dy += 1) {
        const nearY = y + dy;
        if (nearY < 0 || nearY >= height) continue;
        for (let dx = -radius; dx <= radius; dx += 1) {
          const nearX = x + dx;
          if (nearX >= 0 && nearX < width) dilated[nearY * width + nearX] = 1;
        }
      }
    }
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (data[index * 4 + 3]) { closed[index] = 1; continue; }
      let enclosed = true;
      for (let dy = -radius; dy <= radius && enclosed; dy += 1) {
        const nearY = y + dy;
        if (nearY < 0 || nearY >= height) { enclosed = false; break; }
        for (let dx = -radius; dx <= radius; dx += 1) {
          const nearX = x + dx;
          if (nearX < 0 || nearX >= width || !dilated[nearY * width + nearX]) {
            enclosed = false;
            break;
          }
        }
      }
      if (enclosed) closed[index] = 1;
    }
  }
  const exterior = new Uint8Array(length);
  const queue = new Uint32Array(length);
  let head = 0;
  let tail = 0;
  const add = (index) => {
    if (closed[index] || exterior[index]) return;
    exterior[index] = 1;
    queue[tail++] = index;
  };
  for (let x = 0; x < width; x += 1) { add(x); add((height - 1) * width + x); }
  for (let y = 0; y < height; y += 1) { add(y * width); add(y * width + width - 1); }
  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) add(index - 1);
    if (x + 1 < width) add(index + 1);
    if (y > 0) add(index - width);
    if (y + 1 < height) add(index + width);
  }
  for (let index = 0; index < length; index += 1) {
    if (!exterior[index]) data[index * 4 + 3] = originalAlpha[index];
  }
}

/** Clear the long, pale ground ellipses printed below poses on the study sheets. */
export function clearFloorShadow(frame, shadowRgb) {
  const { data, width, height } = frame;
  const startY = Math.floor(height * 0.7);
  const matches = (index) => {
    const offset = index * 4;
    return data[offset + 3] > 0 &&
      Math.hypot(data[offset] - shadowRgb[0], data[offset + 1] - shadowRgb[1],
        data[offset + 2] - shadowRgb[2]) < 60;
  };
  const seeds = [];
  for (let y = startY; y < height; y += 1) {
    let x = 0;
    while (x < width) {
      if (!matches(y * width + x)) { x += 1; continue; }
      const left = x;
      while (x < width && matches(y * width + x)) x += 1;
      if (x - left >= 10) {
        for (let column = left; column < x; column += 1) seeds.push(y * width + column);
      }
    }
  }
  const seen = new Uint8Array(width * height);
  for (let head = 0; head < seeds.length; head += 1) {
    const index = seeds[head];
    if (seen[index] || !matches(index)) continue;
    seen[index] = 1;
    const x = index % width;
    const y = Math.floor(index / width);
    data[index * 4 + 3] = 0;
    for (const neighbor of [index - 1, index + 1, index - width, index + width]) {
      const neighborX = neighbor % width;
      const neighborY = Math.floor(neighbor / width);
      if (neighborX >= 0 && neighborX < width && neighborY >= startY && neighborY < height &&
        Math.abs(neighborX - x) + Math.abs(neighborY - y) === 1 && !seen[neighbor] && matches(neighbor)) {
        seeds.push(neighbor);
      }
    }
  }
  return frame;
}

/** Keep the character silhouette while rejecting detached source-sheet decoration. */
function removeDetachedEffects(frame, keepRects = []) {
  const components = findOpaqueComponents(frame.data, frame.width, frame.height);
  if (!components.length) return frame;
  for (const component of components.slice(1)) {
    const kept = keepRects.some((rect) => component.left >= rect.left &&
      component.right <= rect.right && component.top >= rect.top && component.bottom <= rect.bottom);
    if (kept) continue;
    for (const index of component.pixels) frame.data[index * 4 + 3] = 0;
  }
  return frame;
}

function measure(frame, label) {
  const bounds = opaqueBounds(frame.data, frame.width, frame.height);
  if (!bounds) throw new Error(`${label} is empty after background removal.`);
  return { ...frame, bounds, label };
}

async function renderFrame(frame, scale) {
  const { bounds } = frame;
  const width = bounds.right - bounds.left + 1;
  const height = bounds.bottom - bounds.top + 1;
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));
  const trimmed = await sharp(frame.data, { raw: { width: frame.width, height: frame.height, channels: 4 } })
    .extract({ left: bounds.left, top: bounds.top, width, height })
    .resize(targetWidth, targetHeight, { kernel: 'lanczos3' })
    .png().toBuffer();
  const left = Math.floor((FRAME_SIZE - targetWidth) / 2);
  const top = FRAME_SIZE - 4 - targetHeight;
  if (left < 4 || top < 4 || left + targetWidth > FRAME_SIZE - 4) {
    throw new Error(`${frame.label} exceeds the ${FRAME_SIZE}x${FRAME_SIZE} canvas after alignment.`);
  }
  return sharp({ create: { width: FRAME_SIZE, height: FRAME_SIZE, channels: 4, background: TRANSPARENT } })
    .composite([{ input: trimmed, left, top }]).png().toBuffer();
}

/** @param {Array<ReturnType<typeof measure>>} frames */
export async function normalizeMotionFrames(frames) {
  const maxWidth = Math.max(...frames.map(({ bounds }) => bounds.right - bounds.left + 1));
  const maxHeight = Math.max(...frames.map(({ bounds }) => bounds.bottom - bounds.top + 1));
  const scale = Math.min(1, CONTENT_SIZE / maxWidth, CONTENT_SIZE / maxHeight);
  return Promise.all(frames.map((frame) => renderFrame(frame, scale)));
}

function manifestFor(sheet, descriptors) {
  const frames = {};
  descriptors.forEach((descriptor, index) => {
    const x = index % ATLAS_COLUMNS * FRAME_SIZE;
    const y = Math.floor(index / ATLAS_COLUMNS) * FRAME_SIZE;
    frames[descriptor.name] = {
      frame: { x, y, w: FRAME_SIZE, h: FRAME_SIZE },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: FRAME_SIZE, h: FRAME_SIZE },
      sourceSize: { w: FRAME_SIZE, h: FRAME_SIZE },
    };
  });
  return {
    frames,
    meta: { app: 'build-motion-atlases.mjs', image: `${sheet.id}.png`,
      format: 'RGBA8888', size: { w: 1152, h: 480 }, scale: '1' },
  };
}

async function makeAtlas(frameBuffers) {
  const overlays = frameBuffers.map((input, index) => ({
    input, left: index % ATLAS_COLUMNS * FRAME_SIZE,
    top: Math.floor(index / ATLAS_COLUMNS) * FRAME_SIZE,
  }));
  return sharp({ create: { width: 1152, height: 480, channels: 4, background: TRANSPARENT } })
    .composite(overlays).png().toBuffer();
}

async function makeProof(atlas) {
  const width = 1152;
  const height = 480;
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const light = (Math.floor(x / 12) + Math.floor(y / 12)) % 2 === 0;
      const index = (y * width + x) * 4;
      data[index] = light ? 242 : 211;
      data[index + 1] = light ? 245 : 217;
      data[index + 2] = light ? 250 : 229;
      data[index + 3] = 255;
    }
  }
  return sharp(data, { raw: { width, height, channels: 4 } })
    .composite([{ input: atlas, left: 0, top: 0 }]).png().toBuffer();
}

async function validatePortrait(sheet) {
  const file = path.join(PORTRAIT_DIR, `${sheet.slug}-portrait.png`);
  let metadata;
  try { metadata = await sharp(file).metadata(); }
  catch { throw new Error(`Missing or unreadable curated portrait: ${path.relative(ROOT, file)}.`); }
  if (metadata.format !== 'png' || metadata.width < 1024 || metadata.height < 1024 || !metadata.hasAlpha) {
    throw new Error(`${sheet.slug} portrait must be a high-resolution transparent PNG.`);
  }
  const corner = await sharp(file).extract({ left: 0, top: 0, width: 1, height: 1 })
    .ensureAlpha().raw().toBuffer();
  if (corner[3] !== 0) throw new Error(`${sheet.slug} portrait background is not transparent.`);
}

function hash(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function saveOrCheck(file, expected, checkOnly) {
  if (!checkOnly) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, expected);
    return;
  }
  let actual;
  try { actual = await fs.readFile(file); }
  catch { throw new Error(`Missing generated asset: ${path.relative(ROOT, file)}.`); }
  if (hash(actual) !== hash(expected)) {
    throw new Error(`Stale or modified generated asset: ${path.relative(ROOT, file)}.`);
  }
}

async function validateFrame(buffer, name) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== FRAME_SIZE || info.height !== FRAME_SIZE) throw new Error(`${name} has incorrect dimensions.`);
  const bounds = opaqueBounds(data, info.width, info.height);
  if (!bounds || bounds.left < 4 || bounds.top < 4 || bounds.right > 91 || bounds.bottom > 91) {
    throw new Error(`${name} is empty or touches its frame edge: ${JSON.stringify(bounds)}.`);
  }
  if (!data.some((value, index) => index % 4 === 3 && value === 0)) {
    throw new Error(`${name} has no transparent background.`);
  }
}

/** @param {import('./motion-study-layout.mjs').MotionSheet} sheet @param {boolean} checkOnly */
export async function buildCharacterAtlas(sheet, checkOnly = false) {
  const sourcePath = path.join(ROOT, sheet.sourcePath);
  const sourceInfo = await sharp(sourcePath).metadata();
  if (sourceInfo.format !== 'png' || sourceInfo.width !== 1536 || sourceInfo.height !== 1024) {
    throw new Error(`${sheet.slug} source must be a 1536x1024 PNG.`);
  }
  const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const source = { data, width: info.width, height: info.height };
  const descriptors = getMotionFrameDescriptors(sheet);
  if (descriptors.length !== 60 || new Set(descriptors.map(({ name }) => name)).size !== 60) {
    throw new Error(`${sheet.id} must define exactly 60 unique frames.`);
  }
  const measured = descriptors.map(({ name, rect }) => {
    const frame = extractMotionFrame(source, rect);
    cutoutPaleBackground(frame, sheet.backgroundTolerance);
    clearFloorShadow(frame, sheet.shadowRgb);
    removeDetachedEffects(frame, sheet.keepComponents?.[name]);
    return measure(frame, `${sheet.id}/${name}`);
  });
  const frames = await normalizeMotionFrames(measured);
  for (let index = 0; index < frames.length; index += 1) {
    await validateFrame(frames[index], descriptors[index].name);
    await saveOrCheck(path.join(FRAME_DIR, `${descriptors[index].name}.png`), frames[index], checkOnly);
  }
  const atlas = await makeAtlas(frames);
  const manifest = Buffer.from(`${JSON.stringify(manifestFor(sheet, descriptors), null, 2)}\n`);
  await saveOrCheck(path.join(RUNTIME_DIR, `${sheet.id}.png`), atlas, checkOnly);
  await saveOrCheck(path.join(RUNTIME_DIR, `${sheet.id}.json`), manifest, checkOnly);
  await saveOrCheck(path.join(PROOF_DIR, `${sheet.id}-contact.png`), await makeProof(atlas), checkOnly);
  await validatePortrait(sheet);
  console.log(`${checkOnly ? 'Validated' : 'Prepared'} ${sheet.id}: 60 frames, 1152x480 atlas.`);
}

export async function validateCharacterAtlas(sheet) {
  await buildCharacterAtlas(sheet, true);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const checkOnly = process.argv.includes('--check');
  for (const sheet of MOTION_SHEETS) await buildCharacterAtlas(sheet, checkOnly);
}
