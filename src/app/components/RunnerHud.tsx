import type { CharacterDefinition } from '../../game/characters/characterTypes';
import { getCharacterPassive } from '../../game/characters/characterAbilities';
import { CharacterAbilityIcon } from './CharacterAbilityIcon';
import { RUNNER_GATE_DISTANCES_M } from '../../game/runner/runnerConfig';
import type { RunnerSnapshot } from '../../game/runner/runnerTypes';

export type RunnerHudProps = {
  snapshot: RunnerSnapshot;
  character: CharacterDefinition;
  recentBonus: RunnerHudCue | null;
  onPause(): void;
};

export type RunnerHudCue =
  | Readonly<{ id: string; kind: 'pickup' | 'gate'; awardedMs: number }>
  | Readonly<{ id: string; kind: 'passive-triggered'; passiveId: 'hiyori-guard'; remainingCharges: number; trigger: 'obstacle' | 'pit' }>
  | Readonly<{ id: string; kind: 'passive-triggered'; passiveId: 'toa-ghost-glide'; remainingCharges: 0; trigger: 'slide' }>;

const BIOME_LABELS = {
  'dawn-city': '새벽 도심',
  'moonlit-forest': '달빛 숲길',
  'crystal-mine': '수정 광산',
  'cloud-skyway': '구름 위 하늘길',
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
  const passive = getCharacterPassive(character.id);
  const showBonus = recentBonus !== null && (recentBonus.kind === 'passive-triggered' || recentBonus.awardedMs > 0);
  const bonusSeconds = recentBonus && recentBonus.kind !== 'passive-triggered'
    ? Math.max(1, Math.floor(recentBonus.awardedMs / 1_000)) : 0;
  const passiveCue = recentBonus?.kind === 'passive-triggered'
    ? recentBonus.passiveId === 'toa-ghost-glide'
      ? `${passive.name} · 장애물 통과 · 재사용 대기`
      : `${passive.name} · ${recentBonus.trigger === 'pit' ? '낭떠러지' : '장애물'} 방어 · 남은 ${recentBonus.remainingCharges}회`
    : null;

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
        <span className="runner-hud__passive" style={{ '--character-accent': character.accentColor } as React.CSSProperties}>
          {passive.icon && <CharacterAbilityIcon icon={passive.icon} accentColor={character.accentColor} size={28} />}
          <span><strong>{passive.name}</strong><small>{passive.effectLabel}</small></span>
          {passive.id === 'hiyori-guard' && <span className="runner-hud__charges"
            role="img" aria-label={`남은 방어 ${snapshot.passiveChargesRemaining}회`}>
            {[0, 1].map((charge) => <i key={charge} className={charge < snapshot.passiveChargesRemaining ? 'is-ready' : ''} />)}
          </span>}
          {passive.id === 'toa-ghost-glide' && snapshot.slideGuardCooldownRemainingMs > 0 &&
            <small className="runner-hud__cooldown">{Math.ceil(snapshot.slideGuardCooldownRemainingMs / 1_000)}초</small>}
        </span>
      </div>
      {showBonus && (
        <span key={recentBonus.id} className={`runner-hud__bonus${passiveCue ? ' is-passive-cue' : ''}`} role="status">
          {passiveCue ?? `+${bonusSeconds}초`}
        </span>
      )}
    </div>
  );
}
