import rangAtlasUrl from '../../../assets/character/runtime/cogane-rang.png?url';
import rangManifest from '../../../assets/character/runtime/cogane-rang.json';
import rangPortraitUrl from '../../../assets/character/portraits/cogane-rang-portrait.png?url';
import hiyoriAtlasUrl from '../../../assets/character/runtime/hanayo-hiyori.png?url';
import hiyoriManifest from '../../../assets/character/runtime/hanayo-hiyori.json';
import hiyoriPortraitUrl from '../../../assets/character/portraits/hanayo-hiyori-portrait.png?url';
import maryAtlasUrl from '../../../assets/character/runtime/tokino-mary.png?url';
import maryManifest from '../../../assets/character/runtime/tokino-mary.json';
import maryPortraitUrl from '../../../assets/character/portraits/tokino-mary-portrait.png?url';
import rinAtlasUrl from '../../../assets/character/runtime/player-default.png?url';
import rinManifest from '../../../assets/character/runtime/player-default.json';
import rinPortraitUrl from '../../../assets/character/portraits/aokumo-rin-portrait.png?url';
import toaAtlasUrl from '../../../assets/character/runtime/goth-student.png?url';
import toaManifest from '../../../assets/character/runtime/goth-student.json';
import toaPortraitUrl from '../../../assets/character/portraits/shizuki-toa-portrait.png?url';
import type { RuntimeAtlasManifest } from './characterTypes';

export const CHARACTER_ATLASES = {
  'player-default': {
    atlasUrl: rinAtlasUrl,
    atlasManifest: rinManifest as RuntimeAtlasManifest,
    portraitUrl: rinPortraitUrl,
  },
  'goth-student': {
    atlasUrl: toaAtlasUrl,
    atlasManifest: toaManifest as RuntimeAtlasManifest,
    portraitUrl: toaPortraitUrl,
  },
  'cogane-rang': {
    atlasUrl: rangAtlasUrl,
    atlasManifest: rangManifest as RuntimeAtlasManifest,
    portraitUrl: rangPortraitUrl,
  },
  'hanayo-hiyori': {
    atlasUrl: hiyoriAtlasUrl,
    atlasManifest: hiyoriManifest as RuntimeAtlasManifest,
    portraitUrl: hiyoriPortraitUrl,
  },
  'tokino-mary': {
    atlasUrl: maryAtlasUrl,
    atlasManifest: maryManifest as RuntimeAtlasManifest,
    portraitUrl: maryPortraitUrl,
  },
} as const;
