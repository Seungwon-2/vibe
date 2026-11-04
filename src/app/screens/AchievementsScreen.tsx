import { ACHIEVEMENTS } from '../../services/AchievementCatalog';
import type { PlayerProfile } from '../../services/PlayerProfile';

export type AchievementsScreenProps = { profile: PlayerProfile; onBack(): void };

export function AchievementsScreen({ profile, onBack }: AchievementsScreenProps): React.JSX.Element {
  return (
    <main className="progression-screen">
      <section className="progression-panel achievement-panel" aria-labelledby="achievements-title">
        <button className="progression-back" type="button" onClick={onBack}>뒤로</button>
        <p className="eyebrow">RUNNER ACHIEVEMENTS</p>
        <h1 id="achievements-title">모험의 기록</h1>
        <p className="progression-intro">도전을 달성하고 코인과 꾸미기 보상을 모아보세요.</p>
        <div className="achievement-wallet">보유 코인 <strong>{profile.walletCoins.toLocaleString()}</strong></div>
        <div className="achievement-list">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = profile.unlockedAchievementIds.includes(achievement.id);
            const metricKey = achievement.metric === 'character-distance'
              ? `character-distance:${achievement.characterId}` : achievement.metric;
            const progress = Math.min(achievement.threshold, profile.achievementProgress[metricKey] ?? 0);
            return <article className={'achievement-card' + (unlocked ? ' is-unlocked' : '')} key={achievement.id}>
              <span className="achievement-card__medal" aria-hidden="true">{unlocked ? '✦' : '◇'}</span>
              <div><strong>{achievement.name}</strong>
                <span className={'achievement-card__mode achievement-card__mode--' + achievement.modeScope}>
                  {achievement.modeScope === 'endless' ? '무한 모드' : achievement.modeScope === 'story' ? '스토리 모드' : '무한 · 스토리'}
                </span>
                <p>{achievement.description}</p>
                {!unlocked && <small>{Math.floor(progress).toLocaleString()} / {achievement.threshold.toLocaleString()}</small>}
              </div>
              <span className="achievement-card__reward">{unlocked ? '달성' : `🪙 ${achievement.rewardCoins}`}</span>
            </article>;
          })}
        </div>
      </section>
    </main>
  );
}
