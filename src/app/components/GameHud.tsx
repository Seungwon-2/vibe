import type { RunStateSnapshot } from '../../game/systems/RunState';

type GameHudProps = {
  stageName: string;
  state: RunStateSnapshot | null;
  timeRemainingMs: number | null;
  effectRemainingMs: number;
  paused: boolean;
  onTogglePause: () => void;
  onExit: () => void;
};

export function GameHud({ stageName, state, timeRemainingMs, effectRemainingMs, paused, onTogglePause, onExit }: GameHudProps): React.JSX.Element {
  const timer = timeRemainingMs === null ? null : Math.ceil(timeRemainingMs / 1_000);
  return (
    <header className="game-hud" aria-label="게임 상태">
      <div><span className="hud-label">스테이지</span><strong>{stageName}</strong></div>
      <div><span className="hud-label">라이프</span><strong>♥ {state?.lives ?? 5}</strong></div>
      <div><span className="hud-label">점수</span><strong>{state?.stageScore ?? 0}</strong></div>
      <div><span className="hud-label">코인</span><strong>{state?.coins ?? 0}</strong></div>
      {timer !== null && <div className={timer <= 20 ? 'timer-warning' : ''}><span className="hud-label">남은 시간</span><strong>{Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</strong></div>}
      {effectRemainingMs > 0 && <div><span className="hud-label">속도 효과</span><strong>{(effectRemainingMs / 1_000).toFixed(1)}초</strong></div>}
      <div className="hud-actions"><button onClick={onTogglePause}>{paused ? '계속' : '일시 정지'}</button><button onClick={onExit}>나가기</button></div>
    </header>
  );
}
