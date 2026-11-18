import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const sourceDirectory = new URL('../assets/character/reference/stellive_sd_masters_512x512/', import.meta.url);
const outputDirectory = new URL('../public/assets/character/selector-art/roster/', import.meta.url);
const sourceSize = 512;
const faceSize = 176;
const padding = 8;

const portraits = [
  { id: 'player-default', source: '01_aokumo_rin_master.png', left: 159, top: 97 },
  { id: 'hanayo-hiyori', source: '06_hanayo_hiyori_master.png', left: 168, top: 114 },
  { id: 'tokino-mary', source: '08_tokino_merry_master.png', left: 168, top: 102 },
  { id: 'goth-student', source: '02_shizuki_toa_master.png', left: 168, top: 103 },
  { id: 'cogane-rang', source: '07_kogane_rang_master.png', left: 166, top: 100 },
];

const upcomingPortraits = [
  { source: '03_ayatsuno_yuni_master.png', left: 165, top: 98 },
  { source: '04_tenko_shibuki_master.png', left: 169, top: 79 },
  { source: '05_hanako_nana_master.png', left: 168, top: 98 },
  { source: '09_yuzuha_riko_master.png', left: 167, top: 77 },
  { source: '10_sakihane_fuya_master.png', left: 164, top: 91 },
  { source: '11_shirayuki_hina_master.png', left: 167, top: 102 },
  { source: '12_neneko_mashiro_master.png', left: 166, top: 92 },
  { source: '13_akane_rize_master.png', left: 168, top: 97 },
  { source: '14_arahashi_tabi_master.png', left: 169, top: 97 },
  { source: '15_airi_kanna_master.png', left: 170, top: 87 },
];

function getFullCrop(pixels, width, height, channels) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * channels + channels - 1] === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < 0) throw new Error('이미지에 보이는 픽셀이 없습니다.');
  left = Math.max(0, left - padding);
  top = Math.max(0, top - padding);
  right = Math.min(width - 1, right + padding);
  bottom = Math.min(height - 1, bottom + padding);
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

async function buildPortrait({ id, source, left, top }) {
  try {
    const image = sharp(await readFile(new URL(source, sourceDirectory)));
    const { format, width, height, hasAlpha } = await image.metadata();
    if (format !== 'png' || width !== sourceSize || height !== sourceSize || !hasAlpha) {
      throw new Error('512×512 PNG와 알파 채널이 필요합니다.');
    }
    if (left < 0 || top < 0 || left + faceSize > width || top + faceSize > height) {
      throw new Error('얼굴 자르기 영역이 원본 밖에 있습니다.');
    }

    const { data, info } = await image.clone().raw().toBuffer({ resolveWithObject: true });
    const crops = {
      face: { left, top, width: faceSize, height: faceSize },
      full: getFullCrop(data, width, height, info.channels),
    };
    return await Promise.all(Object.entries(crops).map(async ([kind, crop]) => ({
      name: `${id}-${kind}.webp`,
      bytes: await image.clone().extract(crop).webp({ lossless: true }).toBuffer(),
    })));
  } catch (error) {
    throw new Error(`${source}: ${error.message}`, { cause: error });
  }
}

async function buildSilhouette({ source, left, top }, index) {
  const { data, info: { width, height, channels } } = await sharp(await readFile(new URL(source, sourceDirectory)))
    .extract({ left, top, width: faceSize, height: faceSize })
    .toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let offset = 0; offset < data.length; offset += channels) {
    data[offset] = 22;
    data[offset + 1] = 24;
    data[offset + 2] = 31;
  }
  const bytes = await sharp(data, { raw: { width, height, channels } }).webp({ lossless: true }).toBuffer();
  return { name: `upcoming-${index + 1}.webp`, bytes };
}

async function main(check, includeUpcoming) {
  const outputs = (await Promise.all(portraits.map(buildPortrait))).flat();
  if (includeUpcoming) outputs.push(...await Promise.all(upcomingPortraits.map(buildSilhouette)));
  if (!check) await mkdir(outputDirectory, { recursive: true });
  for (const { name, bytes } of outputs) {
    const target = new URL(name, outputDirectory);
    if (check) {
      const existing = await readFile(target);
      if (!existing.equals(bytes)) throw new Error(`${fileURLToPath(target)}: 생성 결과와 다릅니다.`);
    } else {
      await writeFile(target, bytes);
    }
  }
  console.log(`선택창 이미지 ${outputs.length}개 ${check ? '검증' : '생성'} 완료`);
}

main(process.argv.includes('--check'), process.argv.includes('--upcoming')).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
