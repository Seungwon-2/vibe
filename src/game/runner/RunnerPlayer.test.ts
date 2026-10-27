import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { RunnerInputBridge } from './RunnerInput';
import { RunnerPlayer } from './RunnerPlayer';
import type { CharacterId } from '../characters/characterTypes';

function createPlayer(characterId: CharacterId) {
  const offset = { x: 0, y: 0 };
  const body = {
    blocked: { down: true },
    touching: { down: false },
    velocity: { y: 0 },
    position: { x: 0, y: 0 },
    width: 96,
    height: 96,
    sourceWidth: 96,
    sourceHeight: 96,
    enable: true,
    get bottom() { return body.position.y + body.height; },
    prev: { copy: vi.fn() },
    prevFrame: { copy: vi.fn() },
    setSize: vi.fn((width: number, height: number) => {
      body.sourceWidth = width;
      body.sourceHeight = height;
      body.width = width * sprite.scaleX;
      body.height = height * sprite.scaleY;
    }),
    setOffset: vi.fn((x: number, y: number) => { offset.x = x; offset.y = y; }),
    setVelocityY: vi.fn((value: number) => { body.velocity.y = value; }),
    setVelocity: vi.fn((_x: number, y: number) => { body.velocity.y = y; }),
    setAllowGravity: vi.fn(),
    updateFromGameObject: vi.fn(() => {
      body.width = body.sourceWidth * sprite.scaleX;
      body.height = body.sourceHeight * sprite.scaleY;
      body.position.y = sprite.y + (offset.y - 96) * sprite.scaleY;
    }),
  };
  const sprite = {
    body,
    y: 470,
    scaleX: 1,
    scaleY: 1,
    frame: { name: 'run-00' },
    setOrigin: vi.fn(),
    setPosition: vi.fn((_x: number, y: number) => { sprite.y = y; }),
    setScale: vi.fn((x: number, y = x) => { sprite.scaleX = x; sprite.scaleY = y; }),
    setAlpha: vi.fn(),
    anims: { play: vi.fn((key: string) => {
      sprite.frame.name = key.endsWith(':slide') ? 'slide-00' : 'run-00';
    }) },
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

  it('allows exactly two jumps, boosts Rang second jump, and resets on landing', () => {
    const { player, body, sprite } = createPlayer('cogane-rang');
    expect(player.jump()).toBe(true);
    expect(body.velocity.y).toBe(-420);
    body.blocked.down = false;
    expect(player.jump()).toBe(true);
    expect(body.velocity.y).toBeCloseTo(-453.6);
    expect(player.jump()).toBe(false);
    body.blocked.down = true;
    body.velocity.y = 0;
    player.update(16);
    expect(player.jump()).toBe(true);
    expect(sprite.anims.play).toHaveBeenCalledWith('cogane-rang:doubleJump', true);
  });

  it('switches to the falling frames once velocity changes sign without changing jump physics', () => {
    const { player, body, sprite } = createPlayer('player-default');
    player.jump();
    body.blocked.down = false;
    sprite.y = 360;
    body.updateFromGameObject();
    body.velocity.y = 40;
    player.update(16);
    expect(sprite.anims.play).toHaveBeenLastCalledWith('player-default:jump-fall', true);
    expect(body.velocity.y).toBe(40);
    player.update(16);
    expect(sprite.anims.play.mock.calls.filter(([key]) => key === 'player-default:jump-fall')).toHaveLength(1);
  });

  it('keeps the body bottom aligned while sliding and gives Toa release grace', () => {
    const { player, body, sprite } = createPlayer('goth-student');
    player.setSliding(true);
    expect(body.width).toBeCloseTo(64);
    expect(body.height).toBeCloseTo(48);
    expect(body.bottom).toBeCloseTo(470);
    expect(sprite.scaleX).toBe(0.72);
    expect(sprite.scaleY).toBe(0.72);
    expect(sprite.y).toBeGreaterThan(470);
    expect(player.jump()).toBe(false);
    player.setSliding(false);
    player.update(100);
    expect(player.isSliding).toBe(true);
    player.update(51);
    expect(player.isSliding).toBe(false);
    expect(body.setOffset).toHaveBeenLastCalledWith(28, 16);
    expect(sprite.scaleY).toBe(1);
  });

  it('holds one slide pose without switching frames while the button stays down', () => {
    const { player, body, sprite } = createPlayer('player-default');
    player.setSliding(true);
    expect(sprite.scaleX).toBe(1);
    expect(sprite.scaleY).toBe(1);
    expect(body.width).toBe(80);
    const firstY = sprite.y;
    const slideCalls = sprite.anims.play.mock.calls.length;
    player.update(16);
    player.update(16);
    expect(sprite.y).toBe(firstY);
    expect(sprite.anims.play.mock.calls.length).toBe(slideCalls);
    expect(body.position.y).toBeCloseTo(422);
    expect(body.bottom).toBeCloseTo(470);
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

  it('recovers a double jumper that crossed below the ground without a collider flag', () => {
    const { player, body, sprite } = createPlayer('player-default');
    player.jump();
    body.blocked.down = false;
    player.jump();
    body.velocity.y = 250;
    body.position.y = 464;
    sprite.y = 540;
    player.update(16);
    expect(sprite.y).toBe(474);
    expect(body.position.y).toBe(394);
    expect(body.velocity.y).toBe(0);
    expect(player.isGrounded).toBe(true);
    expect(player.jump()).toBe(true);
  });

  it('stops physics and plays the terminal animation only once', () => {
    const { player, body, sprite } = createPlayer('player-default');
    sprite.y = 360;
    body.velocity.y = -100;
    player.finish();
    player.finish();
    expect(body.enable).toBe(false);
    expect(body.setAllowGravity).toHaveBeenCalledWith(false);
    expect(sprite.y).toBe(474);
    expect(body.position.y).toBe(394);
    expect(sprite.anims.play).toHaveBeenLastCalledWith('player-default:gameOver', true);
    expect(sprite.anims.play).toHaveBeenCalledTimes(2); // run, then game-over
    expect(player.jump()).toBe(false);
  });

  it('can play a victory result without changing the default crying outcome', () => {
    const { player, sprite } = createPlayer('tokino-mary');
    player.finish('victory');
    expect(sprite.anims.play).toHaveBeenLastCalledWith('tokino-mary:victory', true);
  });
});
