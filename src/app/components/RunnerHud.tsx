import type { CharacterDefinition } from '../../game/characters/characterTypes';
import { getCharacterPassiveId } from '../../game/characters/characterAbilities';
import { RUNNER_GATE_DISTANCES_M } from '../../game/runner/runnerConfig';
import type { RunnerSnapshot } from '../../game/runner/runnerTypes';

export type RunnerHudProps = {
  snapshot: RunnerSnapshot;
  character: CharacterDefinition;
  recentBonus: { id: string; kind: 'pickup' | 'gate'; awardedMs: number } | null;
  onPause(): void;
};

const BIOME_LABELS = {
  'dawn-city': '새벽 도심',
  'moonlit-forest': '달빛 숲길',
  'crystal-mine': '수정 광산',
  'cloud-skyway': '구름 위 하늘길',
} as const;

const PASSIVE_LABELS = {
  'time-pickup': '시간 아이템 보너스',
  'slide-release-grace': '슬라이딩 후 회복 여유',
  'rang-second-jump': '강화된 2단 점프',
  'hiyori-pickup-magnet': '아이템 수집 범위 증가',
  'mary-hit-protection': '충돌 보호 시간 증가',
} as const;

function formatTime(remainingMs: number): string {
  const seconds = Math.ceil(Math.max(0, remainingMs) / 1_000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function RunnerHud({ snapshot, character, recentBonus, onPause }: RunnerHudProps): React.JSX.Element {
  const nextGateIndex = RUNNER_GATE_DISTANCES_M.findIndex((distance) => distance > snapshot.distanceMeters);
  const landmark = nextGateIndex >= 0
    ? `${BIOME_LABELS[snapshot.biomeId]} · 다음 보너스까지 ${Math.ceil(RUNNER_GATE_DISTANCES_M[nextGateIndex] - snapshot.distanceMeters).toLocaleString()}m`
    : BIOME_LABELS[snapshot.biomeId];
  const warning = snapshot.remainingMs <= 10_000;
  const passiveId = getCharacterPassiveId(character.id);
  const showBonus = recentBonus !== null && recentBonus.awardedMs > 0;
  const bonusSeconds = Math.max(1, Math.floor((recentBonus?.awardedMs ?? 0) / 1_000));

  return (
    <div className="runner-hud" aria-label="게임 정보">
      <div className="runner-hud__main">
        <div className={`runner-hud__timer${warning ? ' is-warning' : ''}`} aria-live={warning ? 'polite' : 'off'}>
          <span>남은 시간</span>
          <strong>{formatTime(snapshot.remainingMs)}</strong>
          <span className="runner-hud__gauge" role="progressbar" aria-label="남은 시간"
            aria-valuemin={0} aria-valuemax={120_000} aria-valuenow={snapshot.remainingMs}>
            <span style={{ width: `${Math.max(0, Math.min(100, snapshot.remainingMs / 120_000 * 100))}%` }} />
          </span>
        </div>
        <div className="runner-hud__distance" aria-live="off">
          <strong>{Math.round(snapshot.distanceMeters).toLocaleString()}</strong><span>m</span>
        </div>
        <div className="runner-hud__actions">
          <span className="runner-hud__coins" aria-label={`코인 ${snapshot.coins}개`}>🟡 {snapshot.coins}</span>
          <button className="runner-hud__pause" type="button" aria-label="일시정지" onClick={onPause}>Ⅱ</button>
        </div>
      </div>
      <div className="runner-hud__details">
        <span>{landmark}</span>
        <span className="runner-hud__passive">{character.displayName} · {PASSIVE_LABELS[passiveId]}</span>
      </div>
      {showBonus && (
        <span key={recentBonus.id} className="runner-hud__bonus" role="status">
          +{bonusSeconds}초
        </span>
      )}
    </div>
  );
}
