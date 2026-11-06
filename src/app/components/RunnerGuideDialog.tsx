import { useEffect, useRef } from 'react';
import { getCharacterPassive } from '../../game/characters/characterAbilities';
import type { CharacterDefinition } from '../../game/characters/characterTypes';
import { RUNNER_CONFIG } from '../../game/runner/runnerConfig';
import type { RunnerMode } from '../../game/runner/runnerTypes';
import { CharacterAbilityIcon } from './CharacterAbilityIcon';
import '../../styles/runnerGuide.css';

export type RunnerGuideDialogProps = Readonly<{
  mode: RunnerMode;
  character: CharacterDefinition;
  variant: 'first-run' | 'pause-review';
  portrait: boolean;
  onStart(): void;
  onClose(): void;
}>;

export type RunnerGuideItem = Readonly<{ icon: string; title: string; description: string }>;

function getRunnerGuideItems(mode: RunnerMode): readonly RunnerGuideItem[] {
  const endless = mode === 'endless';
  return [
    {
      icon: '🪙',
      title: '코인',
      description: '달리면서 모은 코인은 런이 끝날 때 지갑에 한 번 적립됩니다.',
    },
    {
      icon: '⏱️',
      title: endless ? '보너스 게이트' : '시간 아이템',
      description: endless
        ? `무한 달리기에서는 게이트를 통과할 때마다 제한 시간이 ${RUNNER_CONFIG.gateBonusMs / 1_000}초 늘어납니다. 시간 회복 아이템은 등장하지 않습니다.`
        : `스토리 코스의 시간 아이템은 제한 시간 대신 ${RUNNER_CONFIG.storySpeedBoostMs / 1_000}초 동안 속도를 ${Math.round(RUNNER_CONFIG.storySpeedBoostRatio * 100)}% 높여줍니다.`,
    },
    {
      icon: '⚡',
      title: '속도 부스트',
      description: `${RUNNER_CONFIG.speedPickupMultiplier}배 속도로 ${RUNNER_CONFIG.speedPickupDurationMs / 1_000}초 달립니다. 빠르게 다가오는 장애물에 대비하세요.`,
    },
    {
      icon: '✦',
      title: '거대화',
      description: `${RUNNER_CONFIG.giantDurationMs / 1_000}초 동안 몸집과 속도가 ${RUNNER_CONFIG.giantSpeedMultiplier}배가 되고 일반 장애물을 무시합니다. 낭떠러지는 피해야 합니다.`,
    },
  ];
}

export function RunnerGuideDialog({ mode, character, variant, portrait, onStart, onClose }: RunnerGuideDialogProps): React.JSX.Element {
  const actionRef = useRef<HTMLButtonElement>(null);
  const passive = getCharacterPassive(character.id);
  const firstRun = variant === 'first-run';
  const items = getRunnerGuideItems(mode);

  useEffect(() => {
    actionRef.current?.focus();
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (!firstRun) onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    event.preventDefault();
    actionRef.current?.focus();
  }

  return (
    <div className={`runner-overlay runner-overlay--guide${portrait ? ' is-portrait' : ''}`}
      role="dialog" aria-modal="true" aria-labelledby="runner-guide-title" onKeyDown={handleKeyDown}>
      <section className="runner-guide-card">
        <header className="runner-guide-card__header">
          <span className="eyebrow">RUNNER GUIDE</span>
          <h2 id="runner-guide-title">조작법과 아이템 안내</h2>
          <p>{firstRun ? '출발 전에 조작과 아이템 효과를 확인해 보세요.' : '필요할 때 언제든 다시 확인할 수 있어요.'}</p>
        </header>

        <section className="runner-guide-controls" aria-labelledby="runner-guide-controls-title">
          <h3 id="runner-guide-controls-title">조작법</h3>
          <ul>
            <li><span className="runner-guide-controls__keys"><kbd>Space</kbd> / <kbd>↑</kbd></span><span>점프, 공중에서 한 번 더 눌러 이단 점프</span></li>
            <li><span className="runner-guide-controls__keys"><kbd>↓</kbd></span><span>누르고 있는 동안 슬라이딩</span></li>
            <li><span className="runner-guide-controls__keys"><kbd>P</kbd></span><span>일시정지와 다시 시작</span></li>
            <li><span className="runner-guide-controls__keys">터치 버튼</span><span>화면 양쪽 버튼으로 점프와 슬라이딩</span></li>
          </ul>
        </section>

        <section className="runner-guide-pickups" aria-labelledby="runner-guide-pickups-title">
          <h3 id="runner-guide-pickups-title">아이템</h3>
          <div className="runner-guide-pickups__grid">
            {items.map((item) => (
              <article className="runner-guide-item" key={item.title}>
                <span className="runner-guide-item__icon" aria-hidden="true">{item.icon}</span>
                <div><h4>{item.title}</h4><p>{item.description}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="runner-guide-passive" aria-labelledby="runner-guide-passive-title">
          <h3 id="runner-guide-passive-title">선택한 캐릭터 능력</h3>
          <div className="runner-guide-passive__content" style={{ '--character-accent': character.accentColor } as React.CSSProperties}>
            {passive.icon && <CharacterAbilityIcon icon={passive.icon} accentColor={character.accentColor} size={42} />}
            <div><h4>{passive.name}</h4><p>{passive.effectLabel}</p></div>
          </div>
        </section>

        <footer className="runner-guide-card__actions">
          {!firstRun && <button ref={actionRef} type="button" onClick={onClose}>일시정지로 돌아가기</button>}
          {firstRun && <button ref={actionRef} type="button" className="runner-guide-card__primary" onClick={onStart}>안내를 확인하고 시작</button>}
        </footer>
      </section>
    </div>
  );
}
