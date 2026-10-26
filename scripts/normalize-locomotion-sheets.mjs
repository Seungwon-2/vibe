import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { findOpaqueComponents, opaqueBounds } from './character-frame-utils.mjs';

const root = process.cwd();
const CELL_SIZE = 256;
const CONTENT_SIZE = 208;
const ALPHA_FLOOR = 96;
const FLOOR_PADDING = 12;

const sheets = [
  { name: 'aokumo-rin', rowSplit: 490 },
  { name: 'shizuki-toa', rowSplit: 450 },
  { name: 'ayatsuno-yuni', rowSplit: 462 },
  { name: 'akane-lize', rowSplit: 485 },
];

async function normalizeMovementSheet({ name, rowSplit }) {
  const sourcePath = path.join(root, `assets/character/source/${name}-locomotion-generated.png`);
  const destinationPath = path.join(root, `assets/character/locomotion/${name}-locomotion-v1.png`);
  const metadata = await sharp(sourcePath).metadata();
  if (!metadata.width || !metadata.height || rowSplit <= 0 || rowSplit >= metadata.height) {
    throw new Error(`Invalid dimensions or row split for ${sourcePath}`);
  }

  const x = Array.from({ length: 5 }, (_, index) => Math.floor(index * metadata.width / 4));
  const y = [0, rowSplit, metadata.height];
  const overlays = [];
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const { data, info } = await sharp(sourcePath).extract({
        left: x[column],
        top: y[row],
        width: x[column + 1] - x[column],
        height: y[row + 1] - y[row],
      }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const pixels = Buffer.from(data);
      for (let index = 3; index < pixels.length; index += 4) {
        if (pixels[index] < ALPHA_FLOOR) pixels[index] = 0;
      }

      const components = findOpaqueComponents(pixels, info.width, info.height);
      if (!components[0] || components[0].size < 1000) {
        throw new Error(`${name} row ${row} column ${column} is missing its character pose.`);
      }
      // A generated row can contain fragments from the neighboring row. Retain
      // the character silhouette and discard isolated artifacts in that cell.
      for (const component of components.slice(1)) {
        for (const index of component.pixels) pixels[index * 4 + 3] = 0;
      }
      const bounds = opaqueBounds(pixels, info.width, info.height);
      if (!bounds || bounds.left === 0 || bounds.right === info.width - 1 ||
          bounds.top === 0 || bounds.bottom === info.height - 1) {
        throw new Error(`${name} row ${row} column ${column} touches a crop edge.`);
      }
      const trimmed = await sharp(pixels, {
        raw: { width: info.width, height: info.height, channels: 4 },
      }).extract({
        left: bounds.left,
        top: bounds.top,
        width: bounds.right - bounds.left + 1,
        height: bounds.bottom - bounds.top + 1,
      }).resize(CONTENT_SIZE, CONTENT_SIZE, { fit: 'inside', kernel: 'nearest' })
        .png().toBuffer({ resolveWithObject: true });
      overlays.push({
        input: trimmed.data,
        left: column * CELL_SIZE + Math.floor((CELL_SIZE - trimmed.info.width) / 2),
        top: row * CELL_SIZE + CELL_SIZE - FLOOR_PADDING - trimmed.info.height,
      });
    }
  }

  await mkdir(path.dirname(destinationPath), { recursive: true });
  await sharp({
    create: {
      width: CELL_SIZE * 4,
      height: CELL_SIZE * 2,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite(overlays).png().toFile(destinationPath);
  console.log(`Normalized eight movement poses: ${destinationPath}`);
}

for (const sheet of sheets) await normalizeMovementSheet(sheet);
