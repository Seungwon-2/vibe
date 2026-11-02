import { RUNNER_AUDIO_EFFECTS } from '../../audio/audioCatalog';

export type AudioCreditsDialogProps = { onClose(): void };

export function AudioCreditsDialog({ onClose }: AudioCreditsDialogProps): React.JSX.Element {
  return (
    <div className="audio-dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="audio-dialog audio-dialog--credits" role="dialog" aria-modal="true" aria-labelledby="audio-credits-title">
        <div className="audio-dialog__heading">
          <div>
            <p className="eyebrow">AUDIO CREDITS</p>
            <h2 id="audio-credits-title">효과음 크레딧</h2>
          </div>
          <button className="audio-dialog__close" type="button" onClick={onClose}>닫기</button>
        </div>
        <p className="audio-dialog__note">효과음은 제공된 오디오 안내문 기준으로 표시합니다. 일부 효과음은 기존 파일을 사용하며, 제공 파일의 재배포 조건은 확인이 필요합니다.</p>
        <ul className="audio-credit-list">
          {Object.values(RUNNER_AUDIO_EFFECTS).map(({ credit }) => (
            <li key={credit.id}>
              <strong>{credit.title}</strong>
              <span>{credit.creator} · {credit.licenseName}</span>
              <code>{credit.generationScript ?? '사용자 제공 파일'}</code>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
