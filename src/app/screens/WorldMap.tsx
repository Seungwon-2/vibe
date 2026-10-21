import type { StageDefinition, WorldDefinition } from '../../game/content/stageTypes';

type WorldMapProps = {
  worlds: WorldDefinition[];
  unlockedStageOrdinal: number;
  onSelect: (stage: StageDefinition) => void;
  onBack: () => void;
};

export function WorldMap({ worlds, unlockedStageOrdinal, onSelect, onBack }: WorldMapProps): React.JSX.Element {
  return (
    <section className="map-panel" aria-labelledby="world-map-title">
      <header className="panel-heading">
        <div><p className="eyebrow">CAMPAIGN</p><h1 id="world-map-title">월드 선택</h1></div>
        <button onClick={onBack}>메뉴</button>
      </header>
      <div className="world-grid">
        {worlds.map((world) => (
          <article className={`world-card world-${world.theme}`} key={world.id}>
            <h2>{world.name}</h2>
            <p>{world.subtitle}</p>
            <ol className="stage-list">
              {world.stages.map((stage) => {
                const unlocked = stage.ordinal <= unlockedStageOrdinal;
                return (
                  <li key={stage.id}>
                    <button disabled={!unlocked} onClick={() => onSelect(stage)} aria-label={`${stage.name}${unlocked ? '' : ' 잠김'}`}>
                      <span>STAGE {stage.ordinal > 4 ? stage.ordinal - 4 : stage.ordinal}</span>
                      <strong>{stage.name}</strong>
                      <span>{stage.boss ? 'BOSS' : stage.id === 'mine-3' ? 'CHALLENGE' : unlocked ? '열림' : '잠김'}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}
