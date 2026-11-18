import { useState } from 'react';
import type { AudioPreferences } from '../../audio/audioPreferences';
import { AudioCreditsDialog } from '../components/AudioCreditsDialog';
import { AudioSettingsDialog } from '../components/AudioSettingsDialog';
import { getCharacter } from '../../game/characters/characterCatalog';
import type { PersonalBestRecord } from '../../services/RunGateway';
import type { RunnerApiConsentStatus, RunnerAuthMode, RunnerAuthStatus } from '../../auth/AuthProvider';
import './MainMenuAccount.css';

export type MainMenuProps = {
  onStart(): void;
  onRankings(): void;
  onHistory?(): void;
  onAchievements?(): void;
  onShop?(): void;
  topRun: PersonalBestRecord | null;
  topRunLoading: boolean;
  topRunError: string | null;
  showControlsHelp: boolean;
  audioPreferences: AudioPreferences;
  onAudioPreferencesChange(preferences: AudioPreferences): void;
  onUnlockAudio(): void;
  authMode?: RunnerAuthMode;
  recordSource?: 'cloud' | 'local';
  authStatus?: RunnerAuthStatus;
  authError?: string | null;
  accountName?: string | null;
  accountUsername?: string | null;
  apiConsentStatus?: RunnerApiConsentStatus;
  apiConsentError?: string | null;
  onSignIn?(): void;
  onSignOut?(): void;
  onRequestApiConsent?(): void;
};

export function MainMenu({ onStart, onRankings, onHistory, onAchievements, onShop, topRun, topRunLoading, topRunError,
  showControlsHelp, audioPreferences, onAudioPreferencesChange, onUnlockAudio, authMode = 'local', recordSource = 'local',
  authStatus = 'signed-in', authError = null, accountName = null, accountUsername = null,
  apiConsentStatus = 'unavailable', apiConsentError = null, onSignIn, onSignOut, onRequestApiConsent }: MainMenuProps): React.JSX.Element {
  const [dialog, setDialog] = useState<'settings' | 'credits' | null>(null);
  const topCharacter = topRun ? getCharacter(topRun.characterId) : null;
  const cloudNeedsSignIn = authMode === 'cloud' && authStatus !== 'signed-in';
  const configurationFailed = authMode === 'configuration-error';
  const cloudRecords = recordSource === 'cloud';

  return (
    <main className="landing-shell main-menu-scene">
      <img className="main-menu-hero" src="/assets/title/title-hero.webp"
        alt="네 러너가 별빛 아래 무지개길을 달리는 모습" />
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
        <footer className={`main-menu-dock${cloudNeedsSignIn ? ' main-menu-dock--sign-in' : ''}`}>
          <div className="dock-copy">
            <strong>구름길을 지나 별빛까지 달려요.</strong>
            <span>함께 달릴 러너를 고르고 모험을 시작하세요.</span>
            {(!cloudNeedsSignIn || authError) && <p className="main-menu-record" aria-live="polite">
              {configurationFailed ? authError ?? 'Entra 설정이 필요합니다.'
                : cloudNeedsSignIn ? authError ?? (authStatus === 'loading' ? '회사 계정 확인 중…' : '회사 계정으로 로그인해 주세요.')
                : topRunLoading ? '기록 불러오는 중…'
                : topRunError ? topRunError
                  : topRun && topCharacter
                    ? `${cloudRecords ? '내 최고 기록' : '이 브라우저의 최고 기록'} ${topRun.distanceMeters.toLocaleString()}m · ${topCharacter.displayName}`
                    : `${cloudRecords ? '내 기록' : '이 브라우저에 저장된 기록'}이 없습니다. 첫 달리기를 시작해보세요!`}
            </p>}
            {showControlsHelp && <p className="main-menu-help">Space / ↑ 점프 · ↓ 슬라이딩 · P 일시정지</p>}
            {authMode === 'cloud' && authStatus === 'signed-in' && (
              <div className="main-menu-account" aria-label="로그인 계정 정보">
                <div className="main-menu-account__identity">
                  <strong className="main-menu-account__name">{accountName?.trim() || 'Runner'}</strong>
                  <span className="main-menu-account__username">{accountUsername?.trim() || '계정 정보 없음'}</span>
                </div>
                {apiConsentStatus === 'available' && <span className="main-menu-account__api-status">클라우드 기록 연결됨</span>}
                {apiConsentStatus === 'checking' && <span className="main-menu-account__api-status" role="status">기록 권한 확인 중</span>}
                {apiConsentStatus === 'consent-required' && onRequestApiConsent && (
                  <div className="main-menu-account__api-action">
                    <span>{apiConsentError || '동의 전 기록은 이 브라우저에 저장됩니다.'}</span>
                    <button className="main-menu-account__connect" type="button" onClick={onRequestApiConsent}>클라우드 기록 연결</button>
                  </div>
                )}
                {apiConsentStatus === 'error' && (
                  <div className="main-menu-account__api-action">
                    <span role="status">{apiConsentError || '클라우드 기록을 연결할 수 없습니다. 로컬 기록을 사용합니다.'}</span>
                    {onRequestApiConsent && <button className="main-menu-account__connect" type="button" onClick={onRequestApiConsent}>다시 시도</button>}
                  </div>
                )}
                {onSignOut && <button className="main-menu-account__logout" type="button" onClick={onSignOut}>로그아웃</button>}
              </div>
            )}
          </div>
          <div className="main-menu-actions">
            <button className="selector-confirm home-start" type="button" onClick={onStart}
              disabled={cloudNeedsSignIn || configurationFailed} hidden={cloudNeedsSignIn || configurationFailed}>
              달리기 시작
            </button>
            <button className="main-menu-secondary main-menu-rankings" type="button" onClick={onRankings}
              disabled={cloudNeedsSignIn || configurationFailed} hidden={cloudNeedsSignIn || configurationFailed}>
              {cloudRecords ? '유저 랭킹' : '이 브라우저 기록 보기'}
            </button>
            {onHistory && <button className="main-menu-secondary" type="button" onClick={onHistory}
              disabled={cloudNeedsSignIn || configurationFailed} hidden={cloudNeedsSignIn || configurationFailed}>
              {cloudRecords ? '내 플레이 기록' : '이 브라우저의 플레이 기록'}
            </button>}
            {onAchievements && <button className="main-menu-secondary" type="button" onClick={onAchievements} hidden={cloudNeedsSignIn || configurationFailed}>업적</button>}
            {onShop && <button className="main-menu-secondary" type="button" onClick={onShop} hidden={cloudNeedsSignIn || configurationFailed}>코인 상점</button>}
            <button className="main-menu-secondary main-menu-sound" type="button"
              hidden={cloudNeedsSignIn || configurationFailed} onClick={() => { onUnlockAudio(); setDialog('settings'); }}>사운드 설정</button>
            <button className="main-menu-secondary main-menu-credits" type="button" onClick={() => setDialog('credits')} hidden={cloudNeedsSignIn || configurationFailed}>
              효과음 크레딧
            </button>
            {cloudNeedsSignIn && onSignIn && <button className="selector-confirm home-start main-menu-sign-in" type="button"
              onClick={onSignIn} disabled={authStatus === 'loading'}>
              {authStatus === 'loading' ? '계정 확인 중…' : '회사 계정으로 로그인'}
            </button>}
          </div>
        </footer>
      </section>
      {dialog === 'settings' && <AudioSettingsDialog preferences={audioPreferences}
        onChange={onAudioPreferencesChange} onUnlockAudio={onUnlockAudio} onClose={() => setDialog(null)} />}
      {dialog === 'credits' && <AudioCreditsDialog onClose={() => setDialog(null)} />}
    </main>
  );
}
