type ResultScreenProps = {
  kind: 'clear' | 'game-over' | 'timeout';
  stageName: string;
  score: number;
  isFinal?: boolean;
  onContinue: () => void;
  onRetry: () => void;
  onMenu: () => void;
};

export function ResultScreen({ kind, stageName, score, isFinal = false, onContinue, onRetry, onMenu }: ResultScreenProps): React.JSX.Element {
  const title = kind === 'clear' ? '스테이지 클리어!' : kind === 'timeout' ? '시간 초과' : '게임 오버';
  return (
    <section className="result-panel" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <p className="eyebrow">{stageName}</p>
      <h2 id="result-title">{title}</h2>
      <p>이번 스테이지 점수 <strong>{score}</strong></p>
      <div className="menu-actions">
        {kind === 'clear' ? <button className="primary-button" onClick={onContinue}>{isFinal ? '캠페인 완료' : '다음으로'}</button> : <button className="primary-button" onClick={onRetry}>다시 도전</button>}
        <button onClick={onMenu}>메인 메뉴</button>
      </div>
    </section>
  );
}
