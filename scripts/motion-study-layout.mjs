/** @typedef {{left:number,top:number,width:number,height:number}} Rect */
/** @typedef {{sourceLabel:string,animation:string,left:number,right:number,top:number,bottom:number,count:number}} MotionBand */
/** @typedef {{id:string,slug:string,prefix:string,sourcePath:string,spriteDir?:string,accentColor:string,backgroundTolerance:number,shadowRgb:[number,number,number],bandTops?:Record<string,number>,cropOverrides?:Record<string,Rect>,keepComponents?:Record<string,Rect[]>}} MotionSheet */

export const FRAME_SIZE = 96;
export const ATLAS_COLUMNS = 12;
export const CONTENT_SIZE = 88;

/** @type {readonly MotionSheet[]} */
export const MOTION_SHEETS = Object.freeze([
  { id: 'player-default', slug: 'aokumo-rin', prefix: '', sourcePath: 'assets/character/reference/aokumo-rin-motion-study.png', spriteDir: 'assets/character/reference/aokumo-rin-sprite', accentColor: '#2b66c0', backgroundTolerance: 55, shadowRgb: [205, 218, 244] },
  { id: 'goth-student', slug: 'shizuki-toa', prefix: 'goth-student-', sourcePath: 'assets/character/reference/shizuki-toa-motion-study.png', accentColor: '#513661', backgroundTolerance: 54, shadowRgb: [212, 199, 241], bandTops: { victory: 528, 'game-over': 528, idle: 688, start: 688 } },
  { id: 'cogane-rang', slug: 'cogane-rang', prefix: 'cogane-rang-', sourcePath: 'assets/character/reference/cogane-rang-motion-study.png', accentColor: '#c98743', backgroundTolerance: 55, shadowRgb: [228, 214, 204], bandTops: { idle: 683, start: 683 } },
  { id: 'hanayo-hiyori', slug: 'hanayo-hiyori', prefix: 'hanayo-hiyori-', sourcePath: 'assets/character/reference/hanayo-hiyori-motion-study.png', spriteDir: 'assets/character/reference/hanayo-hiyori-sprite', accentColor: '#fca6d0', backgroundTolerance: 58, shadowRgb: [219, 208, 220], bandTops: { idle: 687 } },
  { id: 'tokino-mary', slug: 'tokino-mary', prefix: 'tokino-mary-', sourcePath: 'assets/character/reference/tokino-mary-motion-study.png', spriteDir: 'assets/character/reference/tokino-mary-sprite', accentColor: '#6d929a', backgroundTolerance: 55, shadowRgb: [192, 210, 214], bandTops: { hurt: 228, slide: 228, jump: 378, 'double-jump': 378, victory: 528, 'game-over': 528, idle: 670, start: 670 } },
]);

/** @type {readonly MotionBand[]} */
export const MOTION_BANDS = Object.freeze([
  { sourceLabel: 'RUN', animation: 'run', left: 69, right: 1525, top: 65, bottom: 205, count: 12 },
  { sourceLabel: 'HIT', animation: 'hurt', left: 69, right: 746, top: 237, bottom: 362, count: 6 },
  { sourceLabel: 'SLIDE', animation: 'slide', left: 808, right: 1525, top: 237, bottom: 362, count: 6 },
  { sourceLabel: 'JUMP', animation: 'jump', left: 69, right: 746, top: 393, bottom: 519, count: 6 },
  { sourceLabel: 'DOUBLE JUMP', animation: 'double-jump', left: 808, right: 1525, top: 393, bottom: 519, count: 6 },
  { sourceLabel: 'VICTORY', animation: 'victory', left: 69, right: 746, top: 548, bottom: 674, count: 6 },
  { sourceLabel: 'CRY', animation: 'game-over', left: 808, right: 1525, top: 548, bottom: 674, count: 6 },
  { sourceLabel: 'IDLE', animation: 'idle', left: 69, right: 746, top: 701, bottom: 828, count: 6 },
  { sourceLabel: 'CHEER', animation: 'start', left: 808, right: 1525, top: 701, bottom: 828, count: 6 },
]);

/** @param {MotionBand} band @param {number} index @returns {Rect} */
export function getMotionCellRect(band, index) {
  if (!Number.isInteger(index) || index < 0 || index >= band.count) {
    throw new RangeError(`${band.animation} frame index ${index} is outside 0..${band.count - 1}.`);
  }
  const left = Math.floor(band.left + index * (band.right - band.left) / band.count) + 2;
  const right = Math.floor(band.left + (index + 1) * (band.right - band.left) / band.count) - 2;
  return { left, top: band.top, width: right - left, height: band.bottom - band.top };
}

/** @param {MotionSheet} sheet @param {string} animation @param {number} index */
export function getMotionFrameName(sheet, animation, index) {
  return `${sheet.prefix}${animation}-${String(index).padStart(2, '0')}`;
}

export function getMotionFrameDescriptors(sheet) {
  return MOTION_BANDS.flatMap((band) => Array.from({ length: band.count }, (_, index) => {
    const name = getMotionFrameName(sheet, band.animation, index);
    const cell = getMotionCellRect(band, index);
    const top = sheet.bandTops?.[band.animation] ?? cell.top;
    return {
      name,
      animation: band.animation,
      index,
      rect: sheet.cropOverrides?.[name] ?? { ...cell, top, height: band.bottom - top },
    };
  }));
}
