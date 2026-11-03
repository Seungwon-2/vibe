import { useEffect, useRef, useState } from 'react';
import { getCharacter } from '../../game/characters/characterCatalog';
import type { CharacterId } from '../../game/characters/characterTypes';
import { RunnerGame } from '../../game/runner/RunnerGame';
import { RunnerInputBridge } from '../../game/runner/RunnerInput';
import { createRunnerSnapshot } from '../../game/runner/RunnerSimulation';
import type { RunnerFinishOutcome, RunnerMode, RunnerResult, RunnerSnapshot, StoryStageId } from '../../game/runner/runnerTypes';
import type { RunnerEvent } from '../../game/runner/runnerEvents';
import { CountdownOverlay } from '../components/CountdownOverlay';
import { PauseOverlay } from '../components/PauseOverlay';
import { RunnerHud } from '../components/RunnerHud';
import type { RunnerHudCue } from '../components/RunnerHud';
import { TouchControls } from '../components/TouchControls';
import { markRunnerTutorialSeen, shouldShowRunnerTutorial } from '../../game/runner/runnerTutorial';
import { AudioSettingsDialog } from '../components/AudioSettingsDialog';
import type { AudioPreferences } from '../../audio/audioPreferences';
import { browserRunnerAudio } from '../../audio/RunnerAudioManager';
import { browserRunnerMusic } from '../../audio/RunnerMusicManager';
import { getStoryStage } from '../../game/runner/storyConfig';

function isPortrait(): boolean {
  return window.matchMedia?.('(orientation: portrait)').matches ?? window.innerHeight > window.innerWidth;
}

export type RunScreenProps = {
  characterId: CharacterId;
  mode?: RunnerMode;
  storyStageId?: StoryStageId | null;
  trailCosmeticId?: string | null;
  onFinish(result: RunnerResult, outcome: RunnerFinishOutcome): void;
  onExit(): void;
  audioPreferences: AudioPreferences;
  onAudioPreferencesChange(preferences: AudioPreferences): void;
  onUnlockAudio(): void;
};

export function RunScreen({ characterId, mode = 'endless', storyStageId = null, trailCosmeticId = null, onFinish, onExit, audioPreferences, onAudioPreferencesChange,
  onUnlockAudio }: RunScreenProps): React.JSX.Element {
  const character = getCharacter(characterId);
  const [portrait, setPortrait] = useState(isPortrait);
  const [paused, setPaused] = useState(isPortrait);
  const [snapshot, setSnapshot] = useState<RunnerSnapshot>(() => createRunnerSnapshot(characterId, new Date(), { mode, storyStageId }));
  const [countdownValue, setCountdownValue] = useState<number | null>(3);
  const [recentBonus, setRecentBonus] = useState<RunnerHudCue | null>(null);
  const [exitConfirmation, setExitConfirmation] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inputBridge] = useState(() => new RunnerInputBridge());
  const [tutorialEnabled] = useState(() => shouldShowRunnerTutorial());
  const bonusTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gateBurstTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [gateBurstActive, setGateBurstActive] = useState(false);
  const passiveCueSequence = useRef(0);

  useEffect(() => {
    if (snapshot.phase === 'paused') {
      browserRunnerMusic.pause();
      return;
    }
    const musicId = mode === 'story' && storyStageId
      ? getStoryStage(storyStageId).biomeId
      : snapshot.biomeId;
    browserRunnerMusic.play(musicId);
  }, [mode, snapshot.biomeId, snapshot.phase, storyStageId]);

  useEffect(() => {
    if (tutorialEnabled) markRunnerTutorialSeen();
  }, [tutorialEnabled]);

  function clearBonus(): void {
    if (bonusTimeout.current !== null) clearTimeout(bonusTimeout.current);
    bonusTimeout.current = null;
    setRecentBonus(null);
  }

  function clearGateBurst(): void {
    if (gateBurstTimeout.current !== null) clearTimeout(gateBurstTimeout.current);
    gateBurstTimeout.current = null;
    setGateBurstActive(false);
  }

  function showGateBurst(): void {
    if (gateBurstTimeout.current !== null) clearTimeout(gateBurstTimeout.current);
    setGateBurstActive(true);
    gateBurstTimeout.current = setTimeout(() => {
      gateBurstTimeout.current = null;
      setGateBurstActive(false);
    }, 650);
  }

  function showBonusCue(id: string, kind: 'pickup' | 'gate' | 'speed-boost', awardedMs: number): void {
    if (bonusTimeout.current !== null) clearTimeout(bonusTimeout.current);
    setRecentBonus({ id, kind, awardedMs });
    bonusTimeout.current = setTimeout(() => {
      bonusTimeout.current = null;
      setRecentBonus(null);
    }, 1_200);
  }

  function showGiantCue(id: string): void {
    if (bonusTimeout.current !== null) clearTimeout(bonusTimeout.current);
    setRecentBonus({ id, kind: 'giant' });
    bonusTimeout.current = setTimeout(() => {
      bonusTimeout.current = null;
      setRecentBonus(null);
    }, 1_200);
  }

  function pauseRun(): void {
    clearBonus();
    clearGateBurst();
    setPaused(true);
  }

  useEffect(() => {
    const media = window.matchMedia?.('(orientation: portrait)');
    const updateOrientation = (): void => {
      const nextPortrait = isPortrait();
      setPortrait(nextPortrait);
      if (nextPortrait) {
        if (bonusTimeout.current !== null) clearTimeout(bonusTimeout.current);
        bonusTimeout.current = null;
        setRecentBonus(null);
        if (gateBurstTimeout.current !== null) clearTimeout(gateBurstTimeout.current);
        gateBurstTimeout.current = null;
        setGateBurstActive(false);
        setPaused(true);
      }
    };
    media?.addEventListener?.('change', updateOrientation);
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
    return () => {
      media?.removeEventListener?.('change', updateOrientation);
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
      if (bonusTimeout.current !== null) clearTimeout(bonusTimeout.current);
      if (gateBurstTimeout.current !== null) clearTimeout(gateBurstTimeout.current);
      inputBridge.clear();
    };
  }, [inputBridge]);

  useEffect(() => {
    const onPauseShortcut = (event: KeyboardEvent): void => {
      if (event.code !== 'KeyP' || event.repeat) return;
      if (paused && !portrait && !exitConfirmation && !settingsOpen) {
        setPaused(false);
      } else if (!paused && snapshot.phase === 'running') {
        if (bonusTimeout.current !== null) clearTimeout(bonusTimeout.current);
        bonusTimeout.current = null;
        setRecentBonus(null);
        if (gateBurstTimeout.current !== null) clearTimeout(gateBurstTimeout.current);
        gateBurstTimeout.current = null;
        setGateBurstActive(false);
        inputBridge.clear();
        setPaused(true);
      }
    };
    window.addEventListener('keydown', onPauseShortcut);
    return () => window.removeEventListener('keydown', onPauseShortcut);
  }, [exitConfirmation, inputBridge, paused, portrait, settingsOpen, snapshot.phase]);

  function handleEvent(event: RunnerEvent): void {
    if (event.type === 'countdown') {
      setCountdownValue(event.value > 0 ? event.value : null);
    } else if (event.type === 'player-action') {
      browserRunnerAudio.playEffect(event.action);
    } else if (event.type === 'hazard-hit') {
      browserRunnerAudio.playEffect('hit');
    } else if (event.type === 'pit-fall-started') {
      browserRunnerAudio.playEffect('fall');
    } else if (event.type === 'passive-triggered') {
      if (event.passiveId === 'hiyori-guard') browserRunnerAudio.playEffect('hiyori-defense');
      if (bonusTimeout.current !== null) clearTimeout(bonusTimeout.current);
      setRecentBonus({
        id: `passive-${++passiveCueSequence.current}`,
        kind: 'passive-triggered',
        ...(event.passiveId === 'hiyori-guard'
          ? { passiveId: 'hiyori-guard' as const, remainingCharges: event.remainingCharges, trigger: event.trigger }
          : { passiveId: 'toa-ghost-glide' as const, remainingCharges: 0 as const, trigger: 'slide' as const }),
      });
      bonusTimeout.current = setTimeout(() => {
        bonusTimeout.current = null;
        setRecentBonus(null);
      }, 1_200);
    } else if (event.type === 'pickup' && event.kind === 'coin') {
      browserRunnerAudio.playEffect('coin');
    } else if (event.type === 'pickup' && event.kind === 'time') {
      if (event.awardedMs > 0) browserRunnerAudio.playEffect('time-pickup');
      if (event.awardedMs > 0) showBonusCue(event.pickupId, mode === 'story' ? 'speed-boost' : 'pickup', event.awardedMs);
    } else if (event.type === 'pickup' && event.kind === 'giant') {
      browserRunnerAudio.playEffect('time-pickup');
      showGiantCue(event.pickupId);
    } else if (event.type === 'gate') {
      browserRunnerAudio.playEffect('gate');
      showGateBurst();
      if (event.awardedMs > 0) {
        showBonusCue(event.gateId, event.type, event.awardedMs);
      }
    }
  }

  function requestExit(): void {
    pauseRun();
    setExitConfirmation(true);
  }

  return (
    <main className="run-screen">
      <header className="run-screen__header">
        <div><span className="eyebrow">RUNNING ACTION</span><strong>{character.displayName}</strong></div>
        <button type="button" onClick={requestExit}>나가기</button>
      </header>
      <div className="run-screen__hud">
        <RunnerHud snapshot={snapshot} character={character} recentBonus={recentBonus} onPause={pauseRun} />
      </div>
      <div className={`runner-stage${gateBurstActive ? ' is-gate-boosting' : ''}${snapshot.giantRemainingMs > 0 ? ' is-giant-active' : ''}`}
        role="region" aria-label="러닝 게임 화면">
        <RunnerGame characterId={characterId} mode={mode} storyStageId={storyStageId} trailCosmeticId={trailCosmeticId}
          inputBridge={inputBridge} paused={paused}
          tutorialEnabled={tutorialEnabled}
          onSnapshot={(next) => {
            setSnapshot(next);
            if (next.phase === 'paused') setPaused(true);
          }}
          onFinished={onFinish}
          onEvent={handleEvent} />
        <TouchControls inputBridge={inputBridge}
          disabled={paused || snapshot.phase !== 'running'} />
        {snapshot.phase === 'countdown' && countdownValue !== null &&
          <CountdownOverlay value={countdownValue} />}
        {paused && (
          <PauseOverlay onResume={() => setPaused(false)} onExit={requestExit} portrait={portrait}
            onOpenAudioSettings={() => { onUnlockAudio(); setSettingsOpen(true); }} />
        )}
        {paused && settingsOpen && <AudioSettingsDialog preferences={audioPreferences}
          onChange={onAudioPreferencesChange} onUnlockAudio={onUnlockAudio} onClose={() => setSettingsOpen(false)} />}
        {exitConfirmation && (
          <div className="runner-overlay runner-overlay--confirm" role="alertdialog" aria-modal="true"
            aria-labelledby="exit-confirm-title">
            <div className="runner-pause-card">
              <strong id="exit-confirm-title">이번 달리기를 종료할까요?</strong>
              <p>현재 기록은 결과에 저장되지 않습니다.</p>
              <div className="runner-result-actions">
                <button type="button" onClick={onExit}>종료하고 메뉴로</button>
                <button type="button" onClick={() => setExitConfirmation(false)}>일시정지로 돌아가기</button>
              </div>
            </div>
          </div>
        )}
      </div>
      {tutorialEnabled && <footer className="run-screen__help">
        <span><kbd>Space</kbd> / <kbd>↑</kbd> 점프</span>
        <span><kbd>↓</kbd> 누르고 있기: 슬라이딩</span>
        <span><kbd>P</kbd> 일시정지</span>
      </footer>}
    </main>
  );
}
