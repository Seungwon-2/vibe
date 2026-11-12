import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CharacterSelect } from './app/screens/CharacterSelect';
import { MainMenu } from './app/screens/MainMenu';
import { ModeSelect } from './app/screens/ModeSelect';
import { RankingScreen } from './app/screens/RankingScreen';
import { PersonalHistoryScreen } from './app/screens/PersonalHistoryScreen';
import { RunResult } from './app/screens/RunResult';
import { StoryResult } from './app/screens/StoryResult';
import { AchievementsScreen } from './app/screens/AchievementsScreen';
import { ShopScreen } from './app/screens/ShopScreen';
import { StageSelect } from './app/screens/StageSelect';
import type { CharacterId } from './game/characters/characterTypes';
import type { RunnerFinishOutcome, RunnerMode, RunnerResult, StoryStageId } from './game/runner/runnerTypes';
import { browserPersonalBestStore } from './services/PersonalBestStore';
import { browserRunGateway } from './services/LocalRunGateway';
import type { PersonalBestRecord, PersonalRunHistoryRecord, PublicLeaderboardRecord, RunGateway } from './services/RunGateway';
import { RunApiError } from './services/AuthenticatedRunGateway';
import { useRunnerAuth } from './auth/AuthProvider';
import { browserPlayerProfileStore } from './services/LocalPlayerProfileStore';
import { settleRun, type SettlementResult } from './services/PlayerProgression';
import { recordRunAndUnlock } from './services/AchievementService';
import { equipCosmetic, purchaseCosmetic, unequipCosmetic } from './services/CosmeticService';
import type { CosmeticKind } from './services/CosmeticCatalog';
import { getCosmetic } from './services/CosmeticCatalog';
import { shouldShowRunnerTutorial } from './game/runner/runnerTutorial';
import { browserRunnerAudio } from './audio/RunnerAudioManager';
import { browserRunnerMusic } from './audio/RunnerMusicManager';
import { DEFAULT_AUDIO_PREFERENCES, loadAudioPreferences, saveAudioPreferences, type AudioPreferences } from './audio/audioPreferences';
import { ResumeSessionDialog } from './app/components/ResumeSessionDialog';
import { browserRunnerSessionStore } from './services/RunnerSessionStore';
import type { RunnerActiveSession, RunnerSessionEnvelope, RunnerSessionScope, RunnerTerminalSession } from './game/runner/runnerSessionTypes';

const RunScreen = lazy(async () => {
  const module = await import('./app/screens/RunScreen');
  return { default: module.RunScreen };
});

type AppScreen = 'menu' | 'mode-select' | 'character-select' | 'stage-select' | 'run' | 'result' | 'rankings' | 'personal-history' | 'achievements' | 'shop';
type FinishedRun = {
  runId: number;
  result: RunnerResult;
  outcome: RunnerFinishOutcome;
  submittedRank: number | null;
  submissionPending: boolean;
  recordError: string | null;
  settlement: SettlementResult;
  newlyUnlockedAchievementIds: readonly string[];
  achievementBonusCoins: number;
};
type BestLoadState = { key: string; record: PersonalBestRecord | null; error: string | null };
type RankingLoadState = { requestId: number; rows: PublicLeaderboardRecord[]; error: string | null };
type PersonalHistoryLoadState = { requestId: number; rows: PersonalRunHistoryRecord[]; cursor: string | null; error: string | null; loading: boolean };

function App(): React.JSX.Element {
  const auth = useRunnerAuth();
  const signIn = auth.signIn;
  const runGateway = useMemo<RunGateway>(() => browserRunGateway, []);
  const canUseRecords = auth.mode === 'local' || auth.status === 'signed-in';
  const sessionScope = useMemo<RunnerSessionScope | null>(() => {
    if (auth.mode === 'local') return { kind: 'guest' };
    if (auth.mode === 'cloud' && auth.status === 'signed-in' && auth.account?.homeAccountId) {
      return { kind: 'account', id: auth.account.homeAccountId };
    }
    return null;
  }, [auth.account?.homeAccountId, auth.mode, auth.status]);
  const [audioPreferences, setAudioPreferences] = useState<AudioPreferences>(() => {
    try {
      return loadAudioPreferences(window.localStorage);
    } catch {
      return { ...DEFAULT_AUDIO_PREFERENCES };
    }
  });
  const [screen, setScreen] = useState<AppScreen>('menu');
  const [selectedCharacterId, setSelectedCharacterId] = useState<CharacterId>('player-default');
  const [selectedMode, setSelectedMode] = useState<RunnerMode>('endless');
  const [selectedStageId, setSelectedStageId] = useState<StoryStageId>('dawn-city');
  const [profile, setProfile] = useState(() => browserPlayerProfileStore.load());
  const [finishedRun, setFinishedRun] = useState<FinishedRun | null>(null);
  const [runId, setRunId] = useState(0);
  const latestRunId = useRef(0);
  const submittedRunIds = useRef(new Set<number>());
  const sessionRunRef = useRef<{ runId: string; scope: RunnerSessionScope; mode: RunnerMode;
    storyStageId: StoryStageId | null } | null>(null);
  const processedTerminalRunId = useRef<string | null>(null);
  const [sessionEnvelope, setSessionEnvelope] = useState<RunnerSessionEnvelope | null>(null);
  const [sessionRecoveryReady, setSessionRecoveryReady] = useState(false);
  const [sessionStorageWarning, setSessionStorageWarning] = useState<string | null>(null);
  const [confirmingNewRun, setConfirmingNewRun] = useState(false);
  const [initialRunSession, setInitialRunSession] = useState<RunnerActiveSession | null>(null);
  const [bestState, setBestState] = useState<BestLoadState>({ key: '', record: null, error: null });
  const [rankingRequestId, setRankingRequestId] = useState(0);
  const [historyRequestId, setHistoryRequestId] = useState(0);
  const [historyState, setHistoryState] = useState<PersonalHistoryLoadState>({ requestId: -1, rows: [], cursor: null, error: null, loading: false });
  const historyRequestCounter = useRef(0);
  const historyPageInFlight = useRef(false);
  const [achievementsReturnTo, setAchievementsReturnTo] = useState<'menu' | 'stage-select'>('menu');
  const [shopReturnTo, setShopReturnTo] = useState<'menu' | 'character-select'>('menu');
  const [rankingState, setRankingState] = useState<RankingLoadState>({ requestId: -1, rows: [], error: null });
  const bestRequestKey = !canUseRecords ? null : screen === 'menu' ? 'menu'
    : screen === 'result' && finishedRun ? `result:${finishedRun.runId}` : null;
  const overallBest = bestRequestKey && bestState.key === bestRequestKey ? bestState.record : null;
  const bestLoading = bestRequestKey !== null && bestState.key !== bestRequestKey;
  const bestError = bestRequestKey && bestState.key === bestRequestKey ? bestState.error : null;
  const rankingLoading = screen === 'rankings' && rankingState.requestId !== rankingRequestId;
  const rankingRows = rankingState.requestId === rankingRequestId ? rankingState.rows : [];
  const rankingError = rankingState.requestId === rankingRequestId ? rankingState.error : null;

  useEffect(() => {
    setSessionRecoveryReady(false);
    setSessionEnvelope(null);
    setConfirmingNewRun(false);
    if (!sessionScope) return;
    const read = browserRunnerSessionStore.read(sessionScope);
    if (read.ok) {
      setSessionEnvelope(read.value);
      setSessionStorageWarning(null);
    } else {
      setSessionStorageWarning(read.reason === 'expired' ? '저장된 이어하기가 7일이 지나 만료되어 삭제되었습니다.'
        : '이어하기 저장을 읽지 못했습니다. 이번 플레이는 계속할 수 있지만 복구 기록은 사용할 수 없습니다.');
      setSessionEnvelope(null);
    }
    setSessionRecoveryReady(true);
  }, [sessionScope]);

  const writeEnvelope = useCallback((envelope: RunnerSessionEnvelope): boolean => {
    const result = browserRunnerSessionStore.write(envelope);
    if (!result.ok) {
      setSessionStorageWarning('이어하기 저장에 실패했습니다. 게임은 계속할 수 있지만 이 런은 복구되지 않을 수 있습니다.');
      return false;
    }
    setSessionStorageWarning(null);
    setSessionEnvelope(envelope);
    return true;
  }, []);

  function saveActiveSession(session: RunnerActiveSession): void {
    const run = sessionRunRef.current;
    if (!run) return;
    writeEnvelope({ schemaVersion: 1, kind: 'active', savedAt: new Date().toISOString(),
      accountScope: run.scope, runId: run.runId, payload: session });
  }

  const saveTerminalSession = useCallback((result: RunnerResult, outcome: RunnerFinishOutcome, settled = false,
    presentation?: RunnerTerminalSession['presentation']): boolean => {
    const run = sessionRunRef.current;
    if (!run) return false;
    const mode = result.mode ?? run.mode;
    const storyStageId = mode === 'story' ? result.storyStageId ?? run.storyStageId : null;
    const payload: RunnerTerminalSession = { characterId: result.characterId, mode,
      storyStageId,
      result, outcome, settled, ...(presentation ? { presentation } : {}) };
    return writeEnvelope({ schemaVersion: 1, kind: 'terminal', savedAt: new Date().toISOString(),
      accountScope: run.scope, runId: run.runId, payload });
  }, [writeEnvelope]);

  useEffect(() => {
    if (!sessionRecoveryReady || screen !== 'menu' || sessionEnvelope?.kind !== 'terminal' ||
        processedTerminalRunId.current === sessionEnvelope.runId) return;
    const envelope = sessionEnvelope;
    const payload = envelope.payload;
    if (envelope.kind !== 'terminal') return;
    processedTerminalRunId.current = envelope.runId;
    sessionRunRef.current = { runId: envelope.runId, scope: envelope.accountScope,
      mode: payload.mode, storyStageId: payload.storyStageId };
    latestRunId.current += 1;
    const recoveredRunId = latestRunId.current;
    const stableRunKey = `${envelope.runId}:${payload.result.finishedAtIso}`;
    const settlement = settleRun(browserPlayerProfileStore, stableRunKey, payload.result);
    const achievements = recordRunAndUnlock(browserPlayerProfileStore, stableRunKey, payload.result);
    browserPersonalBestStore.record(payload.result);
    const presentation = payload.presentation ?? {
      settlement,
      newlyUnlockedAchievementIds: achievements.newlyUnlockedAchievementIds,
      achievementBonusCoins: achievements.bonusCoins,
    };
    setProfile(achievements.profile);
    setSelectedCharacterId(payload.characterId);
    setSelectedMode(payload.mode);
    setSelectedStageId(payload.storyStageId ?? 'dawn-city');
    setRunId(recoveredRunId);
    setFinishedRun({ runId: recoveredRunId, result: payload.result, outcome: payload.outcome,
      submittedRank: null, submissionPending: false, recordError: null,
      settlement: presentation.settlement, newlyUnlockedAchievementIds: presentation.newlyUnlockedAchievementIds,
      achievementBonusCoins: presentation.achievementBonusCoins });
    setScreen('result');
    if (!payload.settled || !payload.presentation) saveTerminalSession(payload.result, payload.outcome, true, presentation);
  }, [saveTerminalSession, screen, sessionEnvelope, sessionRecoveryReady]);

  useEffect(() => {
    browserRunnerAudio.setPreferences(audioPreferences);
    browserRunnerMusic.setPreferences(audioPreferences);
    try {
      saveAudioPreferences(audioPreferences, window.localStorage);
    } catch {
      // Audio preferences remain active in memory when browser storage is unavailable.
    }
  }, [audioPreferences]);

  useEffect(() => {
    if (screen !== 'run') browserRunnerMusic.play('title');
  }, [screen]);

  useEffect(() => {
    const unlock = (): void => {
      browserRunnerAudio.unlock();
      browserRunnerMusic.unlock();
    };
    const handleButtonClick = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest('button');
      if (!button || button.disabled || button.closest('.runner-stage')) return;
      browserRunnerAudio.unlock();
      browserRunnerMusic.unlock();
      browserRunnerAudio.playEffect('ui-click');
    };
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('keydown', unlock, true);
    document.addEventListener('click', handleButtonClick, true);
    return () => {
      document.removeEventListener('pointerdown', unlock, true);
      document.removeEventListener('keydown', unlock, true);
      document.removeEventListener('click', handleButtonClick, true);
    };
  }, []);

  useEffect(() => {
    if (!bestRequestKey) return;
    let current = true;
    void runGateway.getBest().then((best) => {
      if (current) setBestState({ key: bestRequestKey, record: best, error: null });
    }).catch((error: unknown) => {
      if (error instanceof RunApiError && error.status === 401) void signIn();
      if (current) setBestState({ key: bestRequestKey, record: null, error: '로컬 기록을 불러오지 못했습니다.' });
    });
    return () => { current = false; };
  }, [bestRequestKey, runGateway, signIn]);

  useEffect(() => {
    if (screen !== 'rankings') return;
    let current = true;
    if (!canUseRecords) return;
    void runGateway.getRanking().then((rows) => {
      if (current) setRankingState({ requestId: rankingRequestId, rows, error: null });
    }).catch((error: unknown) => {
      if (error instanceof RunApiError && error.status === 401) void signIn();
      if (current) setRankingState({ requestId: rankingRequestId, rows: [],
        error: '기록을 불러오지 못했습니다. 메인 메뉴로 돌아가 다시 시도해 주세요.' });
    });
    return () => { current = false; };
  }, [screen, rankingRequestId, runGateway, canUseRecords, signIn]);

  useEffect(() => {
    if (screen !== 'personal-history') return;
    let current = true;
    void runGateway.getPersonalHistory({ limit: 20, cursor: null }).then((page) => {
      if (current) setHistoryState({ requestId: historyRequestId, rows: [...page.items], cursor: page.nextCursor, error: null, loading: false });
    }).catch((error: unknown) => {
      if (error instanceof RunApiError && error.status === 401) void signIn();
      if (current) setHistoryState({ requestId: historyRequestId, rows: [], cursor: null,
        error: error instanceof RunApiError ? error.message : '내 기록을 불러오지 못했습니다. 다시 시도해 주세요.', loading: false });
    });
    return () => { current = false; };
  }, [screen, historyRequestId, runGateway, signIn]);

  function openRankings(): void {
    setRankingRequestId((requestId) => requestId + 1);
    setScreen('rankings');
  }

  function openPersonalHistory(): void {
    if (!canUseRecords) return;
    const requestId = historyRequestCounter.current + 1;
    historyRequestCounter.current = requestId;
    historyPageInFlight.current = false;
    setHistoryRequestId(requestId);
    setHistoryState({ requestId, rows: [], cursor: null, error: null, loading: true });
    setScreen('personal-history');
  }

  async function loadMorePersonalHistory(): Promise<void> {
    const cursor = historyState.cursor;
    const requestId = historyRequestId;
    if (!cursor || historyState.loading || historyPageInFlight.current || historyState.requestId !== requestId) return;
    historyPageInFlight.current = true;
    setHistoryState((current) => current.requestId === requestId ? { ...current, loading: true, error: null } : current);
    try {
      const page = await runGateway.getPersonalHistory({ limit: 20, cursor });
      setHistoryState((current) => current.requestId === requestId
        ? { ...current, rows: [...current.rows, ...page.items], cursor: page.nextCursor, error: null, loading: false }
        : current);
    } catch (error) {
      if (error instanceof RunApiError && error.status === 401) void signIn();
      setHistoryState((current) => current.requestId === requestId
        ? { ...current, error: error instanceof RunApiError ? error.message : '기록을 더 불러오지 못했습니다. 다시 시도해 주세요.', loading: false }
        : current);
    } finally {
      historyPageInFlight.current = false;
    }
  }

  function openAchievements(from: 'menu' | 'stage-select'): void {
    setAchievementsReturnTo(from);
    setScreen('achievements');
  }

  function openShop(from: 'menu' | 'character-select'): void {
    setShopReturnTo(from);
    setScreen('shop');
  }

  function handleCosmeticPurchase(cosmeticId: string): boolean {
    const result = purchaseCosmetic(browserPlayerProfileStore, cosmeticId);
    setProfile(browserPlayerProfileStore.load());
    return result.ok;
  }

  function handleCosmeticEquip(characterId: CharacterId, cosmeticId: string): boolean {
    const result = equipCosmetic(browserPlayerProfileStore, characterId, cosmeticId);
    setProfile(browserPlayerProfileStore.load());
    return result.ok;
  }

  function handleCosmeticUnequip(characterId: CharacterId, kind: CosmeticKind): void {
    unequipCosmetic(browserPlayerProfileStore, characterId, kind);
    setProfile(browserPlayerProfileStore.load());
  }

  function createStableRunId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function resumeSavedRun(): void {
    if (!sessionScope || !sessionEnvelope || sessionEnvelope.kind !== 'active') return;
    const payload = sessionEnvelope.payload;
    sessionRunRef.current = { runId: sessionEnvelope.runId, scope: sessionEnvelope.accountScope,
      mode: payload.mode, storyStageId: payload.storyStageId };
    setSelectedCharacterId(payload.characterId);
    setSelectedMode(payload.mode);
    setSelectedStageId(payload.storyStageId ?? 'dawn-city');
    setInitialRunSession(payload);
    latestRunId.current += 1;
    setRunId(latestRunId.current);
    setFinishedRun(null);
    setScreen('run');
  }

  function confirmDiscardAndStart(): void {
    if (!sessionScope || !sessionEnvelope || sessionEnvelope.kind !== 'active') return;
    const payload = sessionEnvelope.payload;
    const removed = browserRunnerSessionStore.remove(sessionScope);
    if (!removed.ok) {
      setSessionStorageWarning('저장된 런을 삭제하지 못했습니다. 기존 코인 손실을 막기 위해 새 런을 시작하지 않았습니다.');
      setConfirmingNewRun(false);
      return;
    }
    setSessionEnvelope(null);
    setSessionStorageWarning(null);
    setConfirmingNewRun(false);
    startRun(payload.characterId, payload.mode, payload.storyStageId);
  }

  function acknowledgeTerminal(action: () => void): void {
    if (sessionEnvelope?.kind === 'terminal' && sessionScope) {
      const removed = browserRunnerSessionStore.remove(sessionScope);
      if (!removed.ok) {
        setSessionStorageWarning('결과 저장을 정리하지 못했습니다. 같은 결과가 다음 접속에 다시 표시될 수 있습니다.');
        return;
      }
      setSessionEnvelope(null);
      processedTerminalRunId.current = null;
      sessionRunRef.current = null;
    }
    action();
  }

  function startRun(characterId = selectedCharacterId, mode = selectedMode, stageId = mode === 'story' ? selectedStageId : null): void {
    if (!canUseRecords) return;
    if (sessionScope) sessionRunRef.current = { runId: createStableRunId(), scope: sessionScope,
      mode, storyStageId: mode === 'story' ? stageId : null };
    setInitialRunSession(null);
    latestRunId.current += 1;
    setSelectedCharacterId(characterId);
    setSelectedMode(mode);
    setSelectedStageId(stageId ?? 'dawn-city');
    setFinishedRun(null);
    setRunId(latestRunId.current);
    setScreen('run');
  }

  const menu = <MainMenu onStart={() => setScreen('mode-select')} onRankings={openRankings} onHistory={openPersonalHistory}
    onAchievements={() => openAchievements('menu')} onShop={() => openShop('menu')}
    topRun={overallBest} topRunLoading={bestLoading} topRunError={bestError}
    showControlsHelp={shouldShowRunnerTutorial()} audioPreferences={audioPreferences}
    onAudioPreferencesChange={setAudioPreferences} onUnlockAudio={() => browserRunnerAudio.unlock()}
    authMode={auth.mode} recordSource="local" authStatus={auth.status} authError={auth.error}
    accountName={auth.account?.name ?? null} accountUsername={auth.account?.username ?? null}
    onSignIn={() => { void auth.signIn(); }}
    onSignOut={() => { void auth.signOut(); }} />;

  const menuWithRecovery = <>
    {menu}
    {sessionRecoveryReady && screen === 'menu' && sessionEnvelope?.kind === 'active' &&
      <ResumeSessionDialog envelope={sessionEnvelope} warning={sessionStorageWarning}
        confirmingNewRun={confirmingNewRun} onResume={resumeSavedRun}
        onRequestNewRun={() => setConfirmingNewRun(true)} onConfirmNewRun={confirmDiscardAndStart}
        onCancelNewRun={() => setConfirmingNewRun(false)} onDismissWarning={() => setSessionStorageWarning(null)} />}
    {sessionStorageWarning && !(sessionRecoveryReady && screen === 'menu' && sessionEnvelope?.kind === 'active') &&
      <div className="runner-session-warning" role="alert">{sessionStorageWarning}
        <button type="button" onClick={() => setSessionStorageWarning(null)} aria-label="안내 닫기">×</button>
      </div>}
  </>;

  if (auth.mode === 'configuration-error' || (auth.mode === 'cloud' && auth.status !== 'signed-in')) return menuWithRecovery;

  if (screen === 'character-select') {
    return (
      <CharacterSelect selectedCharacterId={selectedCharacterId}
        profile={profile}
        onShop={() => openShop('character-select')}
        onConfirm={(characterId) => {
          setSelectedCharacterId(characterId);
          if (selectedMode === 'story') setScreen('stage-select');
          else startRun(characterId);
        }}
        onBack={() => setScreen('menu')} />
    );
  }

  if (screen === 'mode-select') {
    return <ModeSelect onSelect={(mode) => {
      setSelectedMode(mode);
      setScreen('character-select');
    }} onBack={() => setScreen('menu')} />;
  }

  if (screen === 'stage-select') {
    return <StageSelect profile={profile} selectedStageId={selectedStageId}
      onSelect={setSelectedStageId}
      onStart={() => startRun(selectedCharacterId, 'story', selectedStageId)}
      onAchievements={() => openAchievements('stage-select')}
      onBack={() => setScreen('character-select')} />;
  }

  if (screen === 'achievements') {
    return <AchievementsScreen profile={profile} onBack={() => setScreen(achievementsReturnTo)} />;
  }

  if (screen === 'shop') {
    return <ShopScreen profile={profile} initialCharacterId={selectedCharacterId}
      onBack={() => setScreen(shopReturnTo)} onPurchase={handleCosmeticPurchase}
      onEquip={handleCosmeticEquip} onUnequip={handleCosmeticUnequip} />;
  }

  if (screen === 'run') {
    const currentRunId = runId;
    const trailCosmeticId = (profile.equippedCosmeticIdsByCharacter[selectedCharacterId] ?? [])
      .find((cosmeticId) => getCosmetic(cosmeticId)?.kind === 'trail') ?? null;
    return (
      <Suspense fallback={<main className="run-screen run-screen--loading" role="status">게임을 준비하고 있어요…</main>}>
        <RunScreen key={`${currentRunId}:${selectedCharacterId}`} characterId={selectedCharacterId}
          mode={selectedMode} storyStageId={selectedMode === 'story' ? selectedStageId : null}
          trailCosmeticId={trailCosmeticId}
          audioPreferences={audioPreferences} onAudioPreferencesChange={setAudioPreferences}
          onUnlockAudio={() => browserRunnerAudio.unlock()}
          initialSession={initialRunSession}
          onCheckpoint={saveActiveSession}
          onTerminalCheckpoint={(result, outcome) => { saveTerminalSession(result, outcome, false); }}
          storageWarning={sessionStorageWarning}
          onExit={() => {
            latestRunId.current += 1;
            setScreen('menu');
          }}
          onFinish={(result, outcome) => {
            if (latestRunId.current !== currentRunId || submittedRunIds.current.has(currentRunId)) return;
            browserRunnerAudio.playEffect(result.finishReason === 'stage-complete' ? 'victory' : 'game-over');
            submittedRunIds.current.add(currentRunId);
            saveTerminalSession(result, outcome, false);
            const persistentRunId = sessionRunRef.current?.runId ?? `${currentRunId}`;
            const stableRunKey = `${persistentRunId}:${result.finishedAtIso}`;
            const settlement = settleRun(browserPlayerProfileStore, stableRunKey, result);
            const achievements = recordRunAndUnlock(browserPlayerProfileStore,
              stableRunKey, result);
            setProfile(achievements.profile);
            saveTerminalSession(result, outcome, true, {
              settlement,
              newlyUnlockedAchievementIds: achievements.newlyUnlockedAchievementIds,
              achievementBonusCoins: achievements.bonusCoins,
            });
            setFinishedRun({ runId: currentRunId, result, outcome, submittedRank: null,
              submissionPending: true, recordError: null, settlement,
              newlyUnlockedAchievementIds: achievements.newlyUnlockedAchievementIds,
              achievementBonusCoins: achievements.bonusCoins });
            setScreen('result');
            void runGateway.submitRun(result).then((receipt) => {
              if (latestRunId.current !== currentRunId) return;
              setFinishedRun((current) => current?.runId === currentRunId
                ? { ...current, submittedRank: receipt.personalBest?.rank ?? null, submissionPending: false }
                : current);
            }).catch((error: unknown) => {
              if (latestRunId.current !== currentRunId) return;
              if (error instanceof RunApiError && error.status === 401) void auth.signIn();
              setFinishedRun((current) => current?.runId === currentRunId
                ? { ...current, submissionPending: false,
                  recordError: error instanceof RunApiError ? error.message : '기록을 저장하지 못했습니다. 이번 결과는 이 화면에서 확인할 수 있습니다.' }
                : current);
            });
          }} />
      </Suspense>
    );
  }

  if (screen === 'result' && finishedRun) {
    const bestDistance = (auth.mode === 'cloud' ? overallBest?.distanceMeters :
      browserPersonalBestStore.getBest(finishedRun.result.characterId)?.distanceMeters) ??
      Math.round(finishedRun.result.distanceMeters);
    if (finishedRun.result.mode === 'story') {
      return <StoryResult result={finishedRun.result} settlement={finishedRun.settlement}
        newlyUnlockedAchievementIds={finishedRun.newlyUnlockedAchievementIds}
        achievementBonusCoins={finishedRun.achievementBonusCoins}
        onRetry={() => acknowledgeTerminal(() => startRun(finishedRun.result.characterId, 'story', finishedRun.result.storyStageId ?? 'dawn-city'))}
        onNextStage={(stageId) => acknowledgeTerminal(() => startRun(finishedRun.result.characterId, 'story', stageId))}
        onStageSelect={() => acknowledgeTerminal(() => setScreen('stage-select'))} />;
    }
    return (
      <RunResult result={finishedRun.result} outcome={finishedRun.outcome} bestDistanceMeters={bestDistance}
        settlement={finishedRun.settlement}
        newlyUnlockedAchievementIds={finishedRun.newlyUnlockedAchievementIds}
        achievementBonusCoins={finishedRun.achievementBonusCoins}
        submittedRank={finishedRun.submittedRank} recordPending={finishedRun.submissionPending}
        recordError={finishedRun.recordError ?? bestError} overallBest={overallBest}
        onRetry={() => acknowledgeTerminal(() => startRun(finishedRun.result.characterId))}
        onChooseCharacter={() => acknowledgeTerminal(() => setScreen('character-select'))}
        onRankings={() => acknowledgeTerminal(openRankings)} />
    );
  }

  if (screen === 'rankings') {
    return (
      <RankingScreen rows={rankingRows} loading={rankingLoading} error={rankingError} source="local"
        onBack={() => setScreen('menu')} />
    );
  }

  if (screen === 'personal-history') {
    const historyIsCurrent = historyState.requestId === historyRequestId;
    return <PersonalHistoryScreen rows={historyIsCurrent ? historyState.rows : []}
      loading={!historyIsCurrent || historyState.loading} error={historyIsCurrent ? historyState.error : null}
      hasMore={historyIsCurrent && historyState.cursor !== null} onLoadMore={() => { void loadMorePersonalHistory(); }}
      onRetry={openPersonalHistory}
      onBack={() => setScreen('menu')} />;
  }

  return menuWithRecovery;
}

export default App;
