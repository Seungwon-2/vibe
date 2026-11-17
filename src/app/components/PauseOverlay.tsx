import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { RunnerVisualMode } from '../../game/runner/runnerVisualPreferences';

export type PauseOverlayProps = {
  onResume(): void;
  onExit(): void;
  onOpenAudioSettings(): void;
  onOpenGuide(): void;
  portrait: boolean;
  guideButtonRef?: RefObject<HTMLButtonElement | null>;
  visualMode?: RunnerVisualMode;
  reducedMotion?: boolean;
  onVisualModeChange?(mode: RunnerVisualMode): void;
};

export function PauseOverlay({ onResume, onExit, onOpenAudioSettings, onOpenGuide, portrait, guideButtonRef,
  visualMode = 'calm', reducedMotion = false, onVisualModeChange }: PauseOverlayProps): React.JSX.Element {
  const resumeButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { resumeButtonRef.current?.focus(); }, []);

  function handleActionNavigation(event: React.KeyboardEvent<HTMLDivElement>): void {
    const direction = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];
    if (!direction || !(event.target instanceof HTMLButtonElement)) return;

    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
    const current = event.target.getBoundingClientRect();
    const currentX = current.left + current.width / 2;
    const currentY = current.top + current.height / 2;
    const [dx, dy] = direction;
    const next = buttons
      .filter((button) => button !== event.target)
      .map((button) => {
        const rect = button.getBoundingClientRect();
        const offsetX = rect.left + rect.width / 2 - currentX;
        const offsetY = rect.top + rect.height / 2 - currentY;
        const primary = dx ? offsetX * dx : offsetY * dy;
        const cross = dx ? Math.abs(offsetY) : Math.abs(offsetX);
        return { button, primary, cross };
      })
      .filter(({ primary }) => primary > 0)
      .sort((a, b) => (a.primary + a.cross * 2) - (b.primary + b.cross * 2))[0]?.button;

    if (!next) return;
    event.preventDefault();
    next.focus();
  }

  return (
    <div className={`runner-overlay runner-overlay--pause${portrait ? ' is-portrait' : ''}`} role="dialog"
      aria-modal="true" aria-labelledby="runner-pause-title">
      <div className="runner-pause-card">
        <strong id="runner-pause-title">{portrait ? '화면을 가로로 돌려 주세요' : '일시 정지'}</strong>
        <p>{portrait ? '가로 화면으로 바꾸면 계속할 수 있어요.' : '잠시 쉬었다가 계속할 수 있어요.'}</p>
        {onVisualModeChange && <div className="runner-visual-settings">
          <label htmlFor="runner-visual-mode">화면 효과</label>
          <select id="runner-visual-mode" value={visualMode}
            onChange={(event) => onVisualModeChange(event.target.value as RunnerVisualMode)}>
            <option value="calm">편안한 화면 (기본)</option>
            <option value="standard">기존 효과 (비교용)</option>
          </select>
          <small>{reducedMotion ? '기기의 동작 줄이기 설정에 따라 편안한 화면을 적용합니다.'
            : '배경과 장식 효과만 바뀝니다. 속도·판정·기록은 같습니다.'}</small>
        </div>}
        <div className="runner-result-actions" onKeyDown={handleActionNavigation}>
          <button ref={resumeButtonRef} type="button" onClick={onResume} disabled={portrait}>계속하기</button>
          <button ref={guideButtonRef} type="button" onClick={onOpenGuide} disabled={portrait}>설명서 보기</button>
          <button type="button" onClick={onOpenAudioSettings} disabled={portrait}>사운드 설정</button>
          <button type="button" onClick={onExit}>나가기</button>
        </div>
      </div>
    </div>
  );
}
