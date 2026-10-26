import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { RunnerInputBridge } from './RunnerInput';
import { RunnerPlayer } from './RunnerPlayer';
import type { CharacterId } from '../characters/characterTypes';

function createPlayer(characterId: CharacterId) {
  const body = {
    blocked: { down: true },
    touching: { down: false },
    velocity: { y: 0 },
    setSize: vi.fn(),
    setOffset: vi.fn(),
    setVelocityY: vi.fn((value: number) => { body.velocity.y = value; }),
  };
  const sprite = {
    body,
    y: 470,
    setOrigin: vi.fn(),
    setPosition: vi.fn(),
    anims: { play: vi.fn() },
    destroy: vi.fn(),
  };
  return { player: new RunnerPlayer(sprite as unknown as Phaser.Physics.Arcade.Sprite, characterId), body, sprite };
}

describe('RunnerPlayer and input bridge', () => {
  it('queues a jump once per press and holds slide until release', () => {
    const input = new RunnerInputBridge();
    input.press('jump');
    input.press('jump');
    input.press('slide');
    expect(input.consumeFrame()).toEqual({ jumpPressed: true, slideHeld: true });
    expect(input.consumeFrame()).toEqual({ jumpPressed: false, slideHeld: true });
    input.release('jump');
    input.press('jump');
    expect(input.consumeFrame().jumpPressed).toBe(true);
    input.clear();
    expect(input.consumeFrame()).toEqual({ jumpPressed: false, slideHeld: false });
  });

  it('allows exactly two jumps, boosts Yuni second jump, and resets on landing', () => {
    const { player, body, sprite } = createPlayer('moonwing');
    expect(player.jump()).toBe(true);
    expect(body.velocity.y).toBe(-420);
    body.blocked.down = false;
    expect(player.jump()).toBe(true);
    expect(body.velocity.y).toBeCloseTo(-470.4);
    expect(player.jump()).toBe(false);
    body.blocked.down = true;
    body.velocity.y = 0;
    player.update(16);
    expect(player.jump()).toBe(true);
    expect(sprite.anims.play).toHaveBeenCalledWith('moonwing:doubleJump', true);
  });

  it('keeps the body bottom aligned while sliding and gives Toa release grace', () => {
    const { player, body } = createPlayer('goth-student');
    player.setSliding(true);
    expect(body.setSize).toHaveBeenLastCalledWith(40, 40);
    expect(body.setOffset).toHaveBeenLastCalledWith(28, 56);
    expect(player.jump()).toBe(false);
    player.setSliding(false);
    player.update(100);
    expect(player.isSliding).toBe(true);
    player.update(51);
    expect(player.isSliding).toBe(false);
    expect(body.setOffset).toHaveBeenLastCalledWith(28, 20);
  });

  it('rejects an airborne slide and restores run after landing', () => {
    const { player, body, sprite } = createPlayer('player-default');
    player.jump();
    body.blocked.down = false;
    player.setSliding(true);
    expect(player.isSliding).toBe(false);
    body.blocked.down = true;
    body.velocity.y = 0;
    player.update(16);
    expect(sprite.anims.play).toHaveBeenLastCalledWith('player-default:run', true);
  });
});
