import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const CELL_SIZE = 256;
const CONTENT_SIZE = 208;
const ALPHA_FLOOR = 96;

const sheets = [
  {
    source: 'assets/character/source/aokumo-rin-generated.png',
    destination: 'assets/character/aokumo-rin-spritesheet-v4.png',
    x: [0, 247, 508, 759, 1024],
    y: [0, 262, 510, 752, 1011, 1267, 1536],
  },
  {
    source: 'assets/character/source/shizuki-toa-generated.png',
    destination: 'assets/character/goth-student-spritesheet-v2.png',
    x: [0, 257, 505, 753, 1024],
    y: [0, 276, 526, 764, 1009, 1254, 1536],
  },
  {
    source: 'assets/character/source/ayatsuno-yuni-generated.png',
    destination: 'assets/character/moonwing-spritesheet-v2.png',
    x: [0, 256, 512, 768, 1024],
    xByRow: { 5: [0, 256, 512, 772, 1024] },
    y: [0, 255, 507, 747, 1010, 1253, 1536],
  },
  {
    source: 'assets/character/source/akane-lize-generated.png',
    destination: 'assets/character/akane-lize-spritesheet.png',
    x: [0, 256, 512, 768, 1024],
    xByRow: {
      4: [0, 262, 512, 768, 1024],
      5: [0, 247, 512, 779, 1024],
    },
    y: [0, 271, 519, 764, 1002, 1258, 1536],
    yByColumn: {
      0: [0, 271, 519, 767, 1009, 1258, 1536],
      1: [0, 271, 519, 764, 1015, 1280, 1536],
      2: [0, 271, 518, 768, 1024, 1280, 1536],
      3: [0, 271, 519, 768, 997, 1280, 1536],
    },
  },
];

function visibleBounds(data, width, height) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      if (data[index + 3] < ALPHA_FLOOR) {
        data[index + 3] = 0;
        continue;
      }
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left) throw new Error('Generated cell contains no visible pose.');
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

async function normalizeSheet({ source, destination, x, xByRow = {}, y, yByColumn = {} }) {
  const input = path.join(root, source);
  const metadata = await sharp(input).metadata();
  if (metadata.width !== 1024 || metadata.height !== 1536) {
    throw new Error(`${source} must be 1024x1536.`);
  }

  const overlays = [];
  for (let row = 0; row < 6; row++) {
    const rowX = xByRow[row] ?? x;
    for (let column = 0; column < 4; column++) {
      const columnY = yByColumn[column] ?? y;
      const { data, info } = await sharp(input).extract({
        left: rowX[column],
        top: columnY[row],
        width: rowX[column + 1] - rowX[column],
        height: columnY[row + 1] - columnY[row],
      }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const pixels = Buffer.from(data);
      const bounds = visibleBounds(pixels, info.width, info.height);
      const trimmed = await sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } })
        .extract(bounds)
        .resize(CONTENT_SIZE, CONTENT_SIZE, { fit: 'inside', kernel: 'nearest' })
        .png()
        .toBuffer({ resolveWithObject: true });
      overlays.push({
        input: trimmed.data,
        left: column * CELL_SIZE + Math.floor((CELL_SIZE - trimmed.info.width) / 2),
        top: row * CELL_SIZE + Math.floor((CELL_SIZE - trimmed.info.height) / 2),
      });
    }
  }

  await sharp({
    create: {
      width: CELL_SIZE * 4,
      height: CELL_SIZE * 6,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite(overlays).png().toFile(path.join(root, destination));
  console.log(`Normalized 24 poses: ${destination}`);
}

for (const sheet of sheets) await normalizeSheet(sheet);
