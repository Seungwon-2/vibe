import { useEffect, useRef, useState } from 'react';
import { CharacterSelect } from './app/screens/CharacterSelect';
import { MainMenu } from './app/screens/MainMenu';
import { ModeSelect } from './app/screens/ModeSelect';
import { RankingScreen } from './app/screens/RankingScreen';
import { RunResult } from './app/screens/RunResult';
import { StoryResult } from './app/screens/StoryResult';
import { AchievementsScreen } from './app/screens/AchievementsScreen';
import { ShopScreen } from './app/screens/ShopScreen';
import { RunScreen } from './app/screens/RunScreen';
import { StageSelect } from './app/screens/StageSelect';
import type { CharacterId } from './game/characters/characterTypes';
import type { RunnerFinishOutcome, RunnerMode, RunnerResult, StoryStageId } from './game/runner/runnerTypes';
import { browserPersonalBestStore } from './services/PersonalBestStore';
import { browserRunGateway } from './services/LocalRunGateway';
import type { RankedRunRecord } from './services/RunGateway';
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
type BestLoadState = { key: string; record: RankedRunRecord | null; error: string | null };
type RankingLoadState = { requestId: number; rows: RankedRunRecord[]; error: string | null };

function App(): React.JSX.Element {
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
  const bestRequestKey = screen === 'menu' ? 'menu'
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
    void browserRunGateway.getBest().then((best) => {
      if (current) setBestState({ key: bestRequestKey, record: best, error: null });
    }).catch(() => {
      if (current) setBestState({ key: bestRequestKey, record: null, error: '로컬 기록을 불러오지 못했습니다.' });
    });
    return () => { current = false; };
  }, [bestRequestKey]);

  useEffect(() => {
    if (screen !== 'rankings') return;
    let current = true;
    void browserRunGateway.getRanking().then((rows) => {
      if (current) setRankingState({ requestId: rankingRequestId, rows, error: null });
    }).catch(() => {
      if (current) setRankingState({ requestId: rankingRequestId, rows: [],
        error: '기록을 불러오지 못했습니다. 메인 메뉴로 돌아가 다시 시도해 주세요.' });
    });
    return () => { current = false; };
  }, [screen, rankingRequestId]);

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
    latestRunId.current += 1;
    setSelectedCharacterId(characterId);
    setSelectedMode(mode);
    setSelectedStageId(stageId ?? 'dawn-city');
    setFinishedRun(null);
    setRunId(latestRunId.current);
    setScreen('run');
  }

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
            submissionPending: result.mode !== 'story', recordError: null, settlement,
            newlyUnlockedAchievementIds: achievements.newlyUnlockedAchievementIds,
            achievementBonusCoins: achievements.bonusCoins });
          setScreen('result');
          if (result.mode === 'story') return;
          void browserRunGateway.submitRun(result).then((record) => {
            if (latestRunId.current !== currentRunId) return;
            setFinishedRun((current) => current?.runId === currentRunId
              ? { ...current, submittedRank: record.rank, submissionPending: false }
              : current);
          }).catch(() => {
            if (latestRunId.current !== currentRunId) return;
            setFinishedRun((current) => current?.runId === currentRunId
              ? { ...current, submissionPending: false, recordError: '기록을 저장하지 못했습니다. 이번 결과는 이 화면에서 확인할 수 있습니다.' }
              : current);
          });
        }} />
    );
  }

  if (screen === 'result' && finishedRun) {
    const bestDistance = browserPersonalBestStore.getBest(finishedRun.result.characterId)?.distanceMeters ??
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

  return <MainMenu onStart={() => setScreen('mode-select')} onRankings={openRankings}
    onAchievements={() => openAchievements('menu')}
    onShop={() => openShop('menu')}
    topRun={overallBest} topRunLoading={bestLoading} topRunError={bestError}
    showControlsHelp={shouldShowRunnerTutorial()} audioPreferences={audioPreferences}
    onAudioPreferencesChange={setAudioPreferences} onUnlockAudio={() => browserRunnerAudio.unlock()} />;
}

export default App;
