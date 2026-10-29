import { useEffect, useRef } from 'react';
import type { AudioPreferences } from '../../audio/audioPreferences';

export type AudioSettingsDialogProps = {
  preferences: AudioPreferences;
  onChange(preferences: AudioPreferences): void;
  onClose(): void;
  onUnlockAudio(): void;
};

export function AudioSettingsDialog({ preferences, onChange, onClose, onUnlockAudio }: AudioSettingsDialogProps): React.JSX.Element {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="audio-dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="audio-dialog" role="dialog" aria-modal="true" aria-labelledby="audio-settings-title">
        <div className="audio-dialog__heading">
          <div>
            <p className="eyebrow">SOUND SETTINGS</p>
            <h2 id="audio-settings-title">사운드 설정</h2>
          </div>
          <button ref={closeButton} className="audio-dialog__close" type="button" onClick={onClose} aria-label="설정 닫기">닫기</button>
        </div>
        <label className="audio-setting-toggle">
          <span><strong>전체 음소거</strong><small>효과음을 모두 끕니다.</small></span>
          <input type="checkbox" checked={preferences.muted} onChange={(event) => {
            onUnlockAudio();
            onChange({ ...preferences, muted: event.currentTarget.checked });
          }} />
        </label>
        <label className="audio-setting-volume" htmlFor="effects-volume">
          <span><strong>효과음 크기</strong><output>{Math.round(preferences.effectsVolume * 100)}%</output></span>
          <input id="effects-volume" type="range" min="0" max="1" step="0.01" value={preferences.effectsVolume}
            onChange={(event) => {
              onUnlockAudio();
              onChange({ ...preferences, effectsVolume: Number(event.currentTarget.value) });
            }} />
        </label>
        <p className="audio-dialog__note">배경음악은 원하는 음원을 준비한 뒤 추가할 예정입니다.</p>
      </section>
    </div>
  );
}
