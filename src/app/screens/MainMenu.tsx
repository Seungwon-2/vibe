import { useState } from 'react';
import type { AudioPreferences } from '../../audio/audioPreferences';
import { AudioCreditsDialog } from '../components/AudioCreditsDialog';
import { AudioSettingsDialog } from '../components/AudioSettingsDialog';
import { getCharacter } from '../../game/characters/characterCatalog';
import type { RankedRunRecord } from '../../services/RunGateway';

export type MainMenuProps = {
  onStart(): void;
  onRankings(): void;
  onAchievements?(): void;
  topRun: RankedRunRecord | null;
  topRunLoading: boolean;
  topRunError: string | null;
  showControlsHelp: boolean;
  audioPreferences: AudioPreferences;
  onAudioPreferencesChange(preferences: AudioPreferences): void;
  onUnlockAudio(): void;
};

export function MainMenu({ onStart, onRankings, onAchievements, topRun, topRunLoading, topRunError,
  showControlsHelp, audioPreferences, onAudioPreferencesChange, onUnlockAudio }: MainMenuProps): React.JSX.Element {
  const [dialog, setDialog] = useState<'settings' | 'credits' | null>(null);
  const topCharacter = topRun ? getCharacter(topRun.characterId) : null;

  return (
    <main className="landing-shell main-menu-scene">
      <img className="main-menu-hero" src="/assets/title/title-hero.webp"
        alt="다섯 러너가 별빛이 흐르는 하늘길을 함께 달리는 모습" />
      <div className="main-menu-shade" aria-hidden="true" />
      <div className="main-menu-starfield" aria-hidden="true" />
      <section className="title-card main-menu-card" aria-labelledby="game-title">
        <header className="main-menu-topbar">
          <span className="main-menu-brand">STELLA RUNNER</span>
          <span className="main-menu-edition">RUN · JUMP · SLIDE</span>
        </header>
        <div className="main-menu-copy">
          <p className="eyebrow">별빛을 따라 달리는 러닝 액션</p>
          <h1 id="game-title">스텔라 <em>러너</em><span aria-hidden="true">✦</span></h1>
        </div>
        <footer className="main-menu-dock">
          <div className="dock-copy">
            <strong>구름길을 지나 별빛까지 달려요.</strong>
            <span>함께 달릴 러너를 고르고 모험을 시작하세요.</span>
            <p className="main-menu-record" aria-live="polite">
              {topRunLoading ? '기록 불러오는 중…'
                : topRunError ? topRunError
                  : topRun && topCharacter
                    ? `로컬 최고 기록 ${topRun.distanceMeters.toLocaleString()}m · ${topCharacter.displayName}`
                    : '아직 로컬 기록이 없습니다. 첫 달리기를 시작해보세요!'}
            </p>
            {showControlsHelp && <p className="main-menu-help">Space / ↑ 점프 · ↓ 슬라이딩 · P 일시정지</p>}
          </div>
          <div className="main-menu-actions">
            <button className="selector-confirm home-start" type="button" onClick={onStart}>
              달리기 시작
            </button>
            <button className="main-menu-secondary main-menu-rankings" type="button" onClick={onRankings}>
              로컬 기록 보기
            </button>
            {onAchievements && <button className="main-menu-secondary" type="button" onClick={onAchievements}>업적</button>}
            <button className="main-menu-secondary" type="button"
              onClick={() => { onUnlockAudio(); setDialog('settings'); }}>사운드 설정</button>
            <button className="main-menu-secondary" type="button" onClick={() => setDialog('credits')}>
              효과음 크레딧
            </button>
          </div>
        </footer>
      </section>
      {dialog === 'settings' && <AudioSettingsDialog preferences={audioPreferences}
        onChange={onAudioPreferencesChange} onUnlockAudio={onUnlockAudio} onClose={() => setDialog(null)} />}
      {dialog === 'credits' && <AudioCreditsDialog onClose={() => setDialog(null)} />}
    </main>
  );
}
