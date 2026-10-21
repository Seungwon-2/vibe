import { useCallback, useEffect, useMemo, useState } from 'react';
import { GameHud } from './app/components/GameHud';
import { MainMenu } from './app/screens/MainMenu';
import { RankingScreen } from './app/screens/RankingScreen';
import { ResultScreen } from './app/screens/ResultScreen';
import { WorldMap } from './app/screens/WorldMap';
import { getStage, getStageByOrdinal, stageCatalog, worlds } from './game/content/worldCatalog';
import type { GameEvent } from './game/events';
import { PhaserGame } from './game/PhaserGame';
import type { RunStateSnapshot } from './game/systems/RunState';
import { gameGateway } from './services/MemoryGameGateway';
import type { PlayerSave, StageRankingRow } from './services/GameGateway';

type Screen = 'menu' | 'map' | 'game' | 'result' | 'rankings';
type ResultKind = 'clear' | 'game-over' | 'timeout';

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('menu');
  const [save, setSave] = useState<PlayerSave | null>(null);
  const [stageId, setStageId] = useState('ruins-1');
  const [gameState, setGameState] = useState<RunStateSnapshot | null>(null);
  const [timeRemainingMs, setTimeRemainingMs] = useState<number | null>(null);
  const [effectRemainingMs, setEffectRemainingMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<ResultKind>('clear');
  const [rankingStageId, setRankingStageId] = useState('ruins-1');
  const [rankingRows, setRankingRows] = useState<StageRankingRow[]>([]);
  const [attempt, setAttempt] = useState(0);
  const stage = useMemo(() => getStage(stageId), [stageId]);
  const unlockedStageOrdinal = save?.unlockedStageOrdinal ?? 1;

  useEffect(() => {
    void gameGateway.getSave().then(setSave);
  }, []);

  const startNewGame = useCallback(() => {
    if (save && !window.confirm('저장된 이어하기 기록을 지우고 새 게임을 시작할까요?')) return;
    void gameGateway.deleteSave().then(() => {
      setSave(null);
      setStageId('ruins-1');
      setScreen('map');
    });
  }, [save]);

  const continueGame = useCallback(() => {
    if (!save) return;
    setStageId(save.stageId);
    setGameState(null);
    setScreen('game');
  }, [save]);

  const beginStage = useCallback((nextStageId: string) => {
    const nextStage = getStage(nextStageId);
    if (!save || save.stageId !== nextStageId) {
      const nextSave: PlayerSave = {
        worldId: nextStage.worldId,
        stageId: nextStage.id,
        checkpointId: 'start',
        lives: save?.worldId === nextStage.worldId ? save.lives : 5,
        stageScore: 0,
        coins: 0,
        collectedCoinIds: [],
        unlockedStageOrdinal: save?.unlockedStageOrdinal ?? nextStage.ordinal,
        characterId: 'default-hero',
      };
      setSave(nextSave);
      void gameGateway.putSave(nextSave);
    }
    setStageId(nextStageId);
    setGameState(null);
    setTimeRemainingMs(nextStage.timeLimitSeconds ? nextStage.timeLimitSeconds * 1_000 : null);
    setEffectRemainingMs(0);
    setPaused(false);
    setAttempt((value) => value + 1);
    setScreen('game');
  }, [save]);

  const onGameEvent = useCallback((event: GameEvent) => {
    if (event.type === 'state') {
      const nextState = event.state;
      setGameState(nextState);
      setTimeRemainingMs(event.timeRemainingMs);
      setEffectRemainingMs(event.effectRemainingMs);
      return;
    }
    if (event.type === 'checkpoint') {
      const nextState = event.state;
      setGameState(nextState);
      const nextSave: PlayerSave = {
        worldId: nextState.worldId as PlayerSave['worldId'],
        stageId: nextState.stageId,
        checkpointId: nextState.checkpointId,
        lives: nextState.lives,
        stageScore: nextState.stageScore,
        coins: nextState.coins,
        collectedCoinIds: nextState.collectedCoinIds,
        enemyStomps: nextState.enemyStomps,
        extraLifeOverflow: nextState.extraLifeOverflow,
        elapsedMs: nextState.elapsedMs,
        unlockedStageOrdinal: nextState.unlockedStageOrdinal,
        characterId: 'default-hero',
      };
      setSave(nextSave);
      void gameGateway.putSave(nextSave);
      return;
    }
    setGameState(event.state);
    if (event.type === 'stage-clear') {
      setResult('clear');
      setScreen('result');
      const nextStage = getStageByOrdinal(event.state.unlockedStageOrdinal);
      if (!nextStage) {
        setSave(null);
        void gameGateway.deleteSave();
        void gameGateway.submitClear({
          stageId: event.state.stageId,
          displayName: '플레이어',
          score: event.state.stageScore,
          clearTimeMs: event.state.elapsedMs,
        });
        return;
      }
      const lives = nextStage.worldId !== event.state.worldId ? 5 : event.state.lives;
      const nextSave: PlayerSave = {
        worldId: nextStage.worldId,
        stageId: nextStage.id,
        checkpointId: 'start',
        lives,
        stageScore: 0,
        coins: 0,
        unlockedStageOrdinal: event.state.unlockedStageOrdinal,
        characterId: 'default-hero',
      };
      setSave(nextSave);
      void gameGateway.putSave(nextSave);
      void gameGateway.submitClear({
        stageId: event.state.stageId,
        displayName: '플레이어',
        score: event.state.stageScore,
        clearTimeMs: event.state.elapsedMs,
      });
    } else {
      setResult(event.type);
      setScreen('result');
    }
  }, []);

  const showRankings = useCallback(() => {
    setScreen('rankings');
    void gameGateway.getRanking(rankingStageId).then(setRankingRows);
  }, [rankingStageId]);

  const changeRankingStage = useCallback((nextStageId: string) => {
    setRankingStageId(nextStageId);
    void gameGateway.getRanking(nextStageId).then(setRankingRows);
  }, []);

  const nextStage = getStageByOrdinal(stage.ordinal + 1);
  const retry = useCallback(() => {
    const freshSave: PlayerSave = {
      worldId: stage.worldId,
      stageId,
      checkpointId: 'start',
      lives: result === 'game-over' ? 5 : save?.lives ?? 5,
      stageScore: 0,
      coins: 0,
      collectedCoinIds: [],
      unlockedStageOrdinal: save?.unlockedStageOrdinal ?? stage.ordinal,
      characterId: 'default-hero',
    };
    setSave(freshSave);
    void gameGateway.putSave(freshSave);
    beginStage(stageId);
  }, [beginStage, result, save, stage, stageId]);
  const continueAfterClear = useCallback(() => {
    if (nextStage) beginStage(nextStage.id);
    else setScreen('menu');
  }, [beginStage, nextStage]);

  return (
    <main className="landing-shell">
      <div className="title-card">
        {screen === 'menu' && <MainMenu canContinue={Boolean(save)} onNewGame={startNewGame} onContinue={continueGame} onRankings={showRankings} />}
        {screen === 'map' && <WorldMap worlds={worlds} unlockedStageOrdinal={unlockedStageOrdinal} onSelect={(selected) => beginStage(selected.id)} onBack={() => setScreen('menu')} />}
        {screen === 'rankings' && <RankingScreen rows={rankingRows} stageId={rankingStageId} stages={stageCatalog} onStageChange={changeRankingStage} onBack={() => setScreen('menu')} />}
        {screen === 'game' && <>
          <GameHud stageName={stage.name} state={gameState} timeRemainingMs={timeRemainingMs} effectRemainingMs={effectRemainingMs} paused={paused} onTogglePause={() => setPaused((value) => !value)} onExit={() => setScreen('menu')} />
          <PhaserGame key={`${stageId}-${attempt}`} stageId={stageId} initialLives={save?.lives ?? 5} initialSave={save} paused={paused} onEvent={onGameEvent} />
          <p className="control-hint">방향키 또는 A / D 이동 · Space 또는 W / ↑ 점프 · Shift 달리기</p>
        </>}
        {screen === 'result' && <ResultScreen kind={result} stageName={stage.name} score={gameState?.stageScore ?? 0} isFinal={stage.ordinal === 8} onContinue={continueAfterClear} onRetry={retry} onMenu={() => setScreen('menu')} />}
      </div>
    </main>
  );
}

export default App;
