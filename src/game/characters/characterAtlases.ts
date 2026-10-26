import akaneAtlasUrl from '../../../assets/character/runtime/akane-lize.png?url';
import akaneManifest from '../../../assets/character/runtime/akane-lize.json';
import akanePortraitUrl from '../../../assets/character/portraits/akane-lize-portrait.png?url';
import rinAtlasUrl from '../../../assets/character/runtime/player-default.png?url';
import rinManifest from '../../../assets/character/runtime/player-default.json';
import rinPortraitUrl from '../../../assets/character/portraits/aokumo-rin-portrait.png?url';
import toaAtlasUrl from '../../../assets/character/runtime/goth-student.png?url';
import toaManifest from '../../../assets/character/runtime/goth-student.json';
import toaPortraitUrl from '../../../assets/character/portraits/shizuki-toa-portrait.png?url';
import yuniAtlasUrl from '../../../assets/character/runtime/moonwing.png?url';
import yuniManifest from '../../../assets/character/runtime/moonwing.json';
import yuniPortraitUrl from '../../../assets/character/portraits/ayatsuno-yuni-portrait.png?url';
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
  moonwing: {
    atlasUrl: yuniAtlasUrl,
    atlasManifest: yuniManifest as RuntimeAtlasManifest,
    portraitUrl: yuniPortraitUrl,
  },
  'akane-lize': {
    atlasUrl: akaneAtlasUrl,
    atlasManifest: akaneManifest as RuntimeAtlasManifest,
    portraitUrl: akanePortraitUrl,
  },
} as const;
