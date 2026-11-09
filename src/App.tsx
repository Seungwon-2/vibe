import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { CharacterSelect } from './app/screens/CharacterSelect';
import { MainMenu } from './app/screens/MainMenu';
import { ModeSelect } from './app/screens/ModeSelect';
import { RankingScreen } from './app/screens/RankingScreen';
import { RunResult } from './app/screens/RunResult';
import { StoryResult } from './app/screens/StoryResult';
import { AchievementsScreen } from './app/screens/AchievementsScreen';
import { ShopScreen } from './app/screens/ShopScreen';
import { StageSelect } from './app/screens/StageSelect';
import type { CharacterId } from './game/characters/characterTypes';
import type { RunnerFinishOutcome, RunnerMode, RunnerResult, StoryStageId } from './game/runner/runnerTypes';
import { browserPersonalBestStore } from './services/PersonalBestStore';
import { browserRunGateway } from './services/LocalRunGateway';
import type { PersonalBestRecord, PublicLeaderboardRecord, RunGateway } from './services/RunGateway';
import { AuthenticatedRunGateway, RunApiError } from './services/AuthenticatedRunGateway';
import { readEntraSettings } from './auth/entraConfig';
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

const RunScreen = lazy(async () => {
  const module = await import('./app/screens/RunScreen');
  return { default: module.RunScreen };
});

type AppScreen = 'menu' | 'mode-select' | 'character-select' | 'stage-select' | 'run' | 'result' | 'rankings' | 'achievements' | 'shop';
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

function App(): React.JSX.Element {
  const auth = useRunnerAuth();
  const signIn = auth.signIn;
  const runGateway = useMemo<RunGateway>(() => auth.mode === 'cloud'
    ? new AuthenticatedRunGateway(readEntraSettings().apiBaseUrl, auth.acquireApiToken)
    : browserRunGateway, [auth.acquireApiToken, auth.mode]);
  const canUseRecords = auth.mode === 'local' || auth.status === 'signed-in';
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
  const [bestState, setBestState] = useState<BestLoadState>({ key: '', record: null, error: null });
  const [rankingRequestId, setRankingRequestId] = useState(0);
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

  function openRankings(): void {
    setRankingRequestId((requestId) => requestId + 1);
    setScreen('rankings');
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

  function startRun(characterId = selectedCharacterId, mode = selectedMode, stageId = mode === 'story' ? selectedStageId : null): void {
    if (!canUseRecords) return;
    latestRunId.current += 1;
    setSelectedCharacterId(characterId);
    setSelectedMode(mode);
    setSelectedStageId(stageId ?? 'dawn-city');
    setFinishedRun(null);
    setRunId(latestRunId.current);
    setScreen('run');
  }

  const menu = <MainMenu onStart={() => setScreen('mode-select')} onRankings={openRankings}
    onAchievements={() => openAchievements('menu')} onShop={() => openShop('menu')}
    topRun={overallBest} topRunLoading={bestLoading} topRunError={bestError}
    showControlsHelp={shouldShowRunnerTutorial()} audioPreferences={audioPreferences}
    onAudioPreferencesChange={setAudioPreferences} onUnlockAudio={() => browserRunnerAudio.unlock()}
    authMode={auth.mode} authStatus={auth.status} authError={auth.error}
    accountName={auth.account?.name ?? null} onSignIn={() => { void auth.signIn(); }}
    onSignOut={() => { void auth.signOut(); }} />;

  if (auth.mode === 'configuration-error' || (auth.mode === 'cloud' && auth.status !== 'signed-in')) return menu;

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
          onExit={() => {
            latestRunId.current += 1;
            setScreen('menu');
          }}
          onFinish={(result, outcome) => {
            if (latestRunId.current !== currentRunId || submittedRunIds.current.has(currentRunId)) return;
            browserRunnerAudio.playEffect(result.finishReason === 'stage-complete' ? 'victory' : 'game-over');
            submittedRunIds.current.add(currentRunId);
            const settlement = settleRun(browserPlayerProfileStore, `${currentRunId}:${result.finishedAtIso}`, result);
            const achievements = recordRunAndUnlock(browserPlayerProfileStore,
              `${currentRunId}:${result.finishedAtIso}`, result);
            setProfile(achievements.profile);
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
        onRetry={() => startRun(finishedRun.result.characterId, 'story', finishedRun.result.storyStageId ?? 'dawn-city')}
        onNextStage={(stageId) => startRun(finishedRun.result.characterId, 'story', stageId)}
        onStageSelect={() => setScreen('stage-select')} />;
    }
    return (
      <RunResult result={finishedRun.result} outcome={finishedRun.outcome} bestDistanceMeters={bestDistance}
        settlement={finishedRun.settlement}
        newlyUnlockedAchievementIds={finishedRun.newlyUnlockedAchievementIds}
        achievementBonusCoins={finishedRun.achievementBonusCoins}
        submittedRank={finishedRun.submittedRank} recordPending={finishedRun.submissionPending}
        recordError={finishedRun.recordError ?? bestError} overallBest={overallBest}
        onRetry={() => startRun(finishedRun.result.characterId)}
        onChooseCharacter={() => setScreen('character-select')}
        onRankings={openRankings} />
    );
  }

  if (screen === 'rankings') {
    return (
      <RankingScreen rows={rankingRows} loading={rankingLoading} error={rankingError}
        onBack={() => setScreen('menu')} />
    );
  }

  return menu;
}

export default App;
