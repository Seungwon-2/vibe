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
    // Keep the trail above the scenery and pit art, while still behind the runner.
    this.art = scene.add.graphics().setDepth(-0.5);
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
    const lifeMs = intensified ? 760 : 520;
    const spawnEveryMs = intensified ? 36 : 65;
    this.spawnElapsedMs += Math.min(deltaMs, 50);
    while (this.spawnElapsedMs >= spawnEveryMs) {
      this.spawnElapsedMs -= spawnEveryMs;
      this.particles.push({
        x: x - 26 - Math.random() * 24,
        y: y - 10 + Math.random() * 20,
        bornAt: now,
        radius: intensified ? 4.2 + Math.random() * 2.4 : 3 + Math.random() * 1.8,
      });
    }
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      if (now - this.particles[index].bornAt > lifeMs) this.particles.splice(index, 1);
    }
    this.art.clear();
    for (const particle of this.particles) {
      const age = Math.max(0, Math.min(1, (now - particle.bornAt) / lifeMs));
      const particleX = particle.x - age * 28;
      const particleY = particle.y - age * 12;
      const radius = particle.radius * (1 - age * 0.4);
      const alpha = (1 - age) * (intensified ? 0.88 : 0.72);
      this.art.fillStyle(this.color, alpha * 0.22).fillCircle(particleX, particleY, radius * 2.5);
      this.art.fillStyle(this.color, alpha).fillCircle(particleX, particleY, radius);
      this.art.fillStyle(0xffffff, alpha * (intensified ? 0.9 : 0.68))
        .fillCircle(particleX, particleY, radius * 0.34);
      if (age < (intensified ? 0.8 : 0.62)) {
        const sparkleAlpha = alpha * (intensified ? 0.8 : 0.48);
        this.art.lineStyle(intensified ? 2 : 1.4, 0xffffff, sparkleAlpha)
          .lineBetween(particleX - radius * 1.35, particleY, particleX + radius * 1.35, particleY)
          .lineBetween(particleX, particleY - radius * 1.35, particleX, particleY + radius * 1.35);
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
