import type { RunnerMode } from '../../game/runner/runnerTypes';

export type ModeSelectProps = {
  onSelect(mode: RunnerMode): void;
  onBack(): void;
};

export function ModeSelect({ onSelect, onBack }: ModeSelectProps): React.JSX.Element {
  return (
    <main className="progression-screen">
      <section className="progression-panel progression-panel--mode" aria-labelledby="mode-select-title">
        <button className="progression-back" type="button" onClick={onBack}>← 타이틀</button>
        <p className="eyebrow">CHOOSE YOUR JOURNEY</p>
        <h1 id="mode-select-title">어떤 모험을 할까요?</h1>
        <p className="progression-intro">기록에 도전하거나, 네 가지 테마의 코스를 완주해 보세요.</p>
        <div className="mode-options">
          <button className="mode-option mode-option--endless" type="button" onClick={() => onSelect('endless')}>
            <span className="mode-option__art" aria-hidden="true"><span className="mode-option__icon">∞</span><span className="mode-option__art-label">DISTANCE RUN</span></span>
            <span className="mode-option__eyebrow">기록에 도전</span>
            <strong>끝없는 달리기</strong>
            <span className="mode-option__description">90초 동안 코인을 모으며 최고 기록을 갱신해 보세요.</span>
            <span className="mode-option__details"><span>⏱ 90초</span><span>🏅 거리 · 코인 랭킹</span><b aria-hidden="true">시작하기 →</b></span>
          </button>
          <button className="mode-option mode-option--story" type="button" onClick={() => onSelect('story')}>
            <span className="mode-option__art" aria-hidden="true"><span className="mode-option__icon">✦</span><span className="mode-option__art-label">FOUR WORLDS</span></span>
            <span className="mode-option__eyebrow">코스를 완주</span>
            <strong>스토리 스테이지</strong>
            <span className="mode-option__description">네 가지 테마를 달리고 새 러너와 꾸미기를 해금하세요.</span>
            <span className="mode-option__details"><span>♥♥♥ 스테이지 생명</span><span>🏁 4개 코스</span><b aria-hidden="true">여정 선택 →</b></span>
          </button>
        </div>
        <button className="progression-secondary" type="button" onClick={onBack}>뒤로</button>
      </section>
    </main>
  );
}
