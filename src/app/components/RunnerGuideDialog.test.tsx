import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCharacter } from '../../game/characters/characterCatalog';
import { RUNNER_CONFIG } from '../../game/runner/runnerConfig';
import { RunnerGuideDialog } from './RunnerGuideDialog';

afterEach(cleanup);

describe('RunnerGuideDialog', () => {
  it('explains controls, shared pickups, and character passive accessibly', () => {
    render(<RunnerGuideDialog mode="endless" character={getCharacter('player-default')} variant="first-run"
      portrait={false} onStart={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: '조작법과 아이템 안내' })).toBeInTheDocument();
    expect(screen.getByText(/공중에서 한 번 더 눌러 이단 점프/)).toBeInTheDocument();
    expect(screen.getByText(/화면 양쪽 버튼으로 점프와 슬라이딩/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${RUNNER_CONFIG.speedPickupMultiplier}배 속도로`))).toBeInTheDocument();
    expect(screen.getByText(/낭떠러지는 피해야 합니다/)).toBeInTheDocument();
    expect(screen.getByText('질주의 메이드')).toBeInTheDocument();
    expect(document.querySelector('.runner-guide-passive img')).toHaveAttribute('data-icon', 'rin-cloud-tailwind');
    expect(screen.getByRole('button', { name: '안내를 확인하고 시작' })).toHaveFocus();
  });

  it('shows mode-specific timer item behavior and the pause return action', () => {
    const onClose = vi.fn();
    const { rerender } = render(<RunnerGuideDialog mode="endless" character={getCharacter('player-default')}
      variant="pause-review" portrait={false} onStart={vi.fn()} onClose={onClose} />);
    expect(screen.getByText(/게이트를 통과할 때마다 제한 시간이 20초 늘어납니다/)).toBeInTheDocument();
    expect(screen.getByText(/시간 회복 아이템은 등장하지 않습니다/)).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();

    rerender(<RunnerGuideDialog mode="story" character={getCharacter('player-default')}
      variant="pause-review" portrait={false} onStart={vi.fn()} onClose={onClose} />);
    expect(screen.getByText(/제한 시간 대신 3초 동안 속도를 15% 높여줍니다/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '일시정지로 돌아가기' })).toBeInTheDocument();
  });

  it('reads the correct passive and icon for each playable character', () => {
    const cases = [
      ['player-default', '질주의 메이드', 'rin-cloud-tailwind'],
      ['hanayo-hiyori', '벚꽃 수호', 'hiyori-blossom-ward'],
      ['tokino-mary', '음표의 이끌림', 'mary-music-magnet'],
      ['goth-student', '고스트 슬라이드', 'toa-ghost-glide'],
      ['cogane-rang', '호랑이 탄력', 'rang-tiger-spring'],
    ] as const;
    for (const [characterId, name, icon] of cases) {
      const { unmount } = render(<RunnerGuideDialog mode="story" character={getCharacter(characterId)}
        variant="first-run" portrait={false} onStart={vi.fn()} onClose={vi.fn()} />);
      expect(screen.getByText(name)).toBeInTheDocument();
      expect(document.querySelector('.runner-guide-passive img')).toHaveAttribute('data-icon', icon);
      unmount();
    }
  });
});
