import { useId } from 'react';
import { getBiomeById } from '../../game/visuals/runnerBiomes';
import type { RunnerBiomeId } from '../../game/runner/runnerTypes';

export type StageBackdropPreviewProps = Readonly<{
  biomeId: RunnerBiomeId;
  stageName: string;
}>;

function toHex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

function DawnCityScene({ far, middle, accent }: { far: string; middle: string; accent: string }): React.JSX.Element {
  return <>
    <circle cx="500" cy="63" r="30" fill={accent} opacity=".75" />
    <path d="M0 164 58 134l36 20 48-54 42 49 58-28 47 44 52-65 55 49 51-26 43 39 65-50 85 44v68H0Z" fill={far} opacity=".78" />
    <path d="M0 172h34v-44h29v44h20v-69h37v69h22v-37h36v37h23v-58h48v58h21v-82h40v82h23v-48h36v48h24v-72h46v72h22v-49h38v49h20v-66h46v66h28v58H0Z" fill={middle} opacity=".9" />
    <path d="M0 190q110-23 214 2t212 0 214 0v28H0Z" fill={far} opacity=".72" />
    <path d="M42 157h4v4h-4zm34-10h4v4h-4zm90 21h4v4h-4zm73-48h4v4h-4zm79 35h4v4h-4zm108-32h4v4h-4zm67 43h4v4h-4z" fill={accent} opacity=".8" />
  </>;
}

function MoonlitForestScene({ far, middle, accent }: { far: string; middle: string; accent: string }): React.JSX.Element {
  return <>
    <circle cx="488" cy="59" r="26" fill={accent} opacity=".82" />
    <circle cx="498" cy="51" r="25" fill={far} />
    <path d="M0 174q90-47 180-4t190-6 270 4v52H0Z" fill={far} opacity=".72" />
    {[28, 118, 224, 342, 456, 570].map((x, index) => <g key={x} opacity={index % 2 ? '.78' : '.95'}>
      <path d={`M${x} 190 ${x + 27} ${102 + (index % 3) * 13} ${x + 54} 190Z`} fill={middle} />
      <path d={`M${x + 8} 166 ${x + 27} ${116 + (index % 3) * 13} ${x + 46} 166Z`} fill={far} />
      <rect x={x + 24} y="184" width="7" height="23" rx="3" fill={middle} />
    </g>)}
    <path d="M0 203q100-22 205 0t213 0 222 0v17H0Z" fill={accent} opacity=".35" />
    <circle cx="112" cy="60" r="2" fill={accent} /><circle cx="215" cy="40" r="2" fill={accent} />
    <circle cx="389" cy="92" r="2" fill={accent} /><circle cx="570" cy="54" r="2" fill={accent} />
  </>;
}

function CrystalMineScene({ far, middle, accent }: { far: string; middle: string; accent: string }): React.JSX.Element {
  return <>
    <path d="M0 161 74 102l54 56 75-87 63 83 73-105 77 109 65-71 75 58 64-38v113H0Z" fill={far} opacity=".68" />
    <path d="M0 184 80 145l56 43 78-65 72 58 81-76 69 76 70-52 67 49 67-32v42H0Z" fill={middle} opacity=".82" />
    <g stroke={accent} strokeWidth="3" strokeLinejoin="round">
      <path d="m104 204 25-61 27 61-27-14Z" fill={accent} opacity=".75" />
      <path d="m255 204 33-82 35 82-35-19Z" fill={accent} opacity=".68" />
      <path d="m440 204 23-55 28 55-28-13Z" fill={accent} opacity=".72" />
      <path d="m532 204 18-42 21 42-21-10Z" fill={far} opacity=".92" />
    </g>
    <circle cx="176" cy="68" r="4" fill={accent} opacity=".6" />
    <circle cx="390" cy="52" r="3" fill={accent} opacity=".72" />
    <path d="M0 207q140-20 280 0t360 0v13H0Z" fill={far} opacity=".8" />
  </>;
}

function CloudSkywayScene({ far, middle, accent }: { far: string; middle: string; accent: string }): React.JSX.Element {
  return <>
    <circle cx="512" cy="55" r="26" fill={accent} opacity=".85" />
    <path d="M20 90c0-13 11-23 24-23 8-19 36-18 43 2 15-2 25 9 25 21 0 13-11 22-26 22H47C31 112 20 103 20 90Zm359-21c0-12 10-21 23-21 9-20 37-17 43 3 15-2 25 8 25 20 0 13-11 22-26 22h-38c-16 0-27-10-27-24Z" fill="#fff" opacity=".76" />
    <path d="M0 165q105-35 213 0t211 0 216-5v60H0Z" fill={far} opacity=".78" />
    <path d="M62 190q32-25 64 0v13H62Zm194-17q44-33 88 0v18h-88Zm224 13q34-28 69 0v14h-69Z" fill={middle} />
    <path d="M76 190h36v8H76Zm204-17h40v10h-40Zm213 13h32v9h-32Z" fill={accent} opacity=".8" />
    <path d="M0 207q125-12 250 0t390 0v13H0Z" fill={middle} opacity=".74" />
    <path d="m171 63 3-8 3 8 8 3-8 3-3 8-3-8-8-3Zm244 29 2-6 2 6 6 2-6 2-2 6-2-6-6-2Z" fill="#fff" opacity=".8" />
  </>;
}

export function StageBackdropPreview({ biomeId, stageName }: StageBackdropPreviewProps): React.JSX.Element {
  const biome = getBiomeById(biomeId);
  const gradientId = `stage-preview-${useId().replaceAll(':', '')}`;
  const colors = {
    sky: toHex(biome.palette.sky),
    far: toHex(biome.palette.far),
    middle: toHex(biome.palette.middle),
    ground: toHex(biome.palette.ground),
    accent: toHex(biome.palette.accent),
  };
  const sceneProps = { far: colors.far, middle: colors.middle, accent: colors.accent };

  return (
    <svg className={`stage-scene stage-scene--${biomeId}`} viewBox="0 0 640 220" preserveAspectRatio="xMidYMid slice"
      role="img" aria-label={`${stageName} 배경 미리보기`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={colors.sky} />
          <stop offset="1" stopColor={colors.ground} />
        </linearGradient>
      </defs>
      <rect width="640" height="220" fill={`url(#${gradientId})`} />
      {biomeId === 'dawn-city' && <DawnCityScene {...sceneProps} />}
      {biomeId === 'moonlit-forest' && <MoonlitForestScene {...sceneProps} />}
      {biomeId === 'crystal-mine' && <CrystalMineScene {...sceneProps} />}
      {biomeId === 'cloud-skyway' && <CloudSkywayScene {...sceneProps} />}
      <path d="M0 206q160-8 320 0t320 0v14H0Z" fill={colors.ground} opacity=".92" />
    </svg>
  );
}
