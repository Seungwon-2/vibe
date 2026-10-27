export function PauseOverlay({ onResume, onExit, portrait }: {
  onResume(): void;
  onExit(): void;
  portrait: boolean;
}): React.JSX.Element {
  return (
    <div className={`runner-overlay runner-overlay--pause${portrait ? ' is-portrait' : ''}`} role="dialog"
      aria-modal="true" aria-labelledby="runner-pause-title">
      <div className="runner-pause-card">
        <strong id="runner-pause-title">{portrait ? '화면을 가로로 돌려 주세요' : '일시 정지'}</strong>
        <p>{portrait ? '가로 화면으로 바꾸면 계속할 수 있어요.' : '잠시 쉬었다가 계속할 수 있어요.'}</p>
        <div className="runner-result-actions">
          <button type="button" onClick={onResume} disabled={portrait}>계속하기</button>
          <button type="button" onClick={onExit}>나가기</button>
        </div>
      </div>
    </div>
  );
}
