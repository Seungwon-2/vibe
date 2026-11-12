import { getCharacter } from '../../game/characters/characterCatalog';
import type { RunnerSessionEnvelope } from '../../game/runner/runnerSessionTypes';

type ResumeSessionDialogProps = {
  envelope: RunnerSessionEnvelope | null;
  warning?: string | null;
  confirmingNewRun: boolean;
  onResume(): void;
  onRequestNewRun(): void;
  onConfirmNewRun(): void;
  onCancelNewRun(): void;
  onDismissWarning(): void;
};

export function ResumeSessionDialog({ envelope, warning, confirmingNewRun, onResume, onRequestNewRun,
  onConfirmNewRun, onCancelNewRun, onDismissWarning }: ResumeSessionDialogProps): React.JSX.Element | null {
  const activeEnvelope = envelope?.kind === 'active' ? envelope : null;
  const character = activeEnvelope ? getCharacter(activeEnvelope.payload.characterId) : null;

  if (!warning && !activeEnvelope) return null;
  return <>
    {warning && <div className="runner-session-warning" role="alert">
      <span>{warning}</span>
      <button type="button" onClick={onDismissWarning} aria-label="안내 닫기">×</button>
    </div>}
    {activeEnvelope && character && <div className="runner-overlay runner-overlay--confirm" role="alertdialog" aria-modal="true"
      aria-labelledby="resume-session-title">
      <div className="runner-pause-card resume-session-card">
        {confirmingNewRun ? <>
          <strong id="resume-session-title">저장된 달리기를 버리고 새로 시작할까요?</strong>
          <p>저장된 진행 상황과 이번 런에서 모은 코인은 사라집니다.</p>
          <div className="runner-result-actions">
            <button type="button" onClick={onCancelNewRun}>돌아가기</button>
            <button type="button" onClick={onConfirmNewRun}>저장 삭제 후 새로 시작</button>
          </div>
        </> : <>
          <strong id="resume-session-title">이어서 달릴까요?</strong>
          <p>{character.displayName} · {activeEnvelope.payload.mode === 'story' ? '스토리 스테이지' : '끝없는 달리기'} · {Math.floor(activeEnvelope.payload.snapshot.distanceMeters).toLocaleString()}m</p>
          <div className="runner-result-actions">
            <button type="button" onClick={onResume}>이어하기</button>
            <button type="button" onClick={onRequestNewRun}>새로 시작</button>
          </div>
        </>}
      </div>
    </div>}
  </>;
}
