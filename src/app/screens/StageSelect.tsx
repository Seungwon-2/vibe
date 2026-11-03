import { STORY_STAGES } from '../../game/runner/storyConfig';
import type { StoryStageId } from '../../game/runner/runnerTypes';
import type { PlayerProfile } from '../../services/PlayerProfile';
import { StageBackdropPreview } from '../components/StageBackdropPreview';

export type StageSelectProps = {
  profile: PlayerProfile;
  selectedStageId: StoryStageId;
  onSelect(stageId: StoryStageId): void;
  onStart(): void;
  onAchievements(): void;
  onBack(): void;
};

export function StageSelect({ profile, selectedStageId, onSelect, onStart, onAchievements, onBack }: StageSelectProps): React.JSX.Element {
  const selected = STORY_STAGES.find((stage) => stage.id === selectedStageId) ?? STORY_STAGES[0];

  return (
    <main className="progression-screen progression-screen--stages">
      <section className="progression-panel" aria-labelledby="stage-select-title">
        <button className="progression-back" type="button" onClick={onBack}>← 캐릭터</button>
        <p className="eyebrow">STORY COURSE</p>
        <h1 id="stage-select-title">달릴 스테이지를 선택하세요</h1>
        <p className="progression-intro">코인을 모으고 도전을 완료해 다음 코스와 러너를 해금하세요.</p>
        <div className="stage-options">
          {STORY_STAGES.map((stage) => {
            const unlocked = profile.unlockedStageIds.includes(stage.id);
            const cleared = profile.clearedStageIds.includes(stage.id);
            const chosen = selectedStageId === stage.id;
            const unlockCharacter = stage.unlockCharacterId;
            const status = cleared ? '완주 완료' : unlocked ? '선택 가능'
              : '이전 스테이지 완주 시 해금' + (unlockCharacter ? ' · ' + unlockCharacter : '');
            return (
              <button className={'stage-option' + (chosen ? ' is-selected' : '') + (unlocked ? '' : ' is-locked')}
                type="button" key={stage.id} disabled={!unlocked} aria-pressed={chosen}
                onClick={() => onSelect(stage.id)}>
                <span className="stage-option__scene">
                  <StageBackdropPreview biomeId={stage.biomeId} stageName={stage.name} />
                  <span className="stage-option__order">STAGE {String(stage.order).padStart(2, '0')}</span>
                  <span className="stage-option__scene-status">{cleared ? '✓ 완주' : unlocked ? '달릴 수 있어요' : '🔒 잠김'}</span>
                </span>
                <span className="stage-option__details">
                  <strong>{stage.name}</strong>
                  <span className="stage-option__meta">{stage.lengthMeters.toLocaleString()}m 코스 <i aria-hidden="true">·</i> 코인 목표 {stage.coinTarget}개</span>
                  <span className="stage-option__status">{status}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="stage-select-footer">
          <button className="progression-secondary" type="button" onClick={onBack}>뒤로</button>
          <button className="progression-secondary" type="button" onClick={onAchievements}>업적</button>
          <button className="progression-primary" type="button" disabled={!profile.unlockedStageIds.includes(selected.id)}
            onClick={onStart}>{selected.name} 시작</button>
        </div>
      </section>
    </main>
  );
}
