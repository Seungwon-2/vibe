import { useEffect, useRef, useState } from 'react';
import { CharacterSelect } from './app/screens/CharacterSelect';
import { MainMenu } from './app/screens/MainMenu';
import { RankingScreen } from './app/screens/RankingScreen';
import { RunResult } from './app/screens/RunResult';
import { RunScreen } from './app/screens/RunScreen';
import type { CharacterId } from './game/characters/characterTypes';
import type { RunnerFinishOutcome, RunnerResult } from './game/runner/runnerTypes';
import { browserPersonalBestStore } from './services/PersonalBestStore';
import { browserRunGateway } from './services/LocalRunGateway';
import type { RankedRunRecord } from './services/RunGateway';

type AppScreen = 'menu' | 'character-select' | 'run' | 'result' | 'rankings';
type FinishedRun = {
  runId: number;
  result: RunnerResult;
  outcome: RunnerFinishOutcome;
  submittedRank: number | null;
  submissionPending: boolean;
  recordError: string | null;
};
type BestLoadState = { key: string; record: RankedRunRecord | null; error: string | null };
type RankingLoadState = { requestId: number; rows: RankedRunRecord[]; error: string | null };

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<AppScreen>('menu');
  const [selectedCharacterId, setSelectedCharacterId] = useState<CharacterId>('player-default');
  const [finishedRun, setFinishedRun] = useState<FinishedRun | null>(null);
  const [runId, setRunId] = useState(0);
  const latestRunId = useRef(0);
  const submittedRunIds = useRef(new Set<number>());
  const [bestState, setBestState] = useState<BestLoadState>({ key: '', record: null, error: null });
  const [rankingRequestId, setRankingRequestId] = useState(0);
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

  function startRun(characterId = selectedCharacterId): void {
    latestRunId.current += 1;
    setSelectedCharacterId(characterId);
    setFinishedRun(null);
    setRunId(latestRunId.current);
    setScreen('run');
  }

  if (screen === 'character-select') {
    return (
      <CharacterSelect selectedCharacterId={selectedCharacterId}
        onConfirm={(characterId) => startRun(characterId)}
        onBack={() => setScreen('menu')} />
    );
  }

  if (screen === 'run') {
    const currentRunId = runId;
    return (
      <RunScreen key={`${currentRunId}:${selectedCharacterId}`} characterId={selectedCharacterId}
        onExit={() => {
          latestRunId.current += 1;
          setScreen('menu');
        }}
        onFinish={(result, outcome) => {
          if (latestRunId.current !== currentRunId || submittedRunIds.current.has(currentRunId)) return;
          submittedRunIds.current.add(currentRunId);
          setFinishedRun({ runId: currentRunId, result, outcome, submittedRank: null,
            submissionPending: true, recordError: null });
          setScreen('result');
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
    return (
      <RunResult result={finishedRun.result} outcome={finishedRun.outcome} bestDistanceMeters={bestDistance}
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

  return <MainMenu onStart={() => setScreen('character-select')} onRankings={openRankings}
    topRun={overallBest} topRunLoading={bestLoading} topRunError={bestError} />;
}

export default App;
