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
        <p className="audio-dialog__note">아래 효과음은 Project02에서 직접 합성했으며 외부 녹음이나 샘플을 사용하지 않았습니다.</p>
        <ul className="audio-credit-list">
          {Object.values(RUNNER_AUDIO_EFFECTS).map(({ credit }) => (
            <li key={credit.id}>
              <strong>{credit.title}</strong>
              <span>{credit.creator} · {credit.licenseName}</span>
              <code>{credit.generationScript}</code>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
