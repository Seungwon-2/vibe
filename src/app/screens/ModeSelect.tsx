import type { RunnerMode } from '../../game/runner/runnerTypes';

export type ModeSelectProps = {
  onSelect(mode: RunnerMode): void;
  onBack(): void;
};

export function ModeSelect({ onSelect, onBack }: ModeSelectProps): React.JSX.Element {
  return (
    <main className="progression-screen">
      <section className="progression-panel" aria-labelledby="mode-select-title">
        <button className="progression-back" type="button" onClick={onBack}>← 타이틀</button>
        <p className="eyebrow">CHOOSE YOUR JOURNEY</p>
        <h1 id="mode-select-title">어떤 모험을 할까요?</h1>
        <p className="progression-intro">기록에 도전하거나, 네 가지 테마의 코스를 완주해 보세요.</p>
        <div className="mode-options">
          <button className="mode-option" type="button" onClick={() => onSelect('endless')}>
            <span className="mode-option__icon" aria-hidden="true">∞</span>
            <strong>끝없는 달리기</strong>
            <span>90초 동안 더 먼 거리와 코인 기록에 도전합니다.</span>
          </button>
          <button className="mode-option" type="button" onClick={() => onSelect('story')}>
            <span className="mode-option__icon" aria-hidden="true">✦</span>
            <strong>스토리 스테이지</strong>
            <span>세 번의 생명으로 정해진 코스를 완주하고 러너를 해금합니다.</span>
          </button>
        </div>
        <button className="progression-secondary" type="button" onClick={onBack}>뒤로</button>
      </section>
    </main>
  );
}
