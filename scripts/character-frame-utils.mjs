export function resolveFrameRect(frame, source) {
  const rect = frame.rect ?? {
    left: frame.column * (source.width / source.columns),
    top: source.rowBoundaries[frame.row],
    width: source.width / source.columns,
    height: source.rowBoundaries[frame.row + 1] - source.rowBoundaries[frame.row],
  };
  if (!Object.values(rect).every(Number.isInteger) || rect.left < 0 || rect.top < 0 ||
      rect.width <= 0 || rect.height <= 0 || rect.left + rect.width > source.width ||
      rect.top + rect.height > source.height) {
    throw new Error(`Frame "${frame.name}" has a crop outside ${source.path}.`);
  }
  return rect;
}

export function opaqueBounds(data, width, height) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  return right < left ? null : { left, top, right, bottom };
}

export function findOpaqueComponents(data, width, height) {
  const visited = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  const components = [];
  for (let start = 0; start < visited.length; start += 1) {
    if (visited[start] || data[start * 4 + 3] === 0) continue;
    let head = 0;
    let tail = 0;
    let left = width;
    let top = height;
    let right = -1;
    let bottom = -1;
    const pixels = [];
    visited[start] = 1;
    queue[tail++] = start;
    while (head < tail) {
      const index = queue[head++];
      const x = index % width;
      const y = Math.floor(index / width);
      pixels.push(index);
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const next = ny * width + nx;
          if (visited[next] || data[next * 4 + 3] === 0) continue;
          visited[next] = 1;
          queue[tail++] = next;
        }
      }
    }
    components.push({ size: tail, left, top, right, bottom, pixels });
  }
  return components.sort((a, b) => b.size - a.size);
}

export function clearSmallDetachedComponents(data, width, height, {
  minComponentPixels = 0,
  mainPadding = 8,
  keepComponents = [],
} = {}) {
  const components = findOpaqueComponents(data, width, height);
  const main = components[0];
  if (!main || minComponentPixels <= 0) return { components, removed: [] };
  const removed = [];
  components.slice(1).forEach((component) => {
    const retainedByOverride = keepComponents.some((bounds) =>
      component.left >= bounds.left && component.top >= bounds.top &&
      component.right <= bounds.right && component.bottom <= bounds.bottom);
    const nearMain = component.left <= main.right + mainPadding &&
      component.right >= main.left - mainPadding &&
      component.top <= main.bottom + mainPadding &&
      component.bottom >= main.top - mainPadding;
    if (component.size >= minComponentPixels || nearMain || retainedByOverride) return;
    component.pixels.forEach((index) => { data[index * 4 + 3] = 0; });
    removed.push({ ...component, pixels: undefined });
  });
  return { components: findOpaqueComponents(data, width, height), removed };
}

export function getAlignedOffset(bounds, frameWidth, frameHeight, anchor, floorPadding = 4) {
  const width = bounds.right - bounds.left + 1;
  const height = bounds.bottom - bounds.top + 1;
  const left = Math.floor((frameWidth - width) / 2) - bounds.left;
  const top = anchor === 'feet'
    ? frameHeight - floorPadding - 1 - bounds.bottom
    : Math.floor((frameHeight - height) / 2) - bounds.top;
  if (left + bounds.left < 0 || top + bounds.top < 0 ||
      left + bounds.right >= frameWidth || top + bounds.bottom >= frameHeight) {
    throw new Error(`Aligned artwork exceeds the ${frameWidth}x${frameHeight} frame.`);
  }
  return { left, top };
}
