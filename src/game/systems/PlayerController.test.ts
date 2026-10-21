import { describe, expect, it, vi } from 'vitest';
import { PlayerController } from './PlayerController';
import type { ControlledActor, ControlledSprite } from './PlayerController';

function createController() {
  const sprite = {
    body: { blocked: { down: true }, touching: { down: false } },
    setVelocityX: vi.fn(),
    setVelocityY: vi.fn(),
    setPosition: vi.fn(),
    setFlipX: vi.fn(),
  } as unknown as ControlledSprite;
  const actor = {
    sprite,
    definition: { stats: { walkSpeed: 170, runSpeed: 250, jumpVelocity: -420 } },
    play: vi.fn(),
  } as unknown as ControlledActor;
  return { controller: new PlayerController(actor), actor, sprite };
}

describe('PlayerController', () => {
  it('maps movement and run input to character movement and animations', () => {
    const { controller, actor, sprite } = createController();

    controller.update({ left: false, right: true, jumpPressed: false, run: false }, 16);
    expect(sprite.setVelocityX).toHaveBeenLastCalledWith(170);
    expect(actor.play).toHaveBeenLastCalledWith('walk');

    controller.update({ left: true, right: false, jumpPressed: false, run: true }, 16);
    expect(sprite.setVelocityX).toHaveBeenLastCalledWith(-250);
    expect(sprite.setFlipX).toHaveBeenLastCalledWith(true);
    expect(actor.play).toHaveBeenLastCalledWith('run');
  });

  it('jumps only from the ground and reports respawn invulnerability', () => {
    const { controller, sprite } = createController();

    controller.update({ left: false, right: false, jumpPressed: true, run: false }, 16);
    expect(sprite.setVelocityY).toHaveBeenCalledWith(-420);
    expect(controller.state).toBe('jumping');

    controller.respawnAt(120, 300);
    expect(sprite.setPosition).toHaveBeenCalledWith(120, 300);
    expect(controller.isInvulnerable()).toBe(true);
    controller.update({ left: false, right: false, jumpPressed: false, run: false }, 1_500);
    expect(controller.isInvulnerable()).toBe(false);
  });

  it('replaces pickup effects, expires them after three seconds, and composes stage speed', () => {
    const { controller, sprite } = createController();
    controller.setStageSpeedMultiplier(0.8);
    controller.applySpeedModifier(1.25, 3_000);
    controller.update({ left: false, right: true, jumpPressed: false, run: true }, 1_500);
    expect(sprite.setVelocityX).toHaveBeenLastCalledWith(250);

    controller.applySpeedModifier(0.7, 3_000);
    controller.update({ left: false, right: true, jumpPressed: false, run: false }, 2_999);
    expect(sprite.setVelocityX).toHaveBeenLastCalledWith(170 * 0.7 * 0.8);
    expect(controller.getSpeedEffectRemainingMs()).toBe(1);

    controller.update({ left: false, right: true, jumpPressed: false, run: false }, 1);
    expect(controller.getCurrentSpeedMultiplier()).toBe(0.8);
  });
});
