import type Phaser from 'phaser';

type TrailParticle = { x: number; y: number; bornAt: number; radius: number };

const TRAIL_COLORS: Readonly<Record<string, number>> = {
  'trail-cloud': 0x86c5ff,
  'trail-petal': 0xf3a8d0,
  'trail-starlight': 0xffdf80,
  'trail-golden-notes': 0xe8bd66,
  'dawn-no-hit-trail': 0x87b8ef,
  'forest-no-hit-trail': 0xa9d69a,
  'mine-no-hit-trail': 0x9f9af0,
  'skyway-no-hit-trail': 0xf2c8ff,
};

/** Purely decorative particles; this layer never participates in Arcade physics. */
export class RunnerTrailEffect {
  private readonly art: Phaser.GameObjects.Graphics;
  private readonly particles: TrailParticle[] = [];
  private spawnElapsedMs = 0;
  private reducedMotion = false;
  private readonly color: number;
  private readonly motionPreference: MediaQueryList | null;

  constructor(scene: Phaser.Scene, cosmeticId: string | null) {
    this.color = cosmeticId ? TRAIL_COLORS[cosmeticId] ?? 0x9fb7ee : 0;
    this.art = scene.add.graphics().setDepth(-2);
    this.motionPreference = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    this.reducedMotion = this.motionPreference?.matches === true;
    this.motionPreference?.addEventListener?.('change', this.handleMotionPreference);
  }

  update(now: number, deltaMs: number, x: number, y: number, active: boolean, intensified: boolean): void {
    if (!this.color || this.reducedMotion || !active) {
      this.clear();
      return;
    }
    const lifeMs = intensified ? 540 : 360;
    const spawnEveryMs = intensified ? 48 : 92;
    this.spawnElapsedMs += Math.min(deltaMs, 50);
    while (this.spawnElapsedMs >= spawnEveryMs) {
      this.spawnElapsedMs -= spawnEveryMs;
      this.particles.push({
        x: x - 20 - Math.random() * 17,
        y: y - 7 + Math.random() * 14,
        bornAt: now,
        radius: intensified ? 2 + Math.random() * 2.2 : 1.3 + Math.random() * 1.4,
      });
    }
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      if (now - this.particles[index].bornAt > lifeMs) this.particles.splice(index, 1);
    }
    this.art.clear();
    for (const particle of this.particles) {
      const age = Math.max(0, Math.min(1, (now - particle.bornAt) / lifeMs));
      const alpha = (1 - age) * (intensified ? 0.58 : 0.3);
      this.art.fillStyle(this.color, alpha);
      this.art.fillCircle(particle.x - age * 19, particle.y - age * 9, particle.radius * (1 - age * 0.45));
      if (intensified && age < 0.65) {
        this.art.fillStyle(0xffffff, alpha * 0.65).fillCircle(particle.x - age * 19, particle.y - age * 9, 1);
      }
    }
  }

  clear(): void {
    this.spawnElapsedMs = 0;
    this.particles.length = 0;
    this.art.clear();
  }

  destroy(): void {
    this.motionPreference?.removeEventListener?.('change', this.handleMotionPreference);
    this.clear();
    this.art.destroy();
  }

  private readonly handleMotionPreference = (event: MediaQueryListEvent): void => {
    this.reducedMotion = event.matches;
    if (this.reducedMotion) this.clear();
  };
}
