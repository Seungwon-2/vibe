import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { clearFloorShadow, cutoutPaleBackground, extractMotionFrame, normalizeMotionFrames } from './build-motion-atlases.mjs';
import { ATLAS_COLUMNS, FRAME_SIZE, MOTION_BANDS, MOTION_SHEETS,
  getMotionCellRect, getMotionFrameDescriptors } from './motion-study-layout.mjs';

test('five source sheets map to 60 unique, bounded cells with a contiguous run row', () => {
  assert.equal(MOTION_SHEETS.length, 5);
  assert.equal(MOTION_BANDS.reduce((sum, band) => sum + band.count, 0), 60);
  assert.equal(ATLAS_COLUMNS, 12);
  assert.equal(FRAME_SIZE, 96);
  for (const sheet of MOTION_SHEETS) {
    const frames = getMotionFrameDescriptors(sheet);
    assert.equal(frames.length, 60);
    assert.equal(new Set(frames.map(({ name }) => name)).size, 60);
    assert.deepEqual(frames.slice(0, 12).map(({ name }) => name),
      Array.from({ length: 12 }, (_, index) => `${sheet.prefix}run-${String(index).padStart(2, '0')}`));
    for (const frame of frames) {
      const { left, top, width, height } = frame.rect;
      assert.ok(left >= 0 && top >= 0 && width > 0 && height > 0, frame.name);
      assert.ok(left + width <= 1536 && top + height <= 1024, frame.name);
    }
  }
  for (const band of MOTION_BANDS) {
    for (let index = 0; index + 1 < band.count; index += 1) {
      const current = getMotionCellRect(band, index);
      const next = getMotionCellRect(band, index + 1);
      assert.ok(current.left + current.width < next.left, `${band.animation}/${index} cells overlap`);
    }
  }
});

test('invalid crop indexes fail before reading outside the source', () => {
  assert.throws(() => getMotionCellRect(MOTION_BANDS[0], 12), RangeError);
  const source = { data: Buffer.alloc(4 * 4 * 4), width: 4, height: 4 };
  assert.throws(() => extractMotionFrame(source, { left: 3, top: 0, width: 2, height: 1 }), RangeError);
});

test('edge flood removes pale background while preserving outlined white costume detail', () => {
  const width = 7;
  const height = 7;
  const data = Buffer.alloc(width * height * 4, 255);
  for (let y = 1; y <= 5; y += 1) {
    for (let x = 1; x <= 5; x += 1) {
      if (x === 1 || x === 5 || y === 1 || y === 5) {
        const index = (y * width + x) * 4;
        data[index] = 25;
        data[index + 1] = 45;
        data[index + 2] = 90;
      }
    }
  }
  const result = cutoutPaleBackground({ data, width, height }, 55);
  assert.equal(result.data[3], 0, 'outer pale background should clear');
  assert.equal(result.data[(3 * width + 3) * 4 + 3], 255, 'outlined white detail should remain');
  assert.equal(result.data[(1 * width + 1) * 4 + 3], 255, 'dark outline should remain');
});

test('floor-shadow cleanup removes a long tinted ellipse and preserves isolated costume color', () => {
  const width = 24;
  const height = 20;
  const data = Buffer.alloc(width * height * 4);
  const paint = (x, y) => {
    const offset = (y * width + x) * 4;
    data.set([212, 199, 241, 255], offset);
  };
  for (let x = 4; x < 20; x += 1) paint(x, 17);
  paint(3, 15);
  clearFloorShadow({ data, width, height }, [212, 199, 241]);
  assert.equal(data[(17 * width + 9) * 4 + 3], 0);
  assert.equal(data[(15 * width + 3) * 4 + 3], 255);
});

test('all poses use one common scale and transparent 96px canvases', async () => {
  const frame = (width, height, label) => ({
    data: Buffer.alloc(width * height * 4, 255), width, height,
    bounds: { left: 0, top: 0, right: width - 1, bottom: height - 1 }, label,
  });
  const [first, second] = await normalizeMotionFrames([frame(40, 60, 'a'), frame(20, 30, 'b')]);
  const one = await sharp(first).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const two = await sharp(second).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(one.info.width, 96);
  assert.equal(one.info.height, 96);
  assert.equal(two.info.width, 96);
  assert.equal(two.info.height, 96);
  const countRows = ({ data, info }) => {
    const rows = new Set();
    for (let y = 0; y < info.height; y += 1) {
      for (let x = 0; x < info.width; x += 1) {
        if (data[(y * info.width + x) * 4 + 3] > 0) rows.add(y);
      }
    }
    return rows;
  };
  assert.equal(countRows(one).size, 60);
  assert.equal(countRows(two).size, 30);
  assert.equal(Math.max(...countRows(one)), 91);
  assert.equal(Math.max(...countRows(two)), 91);
});
