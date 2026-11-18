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
import { RunnerGuideDialog } from '../components/RunnerGuideDialog';
import type { AudioPreferences } from '../../audio/audioPreferences';
import { browserRunnerAudio } from '../../audio/RunnerAudioManager';
import { browserRunnerMusic } from '../../audio/RunnerMusicManager';
import { getStoryStage } from '../../game/runner/storyConfig';
import type { RunnerActiveSession } from '../../game/runner/runnerSessionTypes';
import './RunScreen.css';
import { getEffectiveVisualMode, readRunnerVisualMode, saveRunnerVisualMode } from '../../game/runner/runnerVisualPreferences';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || !!target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]');
}

function isPortrait(): boolean {
  return window.matchMedia?.('(orientation: portrait)').matches ?? window.innerHeight > window.innerWidth;
}

export type RunScreenProps = {
  characterId: CharacterId;
  mode?: RunnerMode;
  storyStageId?: StoryStageId | null;
  trailCosmeticId?: string | null;
  onFinish(result: RunnerResult, outcome: RunnerFinishOutcome): void;
  onTerminalCheckpoint?(result: RunnerResult, outcome: RunnerFinishOutcome): void;
  onExit(): void;
  audioPreferences: AudioPreferences;
  onAudioPreferencesChange(preferences: AudioPreferences): void;
  onUnlockAudio(): void;
  initialSession?: RunnerActiveSession | null;
  onCheckpoint?(session: RunnerActiveSession): void;
  storageWarning?: string | null;
};

export function RunScreen({ characterId, mode = 'endless', storyStageId = null, trailCosmeticId = null, onFinish, onTerminalCheckpoint, onExit, audioPreferences, onAudioPreferencesChange,
  onUnlockAudio, initialSession = null, onCheckpoint, storageWarning }: RunScreenProps): React.JSX.Element {
  const character = getCharacter(characterId);
  const [tutorialEnabled] = useState(() => !initialSession && shouldShowRunnerTutorial());
  const [portrait, setPortrait] = useState(isPortrait);
  const [paused, setPaused] = useState(() => !!initialSession || isPortrait() || tutorialEnabled);
  const [guideOpen, setGuideOpen] = useState(() => !initialSession && tutorialEnabled);
  const [guideVariant, setGuideVariant] = useState<'first-run' | 'pause-review'>(!initialSession && tutorialEnabled ? 'first-run' : 'pause-review');
  const [snapshot, setSnapshot] = useState<RunnerSnapshot>(() => initialSession?.snapshot ?? createRunnerSnapshot(characterId, new Date(), { mode, storyStageId }));
  const musicId = mode === 'story' && storyStageId
    ? getStoryStage(storyStageId).biomeId
    : snapshot.biomeId === 'starlight-rainbow' ? 'cloud-skyway' : snapshot.biomeId;
  const [countdownValue, setCountdownValue] = useState<number | null>(() => initialSession ? null : 3);
  const [recentBonus, setRecentBonus] = useState<RunnerHudCue | null>(null);
  const [exitConfirmation, setExitConfirmation] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [visualMode, setVisualMode] = useState(readRunnerVisualMode);
  const [reducedMotion, setReducedMotion] = useState(() =>
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true);
  const effectiveVisualMode = getEffectiveVisualMode(visualMode, reducedMotion);
  const [inputBridge] = useState(() => new RunnerInputBridge());
  const bonusTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gateBurstTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [gateBurstActive, setGateBurstActive] = useState(false);
  const passiveCueSequence = useRef(0);
  const pauseGuideButtonRef = useRef<HTMLButtonElement>(null);
  const pauseButtonRef = useRef<HTMLButtonElement>(null);
  const settingsInvokerRef = useRef<HTMLElement | null>(null);
  const exitConfirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update = (event: MediaQueryListEvent): void => setReducedMotion(event.matches);
    preference?.addEventListener?.('change', update);
    return () => preference?.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (snapshot.phase === 'paused') {
      browserRunnerMusic.pause();
      return;
    }
    browserRunnerMusic.play(musicId);
  }, [musicId, snapshot.phase]);

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
  const pauseRunRef = useRef(pauseRun);
  useEffect(() => {
    pauseRunRef.current = pauseRun;
  });

  function startAfterGuide(): void {
    markRunnerTutorialSeen();
    setGuideOpen(false);
    setPaused(portrait);
  }

  function openGuideFromPause(): void {
    pauseRun();
    setSettingsOpen(false);
    setGuideVariant('pause-review');
    setGuideOpen(true);
  }

  function closeGuideToPause(): void {
    setGuideOpen(false);
    window.requestAnimationFrame(() => pauseGuideButtonRef.current?.focus());
  }

  function resumeRun(): void {
    setPaused(false);
    window.requestAnimationFrame(() => pauseButtonRef.current?.focus());
  }

  function closeSettings(): void {
    setSettingsOpen(false);
    window.requestAnimationFrame(() => settingsInvokerRef.current?.focus());
  }

  function dismissExitConfirmation(): void {
    setExitConfirmation(false);
    window.requestAnimationFrame(() => pauseButtonRef.current?.focus());
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
      if (event.repeat || event.defaultPrevented || isEditableTarget(event.target)) return;
      if (event.key === 'Escape') {
        if (exitConfirmation) { event.preventDefault(); dismissExitConfirmation(); }
        else if (settingsOpen) { event.preventDefault(); closeSettings(); }
        else if (guideOpen) {
          if (guideVariant === 'pause-review') { event.preventDefault(); closeGuideToPause(); }
        } else if (paused) {
          if (!portrait) { event.preventDefault(); resumeRun(); }
        } else if (snapshot.phase === 'running') {
          event.preventDefault();
          pauseRunRef.current();
        }
        return;
      }
      if ((event.code !== 'KeyP' && event.key.toLowerCase() !== 'p') || guideOpen || exitConfirmation || settingsOpen) return;
      event.preventDefault();
      if (paused && !portrait) resumeRun();
      else if (!paused && snapshot.phase === 'running') pauseRunRef.current();
    };
    window.addEventListener('keydown', onPauseShortcut);
    return () => window.removeEventListener('keydown', onPauseShortcut);
  }, [exitConfirmation, guideOpen, guideVariant, paused, portrait, settingsOpen, snapshot.phase]);

  useEffect(() => {
    if (exitConfirmation) window.requestAnimationFrame(() => exitConfirmButtonRef.current?.focus());
  }, [exitConfirmation]);

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
    } else if (event.type === 'pickup' && event.kind === 'speed') {
      browserRunnerAudio.playEffect('time-pickup');
      if (bonusTimeout.current !== null) clearTimeout(bonusTimeout.current);
      setRecentBonus({ id: event.pickupId, kind: 'speed-pickup' });
      bonusTimeout.current = setTimeout(() => {
        bonusTimeout.current = null;
        setRecentBonus(null);
      }, 1_200);
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
    setGuideOpen(false);
    setExitConfirmation(true);
  }

  return (
    <main className="run-screen run-screen--immersive" aria-label={`${character.displayName} 달리기`}>
      {storageWarning && <div className="runner-session-warning" role="alert">{storageWarning}</div>}
      <div className={`runner-stage${gateBurstActive ? ' is-gate-boosting' : ''}${snapshot.giantRemainingMs > 0 ? ' is-giant-active' : ''}`}
        data-visual-mode={effectiveVisualMode} role="region" aria-label="러닝 게임 화면">
        <RunnerGame characterId={characterId} mode={mode} storyStageId={storyStageId} trailCosmeticId={trailCosmeticId}
          visualMode={effectiveVisualMode}
          inputBridge={inputBridge} paused={paused}
          tutorialEnabled={tutorialEnabled}
          onSnapshot={(next) => {
            setSnapshot(next);
            if (next.phase === 'paused') setPaused(true);
            else if (next.phase === 'running') setPaused(false);
          }}
          initialSession={initialSession}
          onCheckpoint={onCheckpoint}
          onTerminalCheckpoint={onTerminalCheckpoint}
          onFinished={onFinish}
          onEvent={handleEvent} />
        <div className="run-screen__hud">
          <RunnerHud snapshot={snapshot} character={character} recentBonus={recentBonus}
            onPause={pauseRun} onOpenGuide={openGuideFromPause} pauseButtonRef={pauseButtonRef} />
        </div>
        <TouchControls inputBridge={inputBridge}
          disabled={paused || snapshot.phase !== 'running'} />
        {snapshot.phase === 'countdown' && countdownValue !== null &&
          <CountdownOverlay value={countdownValue} />}
        {paused && !guideOpen && !exitConfirmation && (
          <PauseOverlay onResume={resumeRun} onExit={requestExit} portrait={portrait}
            visualMode={visualMode} reducedMotion={reducedMotion} onVisualModeChange={(next) => {
              setVisualMode(next);
              saveRunnerVisualMode(next);
            }}
            onOpenGuide={openGuideFromPause} guideButtonRef={pauseGuideButtonRef}
            onOpenAudioSettings={() => { settingsInvokerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; onUnlockAudio(); setSettingsOpen(true); }} />
        )}
        {paused && settingsOpen && <AudioSettingsDialog preferences={audioPreferences}
          onChange={onAudioPreferencesChange} onUnlockAudio={onUnlockAudio} onClose={closeSettings} />}
        {guideOpen && <RunnerGuideDialog mode={mode} character={character}
          variant={guideVariant} portrait={portrait}
          onStart={startAfterGuide} onClose={closeGuideToPause} />}
        {exitConfirmation && (
          <div className="runner-overlay runner-overlay--confirm" role="alertdialog" aria-modal="true"
            aria-labelledby="exit-confirm-title">
            <div className="runner-pause-card">
              <strong id="exit-confirm-title">이번 달리기를 종료할까요?</strong>
              <p>현재 진행 상황은 이 브라우저에 저장되어 다음에 이어서 할 수 있습니다.</p>
              <div className="runner-result-actions">
                <button ref={exitConfirmButtonRef} type="button" onClick={onExit}>종료하고 메뉴로</button>
                <button type="button" onClick={dismissExitConfirmation}>일시정지로 돌아가기</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
